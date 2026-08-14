"""
Rutas del modulo de Clientes.
Ruta: backend/api/routes/cliente_routes.py
"""

from django.urls import path
from api.controllers import cliente_controller

urlpatterns = [
    path("clientes/", cliente_controller.clientes_lista, name="api-clientes-lista"),
    path("clientes/<int:id_cliente>/", cliente_controller.clientes_detalle, name="api-clientes-detalle"),
]