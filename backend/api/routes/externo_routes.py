"""
Rutas de las integraciones externas (Fase 7).
Ruta: backend/api/routes/externo_routes.py
"""

from django.urls import path
from api.controllers import externo_controller

urlpatterns = [
    path("externo/clima/", externo_controller.clima, name="api-externo-clima"),
    path("externo/divisa/", externo_controller.divisa, name="api-externo-divisa"),
]
