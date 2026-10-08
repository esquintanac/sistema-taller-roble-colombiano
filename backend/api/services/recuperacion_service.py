"""
Fachada del flujo de recuperación de contraseña por correo.
Ruta: backend/api/services/recuperacion_service.py

Esta capa NO sabe nada de HTTP. Es una fachada DELGADA sobre el motor
único de verificación (VerificacionService): toda la seguridad —hash
SHA-256, vigencia, límite de intentos, cooldown y un solo artefacto
vigente por (proposito, destino)— vive allí, compartida con login y
registro, tal como exige el RNF de garantías uniformes. Aquí solo se
conserva lo propio de ESTE flujo:

1. La política de mensaje genérico: la respuesta es SIEMPRE la misma
   exista o no la cuenta (no se puede adivinar qué correos registrados).
   Para eso el motor registra la solicitud aunque no exista la cuenta
   (id_usuario NULL), sin enviar el correo: mismo fila, mismo cooldown,
   misma respuesta en ambos casos.
2. La elección del artefacto: formato 'enlace' (token largo de 30 min
   que viaja dentro de la URL de restablecer), no el código de 6 dígitos
   de login/registro.
3. El canje del enlace vigente por la contraseña nueva (una sola vez).

El correo se envía con django.core.mail por el canal activo (hoy correo
con backend de consola: el mensaje aparece en la terminal del servidor;
en producción solo se cambia EMAIL_BACKEND en settings.py sin tocar este
archivo). El enlace_demo solo se incluye con DEBUG=True para probar sin
leer la terminal y nunca viaja en producción.

Limitación documentada: cambiar la contraseña NO revoca los JWT ya
emitidos (el refresh vive 1 día). Como mejora futura se puede llevar una
lista negra de "jti" para expulsar las sesiones abiertas.
"""

from django.contrib.auth.hashers import make_password

from api.models_api.usuario_model import Usuario
from api.services.verificacion_service import (
    VerificacionService,
    VIGENCIA_ENLACE_MINUTOS,
)

# Vigencia del enlace (la aplica el motor; se reexporta para referencia).
MINUTOS_VIGENCIA = VIGENCIA_ENLACE_MINUTOS

# Propósito de este flujo dentro del motor unificado.
PROPOSITO = "recuperacion"

# Único mensaje que verá quien solicite la recuperación, exista o no el
# correo: respeta la regla de no revelar cuentas registradas.
MENSAJE_GENERICO = (
    "Si existe una cuenta asociada a ese correo, recibirás un mensaje con "
    "el enlace para restablecer tu contraseña."
)


class RecuperacionService:

    @staticmethod
    def solicitar_recuperacion(correo):
        """
        Genera y envía el enlace de recuperación vía el motor unificado.
        Siempre devuelve el MENSAJE_GENERICO; el enlace_demo solo se
        incluye con DEBUG=True (desarrollo) y nunca viaja en producción.
        """
        correo = correo.strip()
        usuario = Usuario.objects.filter(correo__iexact=correo).first()

        # Sin cuenta: se registra la solicitud (enviar=False) para que el
        # cooldown se comporte igual que con cuenta — la respuesta nunca
        # cambia, así no se puede enumerar correos registrados.
        resultado = VerificacionService.emitir(
            PROPOSITO,
            correo,
            id_usuario=usuario.id_usuario if usuario else None,
            nombre=usuario.nombre if usuario else None,
            enviar=usuario is not None,
        )

        return {
            "mensaje": MENSAJE_GENERICO,
            "enlace_demo": resultado["enlace_demo"],
            "reenviar_disponibles_en": resultado["reenviar_disponibles_en"],
        }

    @staticmethod
    def validar_token(token):
        """Devuelve (es_valido, mensaje) para la pantalla de restablecimiento."""
        registro, mensaje = VerificacionService.buscar_por_valor(
            str(token or "").strip(), PROPOSITO
        )
        return registro is not None, mensaje

    @staticmethod
    def restablecer_contrasena(token, contrasena):
        """
        Cambia la contraseña del usuario dueño del enlace. Devuelve
        (exito, mensaje); la contraseña siempre se guarda hasheada.
        """
        # Misma regla que el registro (AuthService.validar_datos_registro).
        if len(contrasena) < 6:
            return False, "La contraseña debe tener al menos 6 caracteres."

        registro, mensaje = VerificacionService.buscar_por_valor(
            str(token or "").strip(), PROPOSITO
        )
        if registro is None:
            return False, mensaje
        if registro.id_usuario is None:
            # Fila creada para un correo sin cuenta: nunca se envió enlace.
            return False, "El enlace no es válido. Solicita uno nuevo."

        # Consumo del enlace en UN solo UPDATE: si dos peticiones llegan
        # con el mismo enlace a la vez, solo una puede marcarlo como usado.
        if not VerificacionService.consumir(registro):
            return False, "Este enlace ya fue usado. Solicita uno nuevo."

        Usuario.objects.filter(id_usuario=registro.id_usuario).update(
            contrasena=make_password(contrasena)  # hash seguro, igual que el registro
        )
        return True, "Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión."