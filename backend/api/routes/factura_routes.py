"""
Rutas de Factura y de la relacion Modelo-Material.
Ruta: backend/api/routes/factura_routes.py
"""

from django.urls import path
from api.controllers import factura_controller, modelo_material_controller

urlpatterns = [
    # Facturas
    path("facturas/", factura_controller.facturas_lista, name="api-facturas-lista"),
    path("facturas/<int:id_factura>/", factura_controller.facturas_detalle, name="api-facturas-detalle"),

    # Relacion Modelo-Material (anidada bajo /modelos/ conceptualmente)
    path("modelos/<int:id_modelo>/materiales/", modelo_material_controller.materiales_del_modelo, name="api-modelo-materiales"),
    path("modelos/<int:id_modelo>/materiales/melanina/", modelo_material_controller.materiales_melanina_automatica, name="api-modelo-melanina"),
]