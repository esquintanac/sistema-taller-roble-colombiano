"""
Controlador de Materiales: recibe la solicitud HTTP y construye
la respuesta con el código de estado correcto.
Ruta: backend/api/controllers/material_controller.py
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.services.material_service import MaterialService


def _material_a_dict(material):
    """Convierte un objeto Material a diccionario serializable en JSON."""
    return {
        "id_material": material.id_material,
        "nombre_material": material.nombre_material,
        "tipo_material": material.tipo_material,
        "unidad_medida": material.unidad_medida,
        "costo_unitario": material.costo_unitario,
        "stock": material.stock,
        "stock_minimo": material.stock_minimo,
    }


@api_view(["GET", "POST"])
def materiales_lista(request):
    """
    GET  /api/materiales/  -> lista todos los materiales
    POST /api/materiales/  -> crea un material nuevo
    """
    if request.method == "GET":
        materiales = MaterialService.listar()
        return Response([_material_a_dict(m) for m in materiales], status=status.HTTP_200_OK)

    # POST
    errores = MaterialService.validar_datos(request.data)
    if errores:
        return Response({"exito": False, "errores": errores}, status=status.HTTP_400_BAD_REQUEST)

    nuevo = MaterialService.crear(request.data)
    return Response(_material_a_dict(nuevo), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def materiales_detalle(request, id_material):
    """
    GET    /api/materiales/<id>/  -> consulta un material
    PUT    /api/materiales/<id>/  -> actualiza un material
    DELETE /api/materiales/<id>/  -> elimina un material
    """
    material = MaterialService.obtener(id_material)
    if material is None and request.method != "POST":
        return Response(
            {"exito": False, "mensaje": f"No existe un material con ID {id_material}."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        return Response(_material_a_dict(material), status=status.HTTP_200_OK)

    if request.method == "PUT":
        errores = MaterialService.validar_datos(request.data, es_actualizacion=True)
        if errores:
            return Response({"exito": False, "errores": errores}, status=status.HTTP_400_BAD_REQUEST)

        actualizado = MaterialService.actualizar(id_material, request.data)
        return Response(_material_a_dict(actualizado), status=status.HTTP_200_OK)

    if request.method == "DELETE":
        MaterialService.eliminar(id_material)
        return Response(
            {"exito": True, "mensaje": f"Material #{id_material} eliminado correctamente."},
            status=status.HTTP_204_NO_CONTENT,
        )