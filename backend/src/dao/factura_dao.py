"""
DAO del modulo Factura y DetalleFactura.
Ruta: backend/src/dao/factura_dao.py
"""

from mysql.connector import Error
from src.config.conexion import Conexion

class FacturaDAO:
    """CRUD de encabezado (Factura) y lineas (DetalleFactura)."""

    def crear_factura(self, id_cliente: int, id_modelo: int, valor_total: float, metodo_pago: str = ""):
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return None
        try:
            cursor = conexion.cursor()
            sql = """
            INSERT INTO factura
            (id_cliente, id_modelo, Fecha_pago, Valor_total, Estado_pago, Metodo_pago)
            VALUES (%s, %s, NOW(), %s, %s, %s)
            """
            cursor.execute(sql, (id_cliente, id_modelo, valor_total, "Pendiente", metodo_pago))
            conexion.commit()
            return cursor.lastrowid
        except Error as error:
            print(f"Error al crear factura: {error}")
            return None
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)


    def insertar_detalle(self, id_factura: int, id_material: int, cantidad: float, precio_unitario: float, subtotal: float) -> bool:
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            sql = """
            INSERT INTO detallefactura
            (id_factura, id_material, Cantidad, Precio_unitario, Subtotal)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (id_factura, id_material, cantidad, precio_unitario, subtotal))
            conexion.commit()
            return True
        except Error as error:
            print(f"Error al insertar detalle de factura: {error}")
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def consultar_facturas(self) -> list:
        """Lista todas las facturas con nombre de cliente y modelo."""
        conexion = Conexion.obtener_conexion()
        facturas = []
        if conexion is None:
            return facturas
        try:
            cursor = conexion.cursor()
            cursor.execute("""
            SELECT f.id_factura, f.id_cliente, f.id_modelo, f.Fecha_pago,
            f.Valor_total, f.Estado_pago, f.Metodo_pago,
            c.Nombre AS nombre_cliente, c.Apellido AS apellido_cliente,
            m.Nombre_modelo
            FROM factura f
            INNER JOIN Cliente c ON f.id_cliente = c.id_cliente
            INNER JOIN Modelo m ON f.id_modelo = m.id_modelo
            ORDER BY f.id_factura DESC
            """
            )
            for fila in cursor.fetchall():
                facturas.append({
                    "id_factura": fila[0], "id_cliente": fila[1], "id_modelo": fila[2],
                    "fecha_pago": fila[3].isoformat() if fila[3] else None,
                    "valor_total": fila[4], "estado_pago": fila[5], "metodo_pago": fila[6],
                    "cliente": f"{fila[7]} {fila[8]}", "nombre_modelo": fila[9],
                })
            return facturas
        except Error as error:
            print(f"Error al consultar facturas: {error}")
            return facturas
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def consultar_factura_por_id(self, id_factura: int):
        """Consulta el encabezado de una factura y todas sus lineas de detalle."""
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return None
        try:
            cursor = conexion.cursor()
            cursor.execute(
                """
                SELECT f.id_factura, f.id_cliente, f.id_modelo, f.Fecha_pago,
                f.Valor_total, f.Estado_pago, f.Metodo_pago,
                c.Nombre AS nombre_cliente, c.Apellido AS apellido_cliente,
                m.Nombre_modelo
                FROM factura f
                INNER JOIN Cliente c ON f.id_cliente = c.id_cliente
                INNER JOIN Modelo m ON f.id_modelo = m.id_modelo
                WHERE f.id_factura = %s
                ORDER BY f.id_factura DESC
                """, (id_factura,)
                )
            encabezado = cursor.fetchone()
            if encabezado is None:
                return None

            cursor.execute(
                """
                SELECT d.id_detalle, d.id_material, d.Cantidad, d.Precio_unitario,
                d.Subtotal, m.Nombre_material
                FROM detalleFactura d
                INNER JOIN Material m ON d.id_material = m.id_material
                WHERE d.id_factura = %s
                """, (id_factura,)
                )
            lineas = [
                {
                    "id_detalle": fila[0], "id_material": fila[1],
                    "cantidad": fila[2], "precio_unitario": fila[3],
                    "subtotal": fila[4], "nombre_material": fila[5]
                }
                for fila in cursor.fetchall()
            ]

            return {
                "id_factura": encabezado[0], "id_cliente": encabezado[1], "id_modelo": encabezado[2],
                "fecha_pago": encabezado[3].isoformat() if encabezado[3] else None,
                "valor_total": encabezado[4], "estado_pago": encabezado[5],
                "metodo_pago": encabezado[6],
                "cliente": f"{encabezado[7]} {encabezado[8]}", "nombre_modelo": encabezado[9],
                "detalle": lineas
            }
        except Error as error:
            print(f"Error al consultar la factura: {error}")
            return None
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def consultar_modelos_facturables(self) -> list:
        """Lista los modelos a los que se les puede emitir una factura.

        Este listado alimenta el selector "Diseño a facturar". Antes se armaba
        con el historial, que sirve para otra cosa: guarda un registro por
        ACCION (creacion y cada revision), no uno por modelo, asi que un mismo
        modelo salia repetido y ademas no decia si tenia materiales con los que
        facturar. Aqui se resuelve de raiz:

          - INNER JOIN con modelo_material: si el modelo no tiene materiales NO
            aparece, que es justo la condicion que exige generar_factura. Asi el
            administrador no elige a ciegas y nunca recibe el 400 "sin
            materiales".
          - GROUP BY: un modelo con N materiales produce UNA sola fila.
          - Cliente con INNER JOIN porque la tabla factura exige id_cliente
            (NOT NULL): un modelo sin cliente tampoco se podria facturar.
        """
        conexion = Conexion.obtener_conexion()
        modelos = []
        if conexion is None:
            return modelos
        try:
            cursor = conexion.cursor()
            cursor.execute("""
            SELECT m.id_modelo, m.Nombre_modelo,
                   c.Nombre AS nombre_cliente, c.Apellido AS apellido_cliente,
                   COUNT(mm.id_modelo_material) AS num_materiales,
                   SUM(mm.Costo_utilizado) AS total_estimado
            FROM modelo m
            INNER JOIN modelo_material mm ON mm.id_modelo = m.id_modelo
            INNER JOIN Cliente c ON c.id_cliente = m.id_cliente
            GROUP BY m.id_modelo, m.Nombre_modelo, c.Nombre, c.Apellido
            ORDER BY m.id_modelo DESC
            """)
            for fila in cursor.fetchall():
                modelos.append({
                    "id_modelo": fila[0],
                    "nombre_modelo": fila[1],
                    "cliente": f"{fila[2] or ''} {fila[3] or ''}".strip(),
                    "num_materiales": int(fila[4] or 0),
                    "total_estimado": float(fila[5] or 0),
                })
            return modelos
        except Error as error:
            print(f"Error al consultar los modelos facturables: {error}")
            return modelos
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)