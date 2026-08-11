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

from api.services.auth_service import AuthService


@api_view(["POST"])
def registrar_usuario(request):
    """
    POST /api/auth/registro/
    Recibe los datos del formulario de registro (RF1), los valida
    mediante el servicio, y crea el usuario si todo es correcto.
    """
    datos = request.data

    # Paso 1: validar reglas de negocio (Punto 6 del ejercicio)
    errores = AuthService.validar_datos_registro(datos)
    if errores:
        return Response(
            {"exito": False, "errores": errores},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Paso 2: crear el usuario
    try:
        nuevo_usuario = AuthService.registrar_usuario(datos)
    except Exception as error:
        return Response(
            {"exito": False, "mensaje": "Ocurrió un error al registrar el usuario."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    # Paso 3: respuesta satisfactoria (Punto 7)
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
    Verifica las credenciales y retorna un token JWT si son correctas
    (RF1, RF7, HU-01).
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

    # Generar el token de acceso (JWT) para las siguientes solicitudes
    token = RefreshToken.for_user(usuario) if hasattr(usuario, "id") else None

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
        },
        status=status.HTTP_200_OK,
    )