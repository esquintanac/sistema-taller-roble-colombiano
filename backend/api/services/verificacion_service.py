"""
Motor único de verificación de identidad.
Ruta: backend/api/services/verificacion_service.py

RNF: "Todo mecanismo de verificación de identidad debe aplicar las mismas
garantías de seguridad (expiración, límite de intentos, uso único),
independientemente del canal o propósito."

Un solo motor para los tres propósitos, diferenciando el ARTEFACTO que
recibe el usuario:

  proposito       formato      vigencia   quién lo usa
  --------------  -----------  ---------  -------------------------------
  'login'         6 dígitos    5 min      segundo factor tras credenciales
  'registro'      6 dígitos    5 min      confirma la propiedad del correo
  'recuperacion'  token largo  30 min     viaja dentro del enlace de correo

Garantías idénticas en los tres casos (las aplica este motor, no cada flujo):
  1. Hash SHA-256: el artefacto NUNCA se guarda en claro (filtrar la base
     no permite reconstruir ni el código ni el enlace).
  2. Expiración por formato (5 min / 30 min) y un solo uso: al confirmarse
     queda marcado como usado y no sirve de nuevo.
  3. Límite de intentos (MAX_INTENTOS) para artefactos de baja entropía:
     cada fallo cuenta y al agotarse el artefacto se bloquea. Los tokens de
     enlace se consultan por su valor (sin id) y su seguridad ya proviene
     de su entropía (token_urlsafe(32) >= 256 bits, fuerza bruta inviable);
     contarles intentos sería inaplicable sin conocer el valor previo.
  4. Cooldown uniforme (COOLDOWN_SEGUNDOS) por (proposito, destino): un
     reenvío dentro del plazo NO emite un artefacto nuevo. En recuperación
     la fila se registra exista o no la cuenta, para que el cooldown se
     comporte igual en ambos casos (sin fugas por enumeración).
  5. Un solo artefacto vigente por (proposito, destino): emitir uno nuevo
     invalida los anteriores.

El canal de entrega es intercambiable (ver canales_envio.py): hoy corre con
correo; el adaptador SMS queda preparado. En desarrollo (DEBUG=True) el
artefacto recién emitido se devuelve en codigo_demo / enlace_demo —al
estilo de enlace_demo— para poder probar sin leer la terminal; en
producción esos campos jamás viajan.
"""

import hashlib
import secrets
from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from api.models_api.verificacion_model import Verificacion
from api.services.canales_envio import canal_activo, ErrorDeCanal

# Vigencias por formato (el enlace conserva los 30 min de la recuperación
# ya probada; el código es más corto porque se lee y usa de inmediato).
VIGENCIA_CODIGO_MINUTOS = 5
VIGENCIA_ENLACE_MINUTOS = 30

# Intentos fallidos permitidos antes de bloquear el artefacto.
MAX_INTENTOS = 5

# Segundos mínimos entre emisiones para el mismo (proposito, destino).
COOLDOWN_SEGUNDOS = 60

# Origen del frontend React en desarrollo; debe coincidir con los puertos
# permitidos en CORS_ALLOWED_ORIGINS de settings.py.
URL_BASE_FRONTEND = "http://localhost:5173"

# Propósitos y su formato de artefacto.
PROPOSITOS = ("login", "registro", "recuperacion")
FORMATOS = {
    "login": "codigo",
    "registro": "codigo",
    "recuperacion": "enlace",
}


def _minutos_de(formato):
    """Vigencia en minutos del formato (codigo vs enlace)."""
    return VIGENCIA_CODIGO_MINUTOS if formato == "codigo" else VIGENCIA_ENLACE_MINUTOS


def _hashear(valor):
    """Hash SHA-256 del artefacto: lo único que se persiste en la base."""
    return hashlib.sha256(str(valor).encode("utf-8")).hexdigest()


def _generar_artefacto(formato):
    """6 dígitos legibles (codigo) o token largo no adivinable (enlace)."""
    if formato == "codigo":
        return f"{secrets.randbelow(1000000):06d}"
    return secrets.token_urlsafe(32)


