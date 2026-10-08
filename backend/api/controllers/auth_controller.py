"""
Controlador de autenticación: recibe la solicitud HTTP, delega la
lógica al servicio, y construye la respuesta HTTP con el código de
estado correcto.
Ruta: backend/api/controllers/auth_controller.py
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from api.middlewares.auth_decorators import requiere_autenticacion

from api.models_api.usuario_model import Usuario
from api.services.auth_service import AuthService
from api.services.recuperacion_service import RecuperacionService
from api.services.verificacion_service import VerificacionService
import re


def _respuesta_verificacion(resultado):
    """
    Bloque 'verificacion' común de las respuestas que inician un proceso
    (login, solicitar registro, reenviar): solo datos para que el frontend
    muestre el destino enmascarado y el temporizador — nunca tokens.
    """
    bloque = {
        "id_verificacion": resultado["id_verificacion"],
        "destino_enmascarado": resultado["destino_enmascarado"],
        "expira_en_ms": resultado["expira_en_ms"],
        "reenviar_disponibles_en": resultado["reenviar_disponibles_en"],
    }
    respuesta = {"verificacion": bloque}
    # Solo DEBUG: el código recién emitido, para probar sin terminal.
    if resultado.get("codigo_demo"):
        respuesta["codigo_demo"] = resultado["codigo_demo"]
    return respuesta


def _fallo_de_envio(resultado):
    """
    Verdadero cuando el canal no entregó el código y no hay código_demo
    (DEBUG) que permita continuar: el usuario quedaría esperando un correo
    que nunca llega, así que se responde 502 en vez de un 200 engañoso.
    En cooldown (reenviar_disponibles_en > 0) NO es fallo: el código se
    envió hace menos de un minuto.
    """
    return (
        not resultado["enviado"]
        and not resultado.get("codigo_demo")
        and resultado["reenviar_disponibles_en"] <= 0
    )


@api_view(["POST"])
def solicitar_registro(request):
    """
    POST /api/auth/registro/solicitar/
    Paso 1 del registro (RF1): valida los datos del formulario —incluida
    la unicidad de correo y usuario— y solo si todo está bien hace emitir
    el código de verificación de 6 dígitos al correo informado. Si los
    datos tienen errores no se envía ningún código.
    """
    datos = request.data
    errores = AuthService.validar_datos_registro(datos)
    if errores:
        return Response(
            {"exito": False, "errores": errores},
            status=status.HTTP_400_BAD_REQUEST,
        )

    resultado = VerificacionService.emitir(
        "registro",
        str(datos.get("correo", "")).strip(),
        id_usuario=None,                      # la cuenta aún no existe
        nombre=str(datos.get("nombre", "")).strip(),
    )
    if _fallo_de_envio(resultado):
        return Response(
            {"exito": False, "mensaje": "No fue posible enviar el código de verificación. Intenta más tarde."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    respuesta = {
        "exito": True,
        "mensaje": "Código de verificación enviado a tu correo.",
    }
    respuesta.update(_respuesta_verificacion(resultado))
    return Response(respuesta, status=status.HTTP_200_OK)


@api_view(["POST"])
def registrar_usuario(request):
    """
    POST /api/auth/registro/
    Paso 2 del registro: recibe los datos del formulario (RF1) MÁS el
    id_verificacion y el código de 6 dígitos del paso 1. Los datos se
    (re)validan primero; el código se consume recién cuando todo está
    correcto, y solo entonces se crea el usuario. Así un formulario
    inválido no quema el código enviado.
    """
    datos = request.data

    # Paso 1: validar reglas de negocio (Punto 6 del ejercicio)
    errores = AuthService.validar_datos_registro(datos)
    if errores:
        return Response(
            {"exito": False, "errores": errores},
            status=status.HTTP_400_BAD_REQUEST,
        )

    id_verificacion = datos.get("id_verificacion")
    codigo = str(datos.get("codigo", "") or "").strip()
    if not id_verificacion or not codigo:
        return Response(
            {"exito": False, "errores": ["El código de verificación es obligatorio."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # El código debe corresponder a ESTE registro (mismo propósito y mismo
    # correo): se comprueba antes de consumirlo para no quemarlo por un
    # cruce de datos indebido.
    correo = str(datos.get("correo", "")).strip().lower()
    registro_previo = VerificacionService.buscar_por_id(id_verificacion)
    if (
        registro_previo is None
        or registro_previo.proposito != "registro"
        or registro_previo.destino.lower() != correo
    ):
        return Response(
            {"exito": False, "errores": ["El código de verificación no es válido para este registro."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Paso 2: validar y consumir el código (cada fallo cuenta intento).
    exito, mensaje, _registro = VerificacionService.confirmar(
        id_verificacion, codigo, proposito_esperado="registro"
    )
    if not exito:
        return Response(
            {"exito": False, "errores": [mensaje]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Paso 3: crear el usuario
    try:
        nuevo_usuario = AuthService.registrar_usuario(datos)
    except Exception:
        return Response(
            {"exito": False, "mensaje": "Ocurrió un error al registrar el usuario."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Paso 4: respuesta satisfactoria (Punto 7)
    return Response(
        {
            "exito": True,
            "mensaje": "Usuario registrado correctamente.",
            "usuario": {
                "id": nuevo_usuario.id_usuario,
                "nombre": nuevo_usuario.nombre,
                "usuario": nuevo_usuario.usuario,
                "rol": nuevo_usuario.rol_usuario,
            },
        },
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
def iniciar_sesion(request):
    """
    POST /api/auth/login/
    Verifica las credenciales (RF1, RF7, HU-01) y, si son correctas, hace
    emitir el código de verificación de 6 dígitos por el canal activo.
    NO entrega JWT: los tokens recién se emiten en
    /api/auth/verificacion/confirmar/ tras validar el código (RNF).
    """
    usuario_input = request.data.get("usuario", "")
    contrasena_input = request.data.get("contrasena", "")

    if not usuario_input or not contrasena_input:
        return Response(
            {"exito": False, "mensaje": "Usuario y contraseña son obligatorios."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    usuario = AuthService.autenticar(usuario_input, contrasena_input)

    if usuario is None:
        # Respuesta de error (Punto 7) — mensaje genérico por seguridad
        return Response(
            {"exito": False, "mensaje": "Usuario o contraseña incorrectos."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    # Segundo factor (RNF): las credenciales son correctas, pero AQUÍ
    # todavía NO se emite ningún JWT. El motor hace llegar el código al
    # canal activo (correo hoy) con expiración, límite de intentos y
    # cooldown; la sesión real se activa al confirmarlo.
    resultado = VerificacionService.emitir(
        "login",
        usuario.correo,
        id_usuario=usuario.id_usuario,
        nombre=usuario.nombre,
    )
    if _fallo_de_envio(resultado):
        return Response(
            {"exito": False, "mensaje": "No fue posible enviar el código de verificación. Intenta más tarde."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    respuesta = {
        "exito": True,
        "mensaje": "Código de verificación enviado a tu correo.",
        "usuario": {
            "id": usuario.id_usuario,
            "nombre": usuario.nombre,
            "usuario": usuario.usuario,
            "rol": usuario.rol_usuario,
        },
    }
    respuesta.update(_respuesta_verificacion(resultado))
    return Response(respuesta, status=status.HTTP_200_OK)


@api_view(["POST"])
def confirmar_verificacion(request):
    """
    POST /api/auth/verificacion/confirmar/
    Paso 2 del login (segundo factor): recibe el id de la verificación
    pendiente y el código de 6 dígitos. Solo con el código correcto se
    emite el par JWT (refresh + access); cada fallo cuenta un intento y
    al agotarse el código queda bloqueado.
    """
    id_verificacion = request.data.get("id_verificacion")
    codigo = str(request.data.get("codigo", "") or "").strip()

    if not id_verificacion or not codigo:
        return Response(
            {"exito": False, "mensaje": "El código de verificación es obligatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    exito, mensaje, registro = VerificacionService.confirmar(
        id_verificacion, codigo, proposito_esperado="login"
    )
    if not exito:
        return Response(
            {"exito": False, "mensaje": mensaje},
            status=status.HTTP_400_BAD_REQUEST,
        )

    usuario = Usuario.objects.filter(id_usuario=registro.id_usuario).first()
    if usuario is None:
        return Response(
            {"exito": False, "mensaje": "La verificación ya no es válida. Solicita una nueva."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Generación manual del token: se crea vacío y se le asignan los
    # claims personalizados con los datos que necesitamos reconocer en
    # cada solicitud protegida (mismo formato que el login de siempre).
    refresh = RefreshToken()
    refresh["id_usuario"] = usuario.id_usuario
    refresh["usuario"] = usuario.usuario
    refresh["rol"] = usuario.rol_usuario
    refresh["nombre"] = usuario.nombre

    return Response(
        {
            "exito": True,
            "mensaje": "Inicio de sesión exitoso.",
            "usuario": {
                "id": usuario.id_usuario,
                "nombre": usuario.nombre,
                "usuario": usuario.usuario,
                "rol": usuario.rol_usuario,
            },
            "tokens": {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def reenviar_verificacion(request):
    """
    POST /api/auth/verificacion/reenviar/
    Emite un código nuevo para una verificación pendiente de login o
    registro. El motor aplica el cooldown por (proposito, destino): si
    aún no pasó el minuto NO se envía otro correo y la respuesta informa
    cuántos segundos faltan (para que la UI muestre la cuenta regresiva).
    """
    id_verificacion = request.data.get("id_verificacion")
    registro = VerificacionService.buscar_por_id(id_verificacion)
    if (
        registro is None
        or registro.usado
        or registro.proposito not in ("login", "registro")
    ):
        return Response(
            {"exito": False, "mensaje": "La verificación ya no es válida. Vuelve a iniciar el proceso."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Nombre para el saludo del correo: el del dueño de la cuenta si existe
    # (login), o el informado en el propio formulario (registro, donde la
    # cuenta aún no existe). Se le quitan saltos de línea por prudencia.
    nombre = None
    if registro.id_usuario is not None:
        propietario = Usuario.objects.filter(id_usuario=registro.id_usuario).first()
        nombre = propietario.nombre if propietario else None
    else:
        nombre = (
            str(request.data.get("nombre", "") or "")
            .replace("\r", " ")
            .replace("\n", " ")
            .strip()[:60]
            or None
        )

    resultado = VerificacionService.emitir(
        registro.proposito,
        registro.destino,
        id_usuario=registro.id_usuario,
        nombre=nombre,
    )
    if _fallo_de_envio(resultado):
        return Response(
            {"exito": False, "mensaje": "No fue posible enviar el código de verificación. Intenta más tarde."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    respuesta = {
        "exito": True,
        "mensaje": "Código de verificación enviado a tu correo.",
    }
    respuesta.update(_respuesta_verificacion(resultado))
    return Response(respuesta, status=status.HTTP_200_OK)


@api_view(["POST"])
def refrescar_token(request):
    """
    POST /api/auth/refresh/
    Canjea un refresh token vigente por un access token nuevo, para que el
    usuario pueda seguir trabajando sin tener que volver a iniciar sesión.

    NO lleva @requiere_autenticacion a propósito: el refresh token ES la
    credencial de esta llamada. El access token ya venció, que es justo el
    motivo por el que se está pidiendo uno nuevo.
    """
    refresh_input = request.data.get("refresh", "")
    if not refresh_input:
        return Response(
            {"exito": False, "mensaje": "El refresh token es obligatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        # Validar el refresh (firma y expiracion) y derivar un access nuevo.
        # SimpleJWT copia los claims personalizados del refresh (id_usuario,
        # usuario, rol, nombre) al access, excepto type/exp/jti. Por eso el
        # token resultante sirve tal cual para los decoradores de
        # autenticacion, sin tocar nada del resto del backend.
        refresh = RefreshToken(refresh_input)
        access_nuevo = str(refresh.access_token)
    except TokenError:
        # Refresh invalido o vencido (vive 1 dia: SIMPLE_JWT en settings.py).
        # Llegado este punto la sesion ya no se puede recuperar, asi que el
        # frontend debe mandar al usuario a iniciar sesion de nuevo.
        return Response(
            {"exito": False, "mensaje": "El refresh token no es valido o ya expiro."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    return Response(
        {"exito": True, "access": access_nuevo},
        status=status.HTTP_200_OK,
    )


@api_view(["GET"])
@requiere_autenticacion
def perfil(request):
    """
    GET /api/auth/perfil/
    Endpoint de prueba: retorna los datos del usuario autenticado
    segun el token enviado. Sirve para verificar que la autenticacion
    JWT funciona antes de proteger el resto de los endpoints.
    """
    return Response({"exito": True, "usuario": request.usuario_actual}, status=status.HTTP_200_OK)


# Formato mínimo de correo, igual que el que exige AuthService.validar_datos_registro.
PATRON_CORREO = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


@api_view(["POST"])
def solicitar_recuperacion(request):
    """
    POST /api/auth/contrasena/olvidada/
    Paso 1 de la recuperación de contraseña: recibe el correo del usuario y
    el servicio envía (por correo) el enlace de un solo uso. La respuesta es
    idéntica exista o no la cuenta, para no revelar qué correos registrados.
    """
    correo = str(request.data.get("correo", "")).strip()

    if not correo:
        return Response(
            {"exito": False, "mensaje": "El correo electrónico es obligatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not re.match(PATRON_CORREO, correo):
        return Response(
            {"exito": False, "mensaje": "El correo electrónico no tiene un formato válido."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    resultado = RecuperacionService.solicitar_recuperacion(correo)
    respuesta = {"exito": True, "mensaje": resultado["mensaje"]}
    # Solo en desarrollo (DEBUG=True): el enlace listo para abrirlo sin abrir
    # la terminal del servidor. Nunca viaja en producción (DEBUG=False).
    if resultado.get("enlace_demo"):
        respuesta["enlace_demo"] = resultado["enlace_demo"]
    # Cooldown del motor unificado: dentro del minuto no se envía otro
    # enlace. El motor registra la solicitud exista o no la cuenta, así
    # que este dato es idéntico en ambos casos (no delata cuáles correos
    # están registrados) y por eso puede viajar también en producción.
    if resultado.get("reenviar_disponibles_en", 0) > 0:
        respuesta["cooldown_segundos"] = resultado["reenviar_disponibles_en"]
    return Response(respuesta, status=status.HTTP_200_OK)


@api_view(["GET"])
def validar_token_recuperacion(request):
    """
    GET /api/auth/contrasena/validar-token/?token=...
    Confirma si el enlace de la URL sigue vigente antes de mostrar el
    formulario de la nueva contraseña (evita que el usuario escriba su
    contraseña nueva para que al final le digan que el enlace venció).
    """
    token = str(request.query_params.get("token", "")).strip()
    if not token:
        return Response(
            {"exito": False, "mensaje": "El token es obligatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    valido, mensaje = RecuperacionService.validar_token(token)
    return Response(
        {"exito": True, "valido": valido, "mensaje": mensaje},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
def restablecer_contrasena(request):
    """
    POST /api/auth/contrasena/restablecer/
    Paso 2: canjea el token de un solo uso por la contraseña nueva.
    Si el token no sirve (inválido, usado o vencido) responde 400 con el
    motivo, para que el frontend ofrezca pedir uno nuevo.
    """
    token = str(request.data.get("token", "")).strip()
    contrasena = str(request.data.get("contrasena", ""))

    if not token or not contrasena:
        return Response(
            {"exito": False, "mensaje": "El token y la contraseña son obligatorios."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    exito, mensaje = RecuperacionService.restablecer_contrasena(token, contrasena)
    return Response(
        {"exito": exito, "mensaje": mensaje},
        status=status.HTTP_200_OK if exito else status.HTTP_400_BAD_REQUEST,
    )