"""
Servicio de Modelo: reglas de negocio, validaciones y orquestación
del cálculo de piezas y melanina.
Ruta: backend/api/services/modelo_service.py
"""

from src.dao.historial_dao import HistorialDAO
from src.dao.modelo_dao import ModeloDAO
from src.models.modelo import Modelo
from api.services.calculadora_service import CalculadoraService


class ModeloService:
    dao = ModeloDAO()
    historial_dao = HistorialDAO()

    @staticmethod
    def validar_datos(datos, es_actualizacion=False):
        errores = []

        campos_numericos_obligatorios = ["alto", "ancho", "largo"]
        for campo in campos_numericos_obligatorios:
            if not es_actualizacion or campo in datos:
                try:
                    valor = float(datos.get(campo, -1))
                    if valor <= 0:
                        errores.append(f"El campo {campo} debe ser mayor a 0.")
                except (ValueError, TypeError):
                    errores.append(f"El campo {campo} debe ser un número válido.")

        if not es_actualizacion or "id_carpintero" in datos:
            if not datos.get("id_carpintero"):
                errores.append("El id_carpintero es obligatorio.")

        if not es_actualizacion or "id_cliente" in datos:
            if not datos.get("id_cliente"):
                errores.append("El id_cliente es obligatorio.")

        grosor = datos.get("grosor", 18)
        if int(grosor) not in (9, 15, 18):
            errores.append("El grosor debe ser 9, 15 o 18 mm.")

        return errores

    @classmethod
    def listar(cls, id_carpintero=None):
        return cls.dao.consultar_modelos(id_carpintero)

    @classmethod
    def obtener(cls, id_modelo):
        return cls.dao.consultar_modelo_por_id(id_modelo)

    @classmethod
    def crear(cls, datos):
        piezas = CalculadoraService.calcular_piezas(datos)

        modelo = Modelo(
            id_carpintero=datos["id_carpintero"],
            id_cliente=datos["id_cliente"],
            nombre_modelo=datos.get("nombre_modelo", "Sin nombre"),
            descripcion=datos.get("descripcion", ""),
            alto=float(datos["alto"]),
            ancho=float(datos["ancho"]),
            largo=float(datos["largo"]),
            grosor=int(datos.get("grosor", 18)),
            puertas=int(datos.get("puertas", 0) or 0),
            compartimientos=int(datos.get("compartimientos", 0) or 0),
            entrepanos_compartimientos=int(datos.get("entrepanos_compartimientos", 0) or 0),
            cajones=int(datos.get("cajones", 0) or 0),
            color=datos.get("color", ""),
            altura_barra_colgadora=float(datos.get("altura_barra_colgadora", 0) or 0),
            tipo_puerta=datos.get("tipo_puerta", ""),
            altura_zocalo=float(datos.get("altura_zocalo", 0) or 0),
            material_fondo=datos.get("material_fondo", ""),
            piezas_cortar=len(piezas),
            estado_modelo="Creado",
        )

        id_nuevo = cls.dao.insertar_modelo(modelo)
        if id_nuevo is None:
            return None

        # NUEVO: crear automáticamente la entrada de historial
        cls.historial_dao.insertar_historial_automatico(
            id_modelo=id_nuevo,
            id_usuario=datos["id_carpintero"],
            id_cliente=datos["id_cliente"],
            accion="Creación de diseño",
        )

        return cls.dao.consultar_modelo_por_id(id_nuevo)

    @classmethod
    def actualizar(cls, id_modelo, datos):
        modelo = cls.dao.consultar_modelo_por_id(id_modelo)
        if modelo is None:
            return None

        for campo in ["nombre_modelo", "descripcion", "alto", "ancho", "largo",
                       "grosor", "puertas", "compartimientos",
                       "entrepanos_compartimientos", "cajones", "color",
                       "altura_barra_colgadora", "tipo_puerta", "altura_zocalo",
                       "material_fondo", "estado_modelo"]:
            if campo in datos:
                setattr(modelo, campo, datos[campo])

        cls.dao.actualizar_modelo(modelo)
        return modelo

    @classmethod
    def eliminar(cls, id_modelo):
        if cls.dao.consultar_modelo_por_id(id_modelo) is None:
            return False
        return cls.dao.eliminar_modelo(id_modelo)

    @classmethod
    def calcular_diseno(cls, id_modelo):
        """
        Endpoint especial: retorna las piezas y el cálculo de melanina
        de un modelo ya guardado (usado por la pantalla de Diseño 3D
        del frontend).
        """
        modelo = cls.dao.consultar_modelo_por_id(id_modelo)
        if modelo is None:
            return None

        datos_modelo = {
            "alto": modelo.alto, "ancho": modelo.ancho, "largo": modelo.largo,
            "grosor": modelo.grosor,
            "entrepanos_compartimientos": modelo.entrepanos_compartimientos,
            "puertas": modelo.puertas,
            "material_fondo": modelo.material_fondo,
        }

        piezas = CalculadoraService.calcular_piezas(datos_modelo)
        melanina = CalculadoraService.calcular_melanina(piezas)

        return {"piezas": piezas, "melanina": melanina}