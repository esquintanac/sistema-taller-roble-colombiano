"""
Servicio de la relacion Modelo-Material.
Ruta: backend/api/services/modelo_material_service.py
"""

from src.dao.modelo_material_dao import ModeloMaterialDAO
from api.services.calculadora_service import CalculadoraService
from src.dao.modelo_dao import ModeloDAO
from src.dao.material_dao import MaterialDAO

class ModeloMaterialService:
    dao = ModeloMaterialDAO()
    modelo_dao = ModeloDAO()
    material_dao = MaterialDAO()

    @classmethod
    def listar_por_modelo(cls, id_modelo):
        return cls.dao.consultar_materiales_de_modelo(id_modelo)

    @classmethod
    def asociar_material(cls, id_modelo, datos):
        errores = []
        if not datos.get("id_material"):
            errores.append("El id_material es obligatorio.")
        try:
            cantidad = float(datos.get("cantidad", -1))
            if cantidad <= 0:
                errores.append("La cantidad debe ser mayor a 0.")
        except ValueError:
            errores.append("La cantidad debe ser un número válido.")

        if errores:
            return {"errores", errores}

        resultado = cls.dao.asociar_material(
            id_modelo=id_modelo,
            id_material=datos["id_material"],
            cantidad=datos["cantidad"],
            unidad_medida=datos.get("unidad_medida", ""),
        )

        if resultado is None:
            return {"errores": ["El material indicado no existe."]}

        return {"exito", True}

    @classmethod
    def asociar_melanina_automatica(cls, id_modelo, id_material_melanina):
        """
        Atajo: calcula automaticamente la cantidad de melanina que
        necesita el modelo (usando CalculadoraService, la misma
        logica del proceso anterior) y la asocia como material del modelo,
        para que el administrador no tenga que calcularla a mano.
        """
        modelo = cls.modelo_dao.consultar_modelo_por_id(id_modelo)
        if modelo is None:
            return {"errores": ["El modelo no existe."]}

        datos_modelo = {
            "alto": modelo.alto, "ancho": modelo.ancho, "largo": modelo.largo,
            "grosor": modelo.grosor,
            "entrepanos_compartimientos": modelo.entrepanos_compartimientos,
            "puertas": modelo.puertas,
            "material_fondo": modelo.material_fondo,
        }
        piezas = CalculadoraService.calcular_piezas(datos_modelo)
        melanina = CalculadoraService.calcular_melanina(piezas)

        resultado = cls.dao.asociar_material(
            id_modelo=id_modelo,
            id_material=id_material_melanina,
            cantidad=melanina["laminas_necesarias"],
            unidad_medida="Lámina",
        )

        if resultado is None:
            return {"errores": ["El id_material de melanina indicado no existe."]}

        return {"exito": True, "melanina_calculada": melanina}