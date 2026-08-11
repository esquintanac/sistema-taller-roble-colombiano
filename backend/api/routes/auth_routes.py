"""
Rutas del módulo de autenticación.
Ruta: backend/api/routes/auth_routes.py
"""

from django.urls import path
from api.controllers import auth_controller

urlpatterns = [
    path("auth/registro/", auth_controller.registrar_usuario, name="api-registro"),
    path("auth/login/", auth_controller.iniciar_sesion, name="api-login"),
]