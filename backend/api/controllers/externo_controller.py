"""
Controlador de las integraciones externas (Fase 7).
Ruta: backend/api/controllers/externo_controller.py

Ambas vistas responden 200 incluso cuando el servicio externo falla, pero con
{"exito": False} en el cuerpo. Es a propósito: estos datos son de apoyo, y
devolver un 500 o un 503 haría que el frontend mostrara un error de sistema
por algo que en realidad solo significa "hoy no hay este dato".
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.services.externo_service import ExternoService
from api.middlewares.auth_decorators import requiere_autenticacion


def _responder(resultado):
    """Normaliza a {exito: true, ...datos} o {exito: false, mensaje}."""
    if "error" in resultado:
        return Response(
            {"exito": False, "mensaje": resultado["error"]},
            status=status.HTTP_200_OK,
        )
    return Response({"exito": True, **resultado}, status=status.HTTP_200_OK)


@api_view(["GET"])
@requiere_autenticacion
def clima(request):
    """
    GET /api/externo/clima/
    Humedad y temperatura de la zona del taller, con la recomendación de
    almacenamiento de la melamina.
    """
    return _responder(ExternoService.consultar_clima())


@api_view(["GET"])
@requiere_autenticacion
def divisa(request):
    """GET /api/externo/divisa/ — tipo de cambio COP <-> USD."""
    return _responder(ExternoService.consultar_divisa())
