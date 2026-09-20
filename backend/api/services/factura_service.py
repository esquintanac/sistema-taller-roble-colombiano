"""
Servicio de Factura: orquesta la generación de una factura completa
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
        modelo = cls.modelo_dao.consultar_modelo_por_id(id_modelo)
        if modelo is None:
            return {"error": "modelo_no_encontrado"}

        materiales = cls.modelo_material_dao.consultar_materiales_de_modelo(id_modelo)
        if not materiales:
            return {"error": "sin_materiales"}

        valor_total = sum(m["costo_utilizado"] for m in materiales)

        id_factura = cls.dao.crear_factura(
            id_cliente=modelo.id_cliente,
            id_modelo=id_modelo,
            valor_total=valor_total,
            metodo_pago=metodo_pago,
        )
        if id_factura is None:
            return {"error": "error_al_crear"}

        # Cada linea se inserta de forma independiente: si una falla,
        # las demas no se pierden (antes, una excepcion en el bucle
        # interrumpia TODA la insercion de detalles sin dejar rastro).
        for material in materiales:
            try:
                cantidad = material["cantidad"] or 0
                costo = material["costo_utilizado"] or 0

                precio_unitario = round(costo / cantidad, 2) if cantidad else 0

                exito = cls.dao.insertar_detalle(
                    id_factura=id_factura,
                    id_material=material["id_material"],
                    cantidad=cantidad,
                    precio_unitario=precio_unitario,
                    subtotal=costo,
                )
                if not exito:
                    print(f"Aviso: no se pudo insertar el detalle del material {material['id_material']}")

            except (ZeroDivisionError, TypeError, KeyError) as error:
                print(f"Error al procesar la linea de material {material.get('id_material')}: {error}")
                continue  # sigue con el siguiente material en vez de romper todo el bucle

        return cls.dao.consultar_factura_por_id(id_factura)