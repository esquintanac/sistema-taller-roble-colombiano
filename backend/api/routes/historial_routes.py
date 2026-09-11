"""
Rutas del módulo de Historial.
Ruta: backend/api/routes/historial_routes.py
"""

from django.urls import path
from api.controllers import historial_controller

urlpatterns = [
    path("historial/", historial_controller.historial_lista, name="api-historial-lista"),
    path("historial/<int:id_historial>/", historial_controller.historial_detalle, name="api-historial-detalle"),
    path("historial/<int:id_historial>/revisar/", historial_controller.historial_marcar_revisado, name="api-historial-revisar"),
]