def enmascarar(destino):
    """
    Versión apta para pantalla del destino: el correo completo solo lo debe
    ver su dueño (p. ej. 'j***n@gmail.com'); los teléfonos conservan los
    últimos 4 dígitos (canal SMS futuro).
    """
    if "@" in destino:
        local, _, dominio = destino.partition("@")
        if len(local) <= 1:
            return f"***@{dominio}"
        return f"{local[0]}***{local[-1]}@{dominio}"
    if len(destino) <= 4:
        return "***"
    return f"{'*' * (len(destino) - 4)}{destino[-4:]}"


def _construir_enlace(token):
    """URL completa del frontend que abre el formulario de nueva contraseña."""
    return f"{URL_BASE_FRONTEND}/restablecer/{token}"


def _contenido_codigo(nombre, codigo):
    """Asunto, texto y HTML del correo que entrega un código de 6 dígitos."""
    asunto = "Código de verificación - Taller del Roble Colombiano"
    texto = (
        f"Hola {nombre or 'usuario'}:\n\n"
        "Recibimos una solicitud para verificar tu identidad en el "
        "Taller del Roble Colombiano.\n\n"
        f"Tu código de verificación es: {codigo}\n"
        f"Vence en {VIGENCIA_CODIGO_MINUTOS} minutos y solo puede usarse "
        "una vez.\n\n"
        "Si no solicitaste este código, ignora este correo.\n\n"
        "Taller del Roble Colombiano"
    )
    html = f"""\
<html><body style="font-family: Arial, sans-serif; color: #2b2b2b;">
  <h2 style="color: #8a4a2b;">Taller del Roble Colombiano</h2>
  <p>Hola {nombre or 'usuario'}:</p>
  <p>Recibimos una solicitud para verificar tu identidad.</p>
  <p style="font-size: 28px; letter-spacing: 8px; font-weight: bold;">
    {codigo}
  </p>
  <p style="color: #666; font-size: 13px;">
    El código vence en {VIGENCIA_CODIGO_MINUTOS} minutos y solo puede
    usarse una vez.
  </p>
  <p style="color: #666; font-size: 13px;">
    Si no solicitaste este código, ignora este correo.
  </p>
</body></html>"""
    return asunto, texto, html


def _contenido_enlace(nombre, enlace):
    """Asunto, texto y HTML del correo que entrega el enlace de restablecer."""
    asunto = "Restablece tu contraseña - Taller del Roble Colombiano"
    texto = (
        f"Hola {nombre or 'usuario'}:\n\n"
        "Recibimos una solicitud para restablecer la contraseña de tu cuenta "
        "en el Taller del Roble Colombiano.\n\n"
        "Ingresa a este enlace para elegir una nueva contraseña "
        f"(vence en {VIGENCIA_ENLACE_MINUTOS} minutos):\n"
        f"{enlace}\n\n"
        "Si no solicitaste este cambio, ignora este correo: tu contraseña "
        "no se modificará.\n\n"
        "Taller del Roble Colombiano"
    )
    html = f"""\
<html><body style="font-family: Arial, sans-serif; color: #2b2b2b;">
  <h2 style="color: #8a4a2b;">Taller del Roble Colombiano</h2>
  <p>Hola {nombre or 'usuario'}:</p>
  <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
  <p>
    <a href="{enlace}"
       style="background: #8a4a2b; color: #ffffff; padding: 12px 20px;
              text-decoration: none; border-radius: 6px; display: inline-block;">
      Restablecer mi contraseña
    </a>
  </p>
  <p style="color: #666; font-size: 13px;">
    El enlace vence en {VIGENCIA_ENLACE_MINUTOS} minutos y solo puede
    usarse una vez.
    Si el botón no funciona, copia esta dirección en el navegador:<br>
    {enlace}
  </p>
  <p style="color: #666; font-size: 13px;">
    Si no solicitaste este cambio, ignora este correo.
  </p>
</body></html>"""
    return asunto, texto, html


