"""
Controlador de Historial.
Ruta: backend/api/controllers/historial_controller.py
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.services.historial_service import HistorialService
from api.middlewares.auth_decorators import requiere_rol


@api_view(["GET"])
@requiere_rol("Administrador")
def historial_lista(request):
    """GET /api/historial/ — lista completa, enriquecida con JOIN."""
    registros = HistorialService.listar()
    return Response(registros, status=status.HTTP_200_OK)


@api_view(["GET"])
@requiere_rol("Administrador")
def historial_detalle(request, id_historial):
    """GET /api/historial/<id>/ — detalle de un registro."""
    registro = HistorialService.obtener(id_historial)
    if registro is None:
        return Response(
            {"exito": False, "mensaje": f"No existe un registro de historial con ID {id_historial}."},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(registro, status=status.HTTP_200_OK)


@api_view(["PUT"])
def historial_marcar_revisado(request, id_historial):
    """
    PUT /api/historial/<id>/revisar/
    Marca un registro como 'Revisado' (RF9). No recibe body: la
    acción en sí misma es el cambio de estado.
    """
    actualizado = HistorialService.marcar_como_revisado(id_historial)
    if actualizado is None:
        return Response(
            {"exito": False, "mensaje": f"No existe un registro de historial con ID {id_historial}."},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(actualizado, status=status.HTTP_200_OK)