"""
Servicio de Materiales: reglas de negocio y validaciones.
Ruta: backend/api/services/material_service.py

Reutiliza el MaterialDAO ya construido en evidencias anteriores
(backend/src/dao/material_dao.py), en vez de reescribir el acceso
a datos desde cero. Esta capa solo agrega las reglas de validación
específicas para la API.
"""

from src.dao.material_dao import MaterialDAO
from src.models.material import Material


class MaterialService:
    dao = MaterialDAO()

    @staticmethod
    def validar_datos(datos, es_actualizacion=False):
        """Valida los datos de entrada antes de crear o actualizar un material."""
        errores = []

        if not es_actualizacion or "nombre_material" in datos:
            if not datos.get("nombre_material", "").strip():
                errores.append("El nombre del material es obligatorio.")

        if not es_actualizacion or "tipo_material" in datos:
            if not datos.get("tipo_material", "").strip():
                errores.append("El tipo de material es obligatorio.")

        if not es_actualizacion or "unidad_medida" in datos:
            if not datos.get("unidad_medida", "").strip():
                errores.append("La unidad de medida es obligatoria.")

        try:
            costo = float(datos.get("costo_unitario", -1))
            if costo <= 0:
                errores.append("El costo unitario debe ser mayor a 0.")
        except (ValueError, TypeError):
            errores.append("El costo unitario debe ser un número válido.")

        try:
            stock = float(datos.get("stock", -1))
            if stock < 0:
                errores.append("El stock no puede ser negativo.")
        except (ValueError, TypeError):
            errores.append("El stock debe ser un número válido.")

        return errores

    @classmethod
    def listar(cls):
        return cls.dao.consultar_materiales()

    @classmethod
    def obtener(cls, id_material):
        return cls.dao.consultar_material_por_id(id_material)

    @classmethod
    def crear(cls, datos):
        material = Material(
            nombre_material=datos["nombre_material"],
            tipo_material=datos["tipo_material"],
            unidad_medida=datos["unidad_medida"],
            costo_unitario=float(datos["costo_unitario"]),
            stock=float(datos["stock"]),
            stock_minimo=float(datos.get("stock_minimo", 0)),
        )
        cls.dao.insertar_material(material)
        materiales = cls.dao.consultar_materiales()
        return materiales[-1] if materiales else None

    @classmethod
    def actualizar(cls, id_material, datos):
        material = cls.dao.consultar_material_por_id(id_material)
        if material is None:
            return None

        material.nombre_material = datos.get("nombre_material", material.nombre_material)
        material.tipo_material = datos.get("tipo_material", material.tipo_material)
        material.unidad_medida = datos.get("unidad_medida", material.unidad_medida)
        material.costo_unitario = float(datos.get("costo_unitario", material.costo_unitario))
        material.stock = float(datos.get("stock", material.stock))
        material.stock_minimo = float(datos.get("stock_minimo", material.stock_minimo))

        cls.dao.actualizar_material(material)
        return material

    @classmethod
    def eliminar(cls, id_material):
        material = cls.dao.consultar_material_por_id(id_material)
        if material is None:
            return False
        return cls.dao.eliminar_material(id_material)