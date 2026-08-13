"""
Rutas del modulo de Materiales.
Ruta: backend/api/routes/material_routes.py
"""

from django.urls import path
from api.controllers import material_controller

urlpatterns = [
    path('materiales/', material_controller.materiales_lista, name='materiales-lista'),
    path('materiales/<int:id_material>/', material_controller.materiales_detalle, name='materiales-detalle')
]