class VerificacionService:

    @staticmethod
    def emitir(proposito, destino, id_usuario=None, nombre=None, enviar=True):
        """
        Crea (o refresca) el artefacto vigente de (proposito, destino) y lo
        envía por el canal activo. Si aún está en cooldown NO se emite uno
        nuevo: se reutiliza el vigente y se informa cuánto falta (evita el
        bombardeo de correos sin dejar al usuario sin salida).

        Devuelve un dict con id_verificacion, destino_enmascarado,
        expira_en_ms, reenviar_disponibles_en (segundos), enviado y —solo
        con DEBUG=True— codigo_demo / enlace_demo del artefacto recién
        emitido. `enviar=False` registra la solicitud sin entregar (usado
        por recuperación cuando no existe la cuenta: misma fila, mismo
        cooldown, misma respuesta).
        """
        if proposito not in PROPOSITOS:
            raise ValueError(f"Propósito de verificación desconocido: {proposito}")

        formato = FORMATOS[proposito]
        destino = destino.strip()
        ahora = timezone.now()
        filtro = {"proposito": proposito, "destino__iexact": destino}

        activo = (
            Verificacion.objects.filter(**filtro, usado=False)
            .order_by("-creado_en")
            .first()
        )

        # --- Cooldown uniforme: dentro del plazo no se emite otro artefacto.
        en_cooldown = False
        espera = 0
        if activo is not None:
            transcurrido = (ahora - activo.creado_en).total_seconds()
            if transcurrido < COOLDOWN_SEGUNDOS:
                en_cooldown = True
                espera = int(COOLDOWN_SEGUNDOS - transcurrido)

        if en_cooldown:
            registro = activo
            valor = None          # no hay artefacto nuevo que entregar
            enviado = False
        else:
            valor = _generar_artefacto(formato)
            if activo is not None:
                # Refresca la fila vigente y conserva su id: el frontend
                # mantiene el mismo id_verificacion entre reenvíos.
                (
                    Verificacion.objects.filter(**filtro, usado=False)
                    .exclude(pk=activo.pk)
                    .update(usado=True)
                )
                activo.id_usuario = id_usuario
                activo.valor_hash = _hashear(valor)
                activo.creado_en = ahora
                activo.expira_en = ahora + timedelta(minutes=_minutos_de(formato))
                activo.intentos = 0
                activo.save(
                    update_fields=[
                        "id_usuario", "valor_hash", "creado_en",
                        "expira_en", "intentos",
                    ]
                )
                registro = activo
            else:
                # Emisión fresca: cualquier resto anterior queda invalidado.
                Verificacion.objects.filter(**filtro, usado=False).update(usado=True)
                registro = Verificacion.objects.create(
                    proposito=proposito,
                    destino=destino,
                    id_usuario=id_usuario,
                    valor_hash=_hashear(valor),
                    creado_en=ahora,
                    expira_en=ahora + timedelta(minutes=_minutos_de(formato)),
                    intentos=0,
                    usado=False,
                )

            # --- Entrega por el canal activo (correo hoy, SMS preparado).
            enviado = False
            if enviar:
                if formato == "codigo":
                    asunto, texto, html = _contenido_codigo(nombre, valor)
                else:
                    asunto, texto, html = _contenido_enlace(
                        nombre, _construir_enlace(valor)
                    )
                try:
                    canal_activo().enviar(destino, asunto, texto, html)
                    enviado = True
                except ErrorDeCanal as error:
                    # El fallo del canal lo interpreta cada flujo (en
                    # recuperación la respuesta debe seguir siendo genérica);
                    # aquí solo queda constancia en el servidor.
                    print(f"[verificacion] {error}")

        resultado = {
            "id_verificacion": registro.id_verificacion,
            "proposito": proposito,
            "formato": formato,
            "destino_enmascarado": enmascarar(destino),
            "expira_en_ms": int(registro.expira_en.timestamp() * 1000),
            "reenviar_disponibles_en": espera,
            "enviado": enviado,
            "codigo_demo": None,
            "enlace_demo": None,
        }

        # Solo DEBUG (igual que enlace_demo): el artefacto recién emitido,
        # para poder probar sin leer la terminal del servidor. En
        # producción (DEBUG=False) estos campos jamás viajan.
        if settings.DEBUG and valor is not None:
            if formato == "codigo":
                resultado["codigo_demo"] = valor
            else:
                resultado["enlace_demo"] = _construir_enlace(valor)

        return resultado

    @staticmethod
    def buscar_por_id(id_verificacion):
        """Devuelve el registro por su id, o None si no existe (o es inválido)."""
        try:
            return Verificacion.objects.get(pk=int(id_verificacion))
        except (Verificacion.DoesNotExist, TypeError, ValueError):
            return None

    @staticmethod
    def confirmar(id_verificacion, valor, consumir=True, proposito_esperado=None):
        """
        Verifica un artefacto consultado por su id (flujos de código).
        Devuelve (exito, mensaje, registro). Si se indica proposito_esperado
        y el registro es de otro propósito, se rechaza ANTES de contar
        intentos o consumir: un código de registro no puede confirmar un
        login ni viceversa.

        Solo cuentan los FALLOS como intentos: verificar correctamente no
        consume intentos, y con consumir=True el éxito deja el artefacto
        marcado como usado en UN solo UPDATE condicional (si dos
        peticiones llegan a la vez, solo una puede consumirlo).
        """
        registro = VerificacionService.buscar_por_id(id_verificacion)
        if registro is None:
            return False, "La verificación ya no es válida. Solicita una nueva.", None
        if proposito_esperado and registro.proposito != proposito_esperado:
            return False, "La verificación ya no es válida. Solicita una nueva.", None

        if registro.usado:
            return False, "Este código ya fue usado. Solicita uno nuevo.", None
        if registro.expira_en < timezone.now():
            return False, "Este código expiró. Solicita uno nuevo.", None

        valor = str(valor or "").strip()
        if not valor or _hashear(valor) != registro.valor_hash:
            registro.intentos += 1
            bloqueado = registro.intentos >= MAX_INTENTOS
            if bloqueado:
                registro.usado = True
            registro.save(update_fields=["intentos", "usado"])
            if bloqueado:
                return (
                    False,
                    "Demasiados intentos fallidos: el código quedó "
                    "bloqueado. Solicita uno nuevo.",
                    None,
                )
            restantes = MAX_INTENTOS - registro.intentos
            if restantes == 1:
                fallo = "Código incorrecto. Te queda un intento antes de bloquearlo (1)."
            else:
                fallo = (
                    f"Código incorrecto. Te quedan {restantes} intentos "
                    "antes de bloquearlo."
                )
            return (
                False,
                fallo,
                None,
            )

        if consumir:
            if not VerificacionService.consumir(registro):
                return False, "Este código ya fue usado. Solicita uno nuevo.", None
        return True, "Código verificado.", registro

    @staticmethod
    def consumir(registro):
        """Marca el artefacto como usado en UN solo UPDATE condicional."""
        return (
            Verificacion.objects.filter(pk=registro.pk, usado=False)
            .update(usado=True)
            == 1
        )

    @staticmethod
    def buscar_por_valor(valor, proposito):
        """
        Localiza un artefacto por su valor y valida que todavía sirva
        (camino del enlace de recuperación). Devuelve (registro | None,
        mensaje).

        Nota de RNF: este camino no incrementa el contador de intentos
        porque no existe un id previo que contar, y la adivinación es
        inviable por la entropía del token (token_urlsafe(32) >= 256
        bits). El límite de intentos aplica en confirmar(), donde el
        artefacto de 6 dígitos se consulta por su id.
        """
        if not valor:
            return None, "El enlace no es válido. Solicita uno nuevo."
        registro = (
            Verificacion.objects.filter(
                proposito=proposito, valor_hash=_hashear(valor)
            )
            .order_by("-creado_en")
            .first()
        )
        if registro is None:
            return None, "El enlace no es válido. Solicita uno nuevo."
        if registro.usado:
            return None, "Este enlace ya fue usado. Solicita uno nuevo."
        if registro.expira_en < timezone.now():
            return None, "Este enlace expiró. Solicita uno nuevo."
        return registro, "El enlace es válido."