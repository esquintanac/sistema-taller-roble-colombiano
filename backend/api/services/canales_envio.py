"""
Canales de envío de artefactos de verificación (correo / SMS).
Ruta: backend/api/services/canales_envio.py

RNF de canal intercambiable: el motor de verificación (VerificacionService)
no sabe CÓMO se entrega el mensaje, solo QUÉ entregar. El canal activo se
elige por configuración (settings.CANAL_VERIFICACION), nunca en el código
del servicio. Así, activar SMS en el futuro es tocar settings.py y este
archivo, sin tocar flujos ni reglas de seguridad.

- CanalCorreo (activo hoy): django.core.mail. En desarrollo usa el backend
  de consola (el mensaje aparece en la terminal del servidor); en
  producción basta con descomentar el bloque SMTP de settings.py.
- CanalSMS (preparado, sin credenciales): adaptador listo para conectar
  Twilio u otro proveedor. Mientras no haya credenciales, serlo explícito
  (ErrorDeCanal) es mejor que fingir un envío: un código que nadie recibe
  bloquearía el acceso sin que el usuario sepa por qué.
"""

from django.conf import settings
from django.core.mail import send_mail


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
            # recuperación responder igual por la regla de no enumerar).
            raise ErrorDeCanal(f"No se pudo enviar el correo a {destino}") from error


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
    return CanalCorreo()