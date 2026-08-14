"""
DAO (Data Access Object) del módulo Cliente.
Ruta: backend/src/dao/cliente_dao.py

Implementa el CRUD completo sobre la tabla Cliente, siguiendo
exactamente el mismo patrón que MaterialDAO (evidencias anteriores).
"""

from mysql.connector import Error
from src.config.conexion import Conexion
from src.models.cliente import Cliente


class ClienteDAO:
    """Encapsula todas las operaciones CRUD sobre la tabla Cliente."""

    def insertar_cliente(self, cliente: Cliente) -> bool:
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            sql = """
                INSERT INTO Cliente
                    (Nombre, Apellido, Tipo_documento_identificacion,
                     Numero_documento_identificacion, Telefono_cliente,
                     Correo_cliente, Direccion_cliente, Fecha_registro)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            """
            valores = (
                cliente.nombre, cliente.apellido,
                cliente.tipo_documento_identificacion,
                cliente.numero_documento_identificacion,
                cliente.telefono_cliente, cliente.correo_cliente,
                cliente.direccion_cliente,
            )
            cursor.execute(sql, valores)
            conexion.commit()
            print(f"Cliente insertado correctamente. ID generado: {cursor.lastrowid}")
            return True
        except Error as error:
            print("Error al insertar cliente:", error)
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def consultar_clientes(self) -> list:
        conexion = Conexion.obtener_conexion()
        clientes = []
        if conexion is None:
            return clientes
        try:
            cursor = conexion.cursor()
            cursor.execute("SELECT * FROM Cliente ORDER BY id_cliente")
            for fila in cursor.fetchall():
                clientes.append(Cliente(
                    id_cliente=fila[0], nombre=fila[1], apellido=fila[2],
                    tipo_documento_identificacion=fila[3],
                    numero_documento_identificacion=fila[4],
                    telefono_cliente=fila[5], correo_cliente=fila[6],
                    direccion_cliente=fila[7], fecha_registro=fila[8],
                ))
            return clientes
        except Error as error:
            print("Error al consultar clientes:", error)
            return clientes
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def consultar_cliente_por_id(self, id_cliente: int):
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return None
        try:
            cursor = conexion.cursor()
            cursor.execute("SELECT * FROM Cliente WHERE id_cliente = %s", (id_cliente,))
            fila = cursor.fetchone()
            if fila is None:
                return None
            return Cliente(
                id_cliente=fila[0], nombre=fila[1], apellido=fila[2],
                tipo_documento_identificacion=fila[3],
                numero_documento_identificacion=fila[4],
                telefono_cliente=fila[5], correo_cliente=fila[6],
                direccion_cliente=fila[7], fecha_registro=fila[8],
            )
        except Error as error:
            print("Error al consultar el cliente:", error)
            return None
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def actualizar_cliente(self, cliente: Cliente) -> bool:
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            sql = """
                UPDATE Cliente
                SET Nombre = %s, Apellido = %s,
                    Tipo_documento_identificacion = %s,
                    Numero_documento_identificacion = %s,
                    Telefono_cliente = %s, Correo_cliente = %s,
                    Direccion_cliente = %s
                WHERE id_cliente = %s
            """
            valores = (
                cliente.nombre, cliente.apellido,
                cliente.tipo_documento_identificacion,
                cliente.numero_documento_identificacion,
                cliente.telefono_cliente, cliente.correo_cliente,
                cliente.direccion_cliente, cliente.id_cliente,
            )
            cursor.execute(sql, valores)
            conexion.commit()
            return cursor.rowcount > 0
        except Error as error:
            print("Error al actualizar cliente:", error)
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def eliminar_cliente(self, id_cliente: int) -> bool:
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            cursor.execute("DELETE FROM Cliente WHERE id_cliente = %s", (id_cliente,))
            conexion.commit()
            return cursor.rowcount > 0
        except Error as error:
            print("Error al eliminar cliente:", error)
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)