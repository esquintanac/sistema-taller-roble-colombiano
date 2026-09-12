"""
Controlador de la relacion Modelo-Material.
Ruta: backend/api/controllers/modelo_material_controller.py
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from api.services.modelo_material_service import ModeloMaterialService
from api.middlewares.auth_decorators import requiere_rol

@api_view(['GET', 'POST'])
@requiere_rol("Administrador")
def materiales_del_modelo(request, id_modelo):
    """
    GET /api/modelos/<id>/materiales/ -> lista materiales asociados
    POST /api/modelos/<id>/materiales/ -> asocia un material manualmente
    """
    if request.method == "GET":
        materiales = ModeloMaterialService.listar_por_modelo(id_modelo)
        return Response(materiales, status=status.HTTP_200_OK)

    resultado = ModeloMaterialService.asociar_material(id_modelo, request.data)
    if "errores" in resultado:
        return Response({"exito": False, "errores": resultado["errores"]}, status=status.HTTP_400_BAD_REQUEST)
    return Response(resultado, status=status.HTTP_201_CREATED)

@api_view(["POST"])
@requiere_rol("Administrador")
def materiales_melanina_automatica(request, id_modelo):
    """
    POST /api/modelos/<id>/materiales/melanina/
    Body: { "id_material_melanina": <int> }
    Calcula y asocia automaticamente la melanina necesaria.
    """
    id_material_melanina = request.data.get("id_material_melanina")
    if not id_material_melanina:
        return Response(
            {"exito": False, "mensaje": "id_material_melanina es obligatorio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    resultado = ModeloMaterialService.asociar_melanina_automatica(id_modelo, id_material_melanina)
    if "errores" in resultado:
        return Response({"exito": False, "errores": resultado["errores"]}, status=status.HTTP_400_BAD_REQUEST)
    return Response(resultado, status=status.HTTP_201_CREATED)