"""
Decoradores de autenticacion y autorizacion basados en JWT.
Ruta: backend/api/middlewares/auth_decorators.py

El sistema autentica contra la tabla Usuario propia (no al
modelo de usuario nativo de Django), por lo que no usamos
rest_framework_simplejwt.authentication.JWTAuthentication directamente
-esa clase asume AUTH_USER_MODEL-. En su lugar, decodificamos el
token manualmente reutilizando las clases criptograficas de
simplejwt (firma y expiracion), y adjuntamos los datos del usuario
como un diccionario simple en request.usuario_actual.
"""

from functools import wraps
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError

def _extraer_usuario_del_token(request):
    """
    Lee el header 'Authorization: Bearer <token>', valida su firma
    y expiracion, y retorna un diccionario con los datos del usuario
    (extraidos de los claims del propio token), o None si es invalido.
    """
    encabezado = request.headers.get("Authorization", "")
    if not encabezado.startswith("Bearer "):
        return None

    token_str = encabezado.split(" ")[1]
    try:
        token = AccessToken(token_str) # valida firma y expiracion automaticamente
    except TokenError:
        return None

    return {
        "id_usuario": token.get("id_usuario"),
        "usuario": token.get("usuario"),
        "rol": token.get("rol"),
        "nombre": token.get("nombre"),
    }

def requiere_autenticacion(vista):
    """Exige un token JWT valido. Adjunta request.usuario_actual con los datos del usuario."""
    @wraps(vista)
    def envoltura(request, *args, **kwargs):
        usuario_actual = _extraer_usuario_del_token(request)
        if usuario_actual is None:
            return Response(
                {"exito": False, "mensaje": "Token invalido, expirado o no proporcionado.",},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        request.usuario_actual = usuario_actual
        return vista(request, *args, **kwargs)
    return envoltura

def requiere_rol(*roles_permitidos):
    """
    Exige autenticacion y que el rol del usuario este entre los
    roles permitidos para ese endpoint.
    Uso: @requiere_rol("Administrador")
        @requiere_rol("Administrador", "Carpintero")
    """
    def decorador(vista):
        @wraps(vista)
        @requiere_autenticacion
        def envoltura(request, *args, **kwargs):
            if request.usuario_actual["rol"] not in roles_permitidos:
                return Response(
                    {"exito": False, "mensaje": "No tienes permiso para realizar esta accion."},
                    status=status.HTTP_403_FORBIDDEN,
                )
            return vista(request, *args, **kwargs)
        return envoltura
    return decorador