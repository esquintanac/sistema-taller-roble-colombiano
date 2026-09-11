"""
DAO (Data Access Object) del módulo Historial.
Ruta: backend/src/dao/historial_dao.py

A diferencia de los DAO anteriores (Material, Cliente), este NO
tiene un metodo insertar_historial() de uso libre: los registros
de historial se crean automaticamente desde ModeloService al crear
un modelo reflejando que el historial es un efecto
secundario de esa accion, no un recurso creado directamente por
el usuario.
"""

from mysql.connector import Error
from src.config.conexion import Conexion


class HistorialDAO:
    """Encapsula las operaciones de consulta y actualización sobre Historial."""

    # JOIN que enriquece cada fila con datos legibles de las tablas relacionadas,
    # en vez de solo devolver los IDs crudos.
    CONSULTA_BASE = """
        SELECT
            h.id_historial, h.id_modelo, h.id_usuario, h.id_cliente,
            h.Comentario, h.Fecha_creacion, h.Estado_revision, h.Accion,
            m.Nombre_modelo, m.Alto, m.Ancho, m.Largo,
            u.Nombre AS nombre_carpintero, u.Apellido AS apellido_carpintero,
            c.Nombre AS nombre_cliente, c.Apellido AS apellido_cliente
        FROM Historial h
        INNER JOIN Modelo m ON h.id_modelo = m.id_modelo
        INNER JOIN Usuario u ON h.id_usuario = u.id_usuario
        INNER JOIN Cliente c ON h.id_cliente = c.id_cliente
    """

    def _fila_a_dict(self, fila) -> dict:
        """Convierte una fila del JOIN en un diccionario ya enriquecido."""
        return {
            "id_historial": fila[0],
            "id_modelo": fila[1],
            "id_usuario": fila[2],
            "id_cliente": fila[3],
            "comentario": fila[4],
            "fecha_creacion": fila[5].isoformat() if fila[5] else None,
            "estado_revision": fila[6],
            "accion": fila[7],
            "nombre_modelo": fila[8],
            "medidas": f"{fila[9]}x{fila[10]}x{fila[11]}",
            "creado_por": f"{fila[12]} {fila[13]}",
            "cliente": f"{fila[14]} {fila[15]}",
        }

    def insertar_historial_automatico(self, id_modelo, id_usuario, id_cliente, accion) -> bool:
        """
        Crea una entrada de historial. Se invoca UNICAMENTE desde
        ModeloService al crear un modelo — no está expuesto como
        endpoint público de creación directa.
        """
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            sql = """
                INSERT INTO Historial
                    (id_modelo, id_usuario, id_cliente, Comentario,
                     Fecha_creacion, Estado_revision, Accion)
                VALUES (%s, %s, %s, %s, NOW(), %s, %s)
            """
            cursor.execute(sql, (id_modelo, id_usuario, id_cliente, "", "Nuevo", accion))
            conexion.commit()
            return True
        except Error as error:
            print("Error al insertar historial:", error)
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def consultar_historial(self) -> list:
        conexion = Conexion.obtener_conexion()
        registros = []
        if conexion is None:
            return registros
        try:
            cursor = conexion.cursor()
            cursor.execute(f"{self.CONSULTA_BASE} ORDER BY h.id_historial DESC")
            return [self._fila_a_dict(fila) for fila in cursor.fetchall()]
        except Error as error:
            print("Error al consultar historial:", error)
            return registros
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def consultar_historial_por_id(self, id_historial: int):
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return None
        try:
            cursor = conexion.cursor()
            cursor.execute(f"{self.CONSULTA_BASE} WHERE h.id_historial = %s", (id_historial,))
            fila = cursor.fetchone()
            return self._fila_a_dict(fila) if fila else None
        except Error as error:
            print("Error al consultar el historial:", error)
            return None
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def actualizar_estado_revision(self, id_historial: int, nuevo_estado: str) -> bool:
        """Cambia el Estado_revision (ej. de 'Nuevo' a 'Revisado')."""
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            cursor.execute(
                "UPDATE Historial SET Estado_revision = %s, Accion = %s WHERE id_historial = %s",
                (nuevo_estado, "Revisión de diseño", id_historial)
            )
            conexion.commit()
            return cursor.rowcount > 0
        except Error as error:
            print("Error al actualizar historial:", error)
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)