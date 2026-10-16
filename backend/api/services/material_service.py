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


# Listas cerradas que coinciden con los <option> del formulario
# (frontend-react/src/services/materialesService.js). El tipo y la unidad no
# son texto libre porque el sistema los usa como reglas: las láminas se
# filtran con el tipo "tablero" (AdminDesignDetailPage) y el costo se
# interpreta según la unidad. Se comparan en minúsculas para que una
# diferencia de mayúsculas no invalide un dato legítimo.
TIPOS_MATERIAL = (
    "tablero", "herraje", "ferreteria", "adhesivo", "pintura y barniz",
    "madera", "herramienta", "servicio", "otro",
)
UNIDADES_MEDIDA = (
    "unidad", "par", "juego", "caja", "metro", "metro lineal",
    "metro cuadrado", "lamina", "rollo", "kilogramo", "litro",
)

# Límites acordados por el negocio. Precios y stock se manejan en PESOS
# ENTEROS (los decimales casi no se usan en Colombia en estas cifras): los
# tres topes son enteros y validar_datos rechaza cualquier valor con
# parte decimal. Todos quedan por debajo de las columnas reales de MySQL
# (decimal(10,2) admite hasta 99.999.999,99, así que no hay choque).
LIMITE_NOMBRE = 60
TOPE_COSTO = 9999999  # 7 dígitos
TOPE_STOCK = 999999  # 6 dígitos
TOPE_STOCK_MINIMO = 99999  # 5 dígitos


class MaterialService:
    dao = MaterialDAO()

    @staticmethod
    def validar_datos(datos, es_actualizacion=False):
        """Valida los datos de entrada antes de crear o actualizar un material."""
        errores = []

        if not es_actualizacion or "nombre_material" in datos:
            nombre = str(datos.get("nombre_material", "") or "").strip()
            if not nombre:
                errores.append("El nombre del material es obligatorio.")
            elif len(nombre) > LIMITE_NOMBRE:
                errores.append(
                    f"El nombre del material no puede superar los {LIMITE_NOMBRE} caracteres."
                )

        if not es_actualizacion or "tipo_material" in datos:
            tipo = str(datos.get("tipo_material", "") or "").strip()
            if not tipo:
                errores.append("El tipo de material es obligatorio.")
            elif tipo.lower() not in TIPOS_MATERIAL:
                errores.append("El tipo de material no esta en la lista de opciones.")

        if not es_actualizacion or "unidad_medida" in datos:
            unidad = str(datos.get("unidad_medida", "") or "").strip()
            if not unidad:
                errores.append("La unidad de medida es obligatoria.")
            elif unidad.lower() not in UNIDADES_MEDIDA:
                errores.append("La unidad de medida no esta en la lista de opciones.")

        try:
            costo = float(datos.get("costo_unitario", -1))
            if costo <= 0:
                errores.append("El costo unitario debe ser mayor a 0.")
            elif costo > TOPE_COSTO:
                errores.append("El costo unitario no puede superar 9.999.999.")
            elif costo != int(costo):
                errores.append("El costo unitario debe ser un numero entero, sin decimales.")
        except (ValueError, TypeError):
            errores.append("El costo unitario debe ser un numero valido.")

        try:
            stock = float(datos.get("stock", -1))
            if stock < 0:
                errores.append("El stock no puede ser negativo.")
            elif stock > TOPE_STOCK:
                errores.append("El stock no puede superar 999.999.")
            elif stock != int(stock):
                errores.append("El stock debe ser un numero entero, sin decimales.")
        except (ValueError, TypeError):
            errores.append("El stock debe ser un numero valido.")

        try:
            stock_minimo = float(datos.get("stock_minimo", 0))
            if stock_minimo < 0:
                errores.append("El stock minimo no puede ser negativo.")
            elif stock_minimo > TOPE_STOCK_MINIMO:
                errores.append("El stock minimo no puede superar 99.999.")
            elif stock_minimo != int(stock_minimo):
                errores.append("El stock minimo debe ser un numero entero, sin decimales.")
        except (ValueError, TypeError):
            errores.append("El stock minimo debe ser un numero valido.")

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