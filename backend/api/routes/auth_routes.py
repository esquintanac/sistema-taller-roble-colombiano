"""
Rutas del módulo de autenticación.
Ruta: backend/api/routes/auth_routes.py
"""

from django.urls import path
from api.controllers import auth_controller

urlpatterns = [
    # Registro en dos pasos: primero el código de verificación al correo,
    # después la creación del usuario con ese código consumido.
    path(
        "auth/registro/solicitar/",
        auth_controller.solicitar_registro,
        name="api-registro-solicitar",
    ),
    path("auth/registro/", auth_controller.registrar_usuario, name="api-registro"),
    # Login en dos pasos: credenciales -> código enviado, y el par JWT
    # recién se emite al confirmar el código (segundo factor, RNF).
    path("auth/login/", auth_controller.iniciar_sesion, name="api-login"),
    path(
        "auth/verificacion/confirmar/",
        auth_controller.confirmar_verificacion,
        name="api-verificacion-confirmar",
    ),
    path(
        "auth/verificacion/reenviar/",
        auth_controller.reenviar_verificacion,
        name="api-verificacion-reenviar",
    ),
    path("auth/refresh/", auth_controller.refrescar_token, name="api-refresh"),
    path("auth/perfil/", auth_controller.perfil, name="api-perfil"),
    # Recuperación de contraseña (flujo público, sin JWT):
    # 1) pedir el enlace por correo, 2) validar el enlace de la URL,
    # 3) canjearlo por la contraseña nueva. Por debajo comparte el motor
    # unificado de verificación con login y registro.
    path(
        "auth/contrasena/olvidada/",
        auth_controller.solicitar_recuperacion,
        name="api-contrasena-olvidada",
    ),
    path(
        "auth/contrasena/validar-token/",
        auth_controller.validar_token_recuperacion,
        name="api-contrasena-validar-token",
    ),
    path(
        "auth/contrasena/restablecer/",
        auth_controller.restablecer_contrasena,
        name="api-contrasena-restablecer",
    ),
]