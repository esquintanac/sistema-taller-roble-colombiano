"""
Controlador de Factura.
Ruta: backend/api/controllers/factura_controller.py
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.services.factura_service import FacturaService
from api.middlewares.auth_decorators import requiere_rol

from django.http import HttpResponse
from api.services.pdf_service import PDFService

MENSAJES_ERROR = {
    "modelo_no_encontrado": "El modelo indicado no existe.",
    "sin_materiales": "El modelo no tiene materiales asociados. Asocia al menos uno antes de generar la factura.",
    "error_al_crear": "Ocurrio un error al generar la factura.",
}

@api_view(["GET", "POST"])
@requiere_rol("Administrador")
def facturas_lista(request):
    if request.method == "GET":
        facturas = FacturaService.listar()
        return Response(facturas, status=status.HTTP_200_OK)

    id_modelo = request.data.get("id_modelo")
    if not id_modelo:
        return Response(
            {"exito": False, "mensaje": "id_modelo es obligatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    metodo_pago = request.data.get("metodo_pago", "")
    resultado = FacturaService.generar_factura(id_modelo, metodo_pago)

    if "error" in resultado:
        codigo = status.HTTP_404_NOT_FOUND if resultado["error"] == "modelo_no_encontrado" else status.HTTP_400_BAD_REQUEST
        return Response(
            {"exito": False, "mensaje": MENSAJES_ERROR[resultado["error"]]},
            status=codigo,
        )

    return Response(resultado, status=status.HTTP_201_CREATED)

@api_view(["GET"])
@requiere_rol("Administrador")
def facturas_detalle(request, id_factura):
    factura = FacturaService.obtener(id_factura)
    if factura is None:
        return Response(
            {"exito": False, "mensaje": f"No existe una factura con ID {id_factura}."},
            status=status.HTTP_404_NOT_FOUND
        )
    return Response(factura, status=status.HTTP_200_OK)

@api_view(["GET"])
@requiere_rol("Administrador")
def facturas_descargar_pdf(request, id_factura):
    """GET /api/facturas/<id>/pdf/ -- descargar el reporte de costos."""
    factura = FacturaService.obtener(id_factura)
    if factura is None:
        return Response({"exito": False, "mensaje": "Factura no encontrada."}, status=status.HTTP_404_NOT_FOUND)

    pdf_bytes = PDFService.generar_reporte_admin(factura)

    respuesta = HttpResponse(pdf_bytes, content_type="application/pdf")
    respuesta["Content-Disposition"] = f'attachment; filename="reporte_factura_{id_factura}.pdf"'
    return respuesta    