"""
Controlador de Modelo.
Ruta: backend/api/controllers/modelo_controller.py
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.services.modelo_service import ModeloService
from api.middlewares.auth_decorators import requiere_autenticacion ,requiere_rol


def _modelo_a_dict(modelo):
    return {
        "id_modelo": modelo.id_modelo,
        "id_carpintero": modelo.id_carpintero,
        "id_cliente": modelo.id_cliente,
        "nombre_modelo": modelo.nombre_modelo,
        "descripcion": modelo.descripcion,
        "alto": modelo.alto, "ancho": modelo.ancho, "largo": modelo.largo,
        "grosor": modelo.grosor,
        "puertas": modelo.puertas,
        "compartimientos": modelo.compartimientos,
        "entrepanos_compartimientos": modelo.entrepanos_compartimientos,
        "cajones": modelo.cajones,
        "color": modelo.color,
        "altura_barra_colgadora": modelo.altura_barra_colgadora,
        "tipo_puerta": modelo.tipo_puerta,
        "altura_zocalo": modelo.altura_zocalo,
        "material_fondo": modelo.material_fondo,
        "piezas_cortar": modelo.piezas_cortar,
        "estado_modelo": modelo.estado_modelo,
    }


@api_view(["GET", "POST"])
@requiere_rol("Carpintero")
def modelos_lista(request):
    if request.method == "GET":
        id_carpintero = request.query_params.get("id_carpintero")
        modelos = ModeloService.listar(id_carpintero)
        return Response([_modelo_a_dict(m) for m in modelos], status=status.HTTP_200_OK)

    errores = ModeloService.validar_datos(request.data)
    if errores:
        return Response({"exito": False, "errores": errores}, status=status.HTTP_400_BAD_REQUEST)

    nuevo = ModeloService.crear(request.data)
    if nuevo is None:
        return Response(
            {"exito": False, "mensaje": "No se pudo crear el modelo."},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
    return Response(_modelo_a_dict(nuevo), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
@requiere_autenticacion
def modelos_detalle(request, id_modelo):
    modelo = ModeloService.obtener(id_modelo)
    if modelo is None:
        return Response(
            {"exito": False, "mensaje": f"No existe un modelo con ID {id_modelo}."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        return Response(_modelo_a_dict(modelo), status=status.HTTP_200_OK)

    if request.method == "PUT":
        errores = ModeloService.validar_datos(request.data, es_actualizacion=True)
        if errores:
            return Response({"exito": False, "errores": errores}, status=status.HTTP_400_BAD_REQUEST)
        actualizado = ModeloService.actualizar(id_modelo, request.data)
        return Response(_modelo_a_dict(actualizado), status=status.HTTP_200_OK)

    if request.method == "DELETE":
        ModeloService.eliminar(id_modelo)
        return Response(
            {"exito": True, "mensaje": f"Modelo #{id_modelo} eliminado correctamente."},
            status=status.HTTP_204_NO_CONTENT,
        )


@api_view(["GET"])
def modelos_calcular_diseno(request, id_modelo):
    """
    GET /api/modelos/<id>/diseno/
    Retorna las piezas a cortar y la melanina necesaria para un
    modelo ya guardado. Este endpoint es el que usará el frontend
    en la pantalla de Diseño 3D (Sección 3, Fase 4).
    """
    resultado = ModeloService.calcular_diseno(id_modelo)
    if resultado is None:
        return Response(
            {"exito": False, "mensaje": f"No existe un modelo con ID {id_modelo}."},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response(resultado, status=status.HTTP_200_OK)