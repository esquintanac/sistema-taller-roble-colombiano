"""
Canales de envío de artefactos de verificación (correo / SMS).
Ruta: backend/api/services/canales_envio.py

RNF de canal intercambiable: el motor de verificación (VerificacionService)
no sabe CÓMO se entrega el mensaje, solo QUÉ entregar. El canal activo se
elige por configuración (settings.CANAL_VERIFICACION), nunca en el código
del servicio. Así, activar SMS en el futuro es tocar settings.py y este
archivo, sin tocar flujos ni reglas de seguridad.

- CanalCorreo: django.core.mail. En desarrollo usa el backend de consola
  (el mensaje aparece en la terminal del servidor); en producción se
  activa definiendo EMAIL_HOST (SMTP) en el entorno.
- CanalCorreoBrevo (activa con BREVO_API_KEY): entrega por la API HTTP
  de Brevo sobre el puerto 443. Existe porque Railway bloquea el SMTP
  saliente (25/465/587) por defecto: ahí el SMTP falla con
  [Errno 101] Network is unreachable y solo tiene salida el tráfico
  HTTPS. Mismo contrato enviar() que el resto: el motor no nota el cambio.
- CanalSMS (preparado, sin credenciales): adaptador listo para conectar
  Twilio u otro proveedor. Mientras no haya credenciales, serlo explícito
  (ErrorDeCanal) es mejor que fingir un envío: un código que nadie recibe
  bloquearía el acceso sin que el usuario sepa por qué.
"""

from django.conf import settings
from django.core.mail import send_mail

import requests

# Timeout de la llamada a la API de correo (misma magnitud que
# settings.EMAIL_TIMEOUT del camino SMTP).
TIMEOUT_API_SEGUNDOS = 15


class ErrorDeCanal(Exception):
    """El canal activo no pudo entregar el mensaje."""


class CanalCorreo:
    """Envío de correos con django.core.mail (consola en dev / SMTP en prod)."""

    nombre = "correo"

    def enviar(self, destino, asunto, texto, html=None):
        try:
            send_mail(
                asunto,
                texto,
                settings.DEFAULT_FROM_EMAIL,
                [destino],
                html_message=html,
            )
        except Exception as error:
            # La capa superior decide qué hacer con el fallo (por ejemplo en
            # recuperación responder igual por la regla de no enumerar). La
            # causa raíz y el servidor SMTP viajan en el mensaje: sin ellos
            # los logs del servidor no dicen POR QUÉ ni CONTRA QUÉ falló
            # (auth rechazada, timeout, puerto equivocado, etc.).
            servidor = (
                f"{settings.EMAIL_HOST}:{getattr(settings, 'EMAIL_PORT', '-')}"
            )
            raise ErrorDeCanal(
                f"No se pudo enviar el correo a {destino} vía {servidor}: {error}"
            ) from error


class CanalCorreoBrevo:
    """
    Envío de correos por la API HTTP de Brevo (puerto 443).

    Por qué existe: en Railway el SMTP saliente está bloqueado por
    defecto (25/465/587 -> [Errno 101] Network is unreachable); el
    tráfico HTTPS sí tiene salida, así que este adaptador entrega el
    mensaje por https://api.brevo.com con una API key (cuenta gratuita:
    300 correos/día). Mismo contrato enviar() que los demás canales:
    el motor de verificación no nota el cambio.
    """

    nombre = "correo"

    def enviar(self, destino, asunto, texto, html=None):
        payload = {
            "sender": {
                "name": settings.BREVO_FROM_NAME,
                "email": settings.BREVO_FROM_EMAIL,
            },
            "to": [{"email": destino}],
            "subject": asunto,
            "textContent": texto,
        }
        if html:
            payload["htmlContent"] = html
        try:
            respuesta = requests.post(
                settings.BREVO_API_URL,
                headers={
                    "api-key": settings.BREVO_API_KEY,
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=TIMEOUT_API_SEGUNDOS,
            )
        except requests.RequestException as error:
            # Sin respuesta (red/DNS/timeout): la causa viaja al log.
            raise ErrorDeCanal(
                f"La API de correo (Brevo) no respondió para {destino}: {error}"
            ) from error
        if respuesta.status_code >= 400:
            # Brevo explica el motivo en el cuerpo (remitente no
            # verificado, key inválida, etc.): se corta a 300 chars
            # para que el log del servidor quede legible.
            raise ErrorDeCanal(
                f"La API de correo (Brevo) respondió "
                f"{respuesta.status_code} para {destino}: "
                f"{respuesta.text[:300]}"
            )
        return respuesta


class CanalSMS:
    """
    Adaptador SMS preparado (todavía sin credenciales de proveedor).

    Para activarlo en el futuro:
      1. En settings.py: CANAL_VERIFICACION = 'sms' y descomentar/llenar
         SMS_PROVIDER, SMS_API_KEY, SMS_FROM_NUMBER (bloque de configuración
         SMS ya preparado al final de settings.py).
      2. Instalar el SDK del proveedor elegido (por ejemplo `twilio`) y
         completar el método enviar() con la llamada REST correspondiente.
      3. El texto del mensaje es el que arma VerificacionService: el canal
         solo transporta, no compone.

    Mientras esté sin configurar, enviar() lanza ErrorDeCanal con una
    indicación clara: es preferible un error explícito a simular un envío.
    """

    nombre = "sms"

    def enviar(self, destino, asunto, texto, html=None):
        raise ErrorDeCanal(
            "El canal SMS no está configurado: faltan credenciales de "
            "proveedor (settings.SMS_*). Usa CANAL_VERIFICACION='correo' "
            "o completa la integración del proveedor SMS."
        )


def canal_activo():
    """Devuelve la instancia del canal elegido en settings (por defecto correo)."""
    nombre = getattr(settings, "CANAL_VERIFICACION", "correo")
    if nombre == "sms":
        return CanalSMS()
    # Con BREVO_API_KEY definida la entrega es por API HTTPS en vez de
    # SMTP: en Railway el SMTP saliente está bloqueado por defecto y la
    # API de Brevo sale por el 443, que siempre tiene ruta.
    if getattr(settings, "BREVO_API_KEY", ""):
        return CanalCorreoBrevo()
    return CanalCorreo()