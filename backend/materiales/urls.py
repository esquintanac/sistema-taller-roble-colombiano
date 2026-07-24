"""
Enrutamiento del modulo Material.
Proyecto : Sistema de Gestion de Inventarios y Diseño Grafico - Taller del Roble Colombiano
Ruta     : backend/materiales/urls.py

Define las rutas URL del modulo y las asocia con su vista
correspondiente en views.py
"""

from django.urls import path
from . import views

app_name = "materiales"

urlpatterns = [
    path("materiales/nuevo/", views.registrar_material, name="registrar"),
    path("materiales/", views.listar_materiales, name="lista"),
    path("materiales/editar/<int:id_material>/", views.editar_material, name="editar"),
    path("materiales/eliminar/<int:id_material>/", views.eliminar_material, name="eliminar"),
    path("materiales/confirmacion/", views.confirmacion_registro, name="confirmacion"),
]