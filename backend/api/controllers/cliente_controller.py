"""
Controlador de Clientes.
Ruta: backend/api/controllers/cliente_controller.py
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.services.cliente_service import ClienteService


def _cliente_a_dict(cliente):
    return {
        "id_cliente": cliente.id_cliente,
        "nombre": cliente.nombre,
        "apellido": cliente.apellido,
        "tipo_documento_identificacion": cliente.tipo_documento_identificacion,
        "numero_documento_identificacion": cliente.numero_documento_identificacion,
        "telefono_cliente": cliente.telefono_cliente,
        "correo_cliente": cliente.correo_cliente,
        "direccion_cliente": cliente.direccion_cliente,
    }


@api_view(["GET", "POST"])
def clientes_lista(request):
    if request.method == "GET":
        clientes = ClienteService.listar()
        return Response([_cliente_a_dict(c) for c in clientes], status=status.HTTP_200_OK)

    errores = ClienteService.validar_datos(request.data)
    if errores:
        return Response({"exito": False, "errores": errores}, status=status.HTTP_400_BAD_REQUEST)

    nuevo = ClienteService.crear(request.data)
    return Response(_cliente_a_dict(nuevo), status=status.HTTP_201_CREATED)


@api_view(["GET", "PUT", "DELETE"])
def clientes_detalle(request, id_cliente):
    cliente = ClienteService.obtener(id_cliente)
    if cliente is None:
        return Response(
            {"exito": False, "mensaje": f"No existe un cliente con ID {id_cliente}."},
            status=status.HTTP_404_NOT_FOUND,
        )

    if request.method == "GET":
        return Response(_cliente_a_dict(cliente), status=status.HTTP_200_OK)

    if request.method == "PUT":
        errores = ClienteService.validar_datos(request.data, es_actualizacion=True)
        if errores:
            return Response({"exito": False, "errores": errores}, status=status.HTTP_400_BAD_REQUEST)
        actualizado = ClienteService.actualizar(id_cliente, request.data)
        return Response(_cliente_a_dict(actualizado), status=status.HTTP_200_OK)

    if request.method == "DELETE":
        ClienteService.eliminar(id_cliente)
        return Response(
            {"exito": True, "mensaje": f"Cliente #{id_cliente} eliminado correctamente."},
            status=status.HTTP_204_NO_CONTENT,
        )