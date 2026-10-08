"""
Rutas de Factura y de la relacion Modelo-Material.
Ruta: backend/api/routes/factura_routes.py
"""

from django.urls import path
from api.controllers import factura_controller, modelo_material_controller

urlpatterns = [
    # Facturas
    path("facturas/", factura_controller.facturas_lista, name="api-facturas-lista"),
    # Antes del detalle con <int:id_factura>: "modelos-facturables" es un camino
    # fijo, y asi queda protegido aunque el orden llegara a cambiar.
    path("facturas/modelos-facturables/", factura_controller.facturas_modelos_facturables, name="api-facturas-modelos-facturables"),
    path("facturas/<int:id_factura>/", factura_controller.facturas_detalle, name="api-facturas-detalle"),
    path("facturas/<int:id_factura>/pdf/", factura_controller.facturas_descargar_pdf, name="api-facturas-pdf"),

    # Relacion Modelo-Material (anidada bajo /modelos/ conceptualmente)
    path("modelos/<int:id_modelo>/materiales/", modelo_material_controller.materiales_del_modelo, name="api-modelo-materiales"),
    path("modelos/<int:id_modelo>/materiales/melanina/", modelo_material_controller.materiales_melanina_automatica, name="api-modelo-melanina"),
]