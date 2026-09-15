"""
Rutas del módulo de Modelo.
Ruta: backend/api/routes/modelo_routes.py
"""

from django.urls import path
from api.controllers import modelo_controller

urlpatterns = [
    path("modelos/", modelo_controller.modelos_lista, name="api-modelos-lista"),
    path("modelos/<int:id_modelo>/", modelo_controller.modelos_detalle, name="api-modelos-detalle"),
    path("modelos/<int:id_modelo>/diseno/", modelo_controller.modelos_calcular_diseno, name="api-modelos-diseno"),
    path("modelos/<int:id_modelo>/pdf/", modelo_controller.modelos_descargar_pdf, name="api-modelos-pdf"),
]