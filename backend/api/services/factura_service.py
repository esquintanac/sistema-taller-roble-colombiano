"""
Servicio de Factura: orquesta la generacion de una factura completa
a partir de los materiales ya asociados a un modelo.
Ruta: backend/api/services/factura_service.py
"""

from src.dao.factura_dao import FacturaDAO
from src.dao.modelo_material_dao import ModeloMaterialDAO
from src.dao.modelo_dao import ModeloDAO

class FacturaService:
    dao = FacturaDAO()
    modelo_material_dao = ModeloMaterialDAO()
    modelo_dao = ModeloDAO()

    @classmethod
    def listar(cls):
        return cls.dao.consultar_facturas()

    @classmethod
    def obtener(cls, id_factura):
        return cls.dao.consultar_factura_por_id(id_factura)

    @classmethod
    def generar_factura(cls, id_modelo: int, metodo_pago: str = ""):
        """
        Genera una factura completa para un modelo:
        1. Verifica que el modelo exista y obtiene su id_cliente.
        2. Lee todos los materiales ya asociados en modelo_material.
        3. Suma todos los costos y crea el encabezado de Factura.
        4. Crea una linea de DetalleFactura por cada material.

        Retorna None si el modelo no existe o no tiene materiales
        asociados todavia (no tiene sentido facturar sin materiales).
        """
        modelo = cls.modelo_dao.consultar_modelo_por_id(id_modelo)
        if modelo is None:
            return {"error": "modelo_no_encontrado"}

        materiales = cls.modelo_material_dao.consultar_materiales_de_modelo(id_modelo)
        if not materiales:
            return {"error": "sin_materiales"}

        valor_total = sum(m['costo_utilizado'] for m in materiales)

        id_factura = cls.dao.crear_factura(
            id_cliente=modelo.id_cliente,
            id_modelo=id_modelo,
            valor_total=valor_total,
            metodo_pago=metodo_pago
        )
        if id_factura is None:
            return {"error": "error_al_crear"}

        for material in materiales:
            precio_unitario = round(material["costo_utilizado"] / material["cantidad"], 2)
            cls.dao.insertar_detalle(
                id_factura=id_factura,
                id_material=material["id_material"],
                cantidad=material["cantidad"],
                precio_unitario=precio_unitario,
                subtotal=material["costo_utilizado"]
            )

        return cls.dao.consultar_factura_por_id(id_factura)