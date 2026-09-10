"""
DAO (Data Access Object) del módulo Modelo.
Ruta: backend/src/dao/modelo_dao.py

Implementa el CRUD completo sobre la tabla Modelo, siguiendo el
mismo patrón que MaterialDAO y ClienteDAO.
"""

from mysql.connector import Error
from src.config.conexion import Conexion
from src.models.modelo import Modelo


class ModeloDAO:
    """Encapsula todas las operaciones CRUD sobre la tabla Modelo."""

    COLUMNAS = """id_modelo, id_carpintero, id_cliente, Nombre_modelo,
                  Descripcion, Alto, Ancho, Largo, Grosor, Puertas,
                  Compartimientos, Entrepanos_compartimientos, Cajones,
                  Color, Altura_barra_colgadora, Tipo_puerta,
                  Altura_zocalo, Material_fondo, Piezas_cortar,
                  Estado_modelo, Fecha_creacion"""

    def _fila_a_modelo(self, fila) -> Modelo:
        return Modelo(
            id_modelo=fila[0], id_carpintero=fila[1], id_cliente=fila[2],
            nombre_modelo=fila[3], descripcion=fila[4], alto=fila[5],
            ancho=fila[6], largo=fila[7], grosor=fila[8], puertas=fila[9],
            compartimientos=fila[10], entrepanos_compartimientos=fila[11],
            cajones=fila[12], color=fila[13], altura_barra_colgadora=fila[14],
            tipo_puerta=fila[15], altura_zocalo=fila[16],
            material_fondo=fila[17], piezas_cortar=fila[18],
            estado_modelo=fila[19], fecha_creacion=fila[20],
        )

    def insertar_modelo(self, modelo: Modelo) -> int:
        """Inserta un modelo nuevo y retorna el ID generado, o None si falla."""
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return None
        try:
            cursor = conexion.cursor()
            sql = """
                INSERT INTO Modelo
                    (id_carpintero, id_cliente, Nombre_modelo, Descripcion,
                     Alto, Ancho, Largo, Grosor, Puertas, Compartimientos,
                     Entrepanos_compartimientos, Cajones, Color,
                     Altura_barra_colgadora, Tipo_puerta, Altura_zocalo,
                     Material_fondo, Piezas_cortar, Estado_modelo, Fecha_creacion)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW())
            """
            valores = (
                modelo.id_carpintero, modelo.id_cliente, modelo.nombre_modelo,
                modelo.descripcion, modelo.alto, modelo.ancho, modelo.largo,
                modelo.grosor, modelo.puertas, modelo.compartimientos,
                modelo.entrepanos_compartimientos, modelo.cajones, modelo.color,
                modelo.altura_barra_colgadora, modelo.tipo_puerta,
                modelo.altura_zocalo, modelo.material_fondo,
                modelo.piezas_cortar, modelo.estado_modelo,
            )
            cursor.execute(sql, valores)
            conexion.commit()
            return cursor.lastrowid
        except Error as error:
            print("Error al insertar modelo:", error)
            return None
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def consultar_modelos(self, id_carpintero=None) -> list:
        """Lista todos los modelos, o solo los de un carpintero si se indica."""
        conexion = Conexion.obtener_conexion()
        modelos = []
        if conexion is None:
            return modelos
        try:
            cursor = conexion.cursor()
            if id_carpintero:
                cursor.execute(
                    f"SELECT {self.COLUMNAS} FROM Modelo WHERE id_carpintero = %s ORDER BY id_modelo DESC",
                    (id_carpintero,)
                )
            else:
                cursor.execute(f"SELECT {self.COLUMNAS} FROM Modelo ORDER BY id_modelo DESC")
            return [self._fila_a_modelo(fila) for fila in cursor.fetchall()]
        except Error as error:
            print("Error al consultar modelos:", error)
            return modelos
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def consultar_modelo_por_id(self, id_modelo: int):
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return None
        try:
            cursor = conexion.cursor()
            cursor.execute(f"SELECT {self.COLUMNAS} FROM Modelo WHERE id_modelo = %s", (id_modelo,))
            fila = cursor.fetchone()
            return self._fila_a_modelo(fila) if fila else None
        except Error as error:
            print("Error al consultar el modelo:", error)
            return None
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def actualizar_modelo(self, modelo: Modelo) -> bool:
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            sql = """
                UPDATE Modelo
                SET Nombre_modelo = %s, Descripcion = %s, Alto = %s, Ancho = %s,
                    Largo = %s, Grosor = %s, Puertas = %s, Compartimientos = %s,
                    Entrepanos_compartimientos = %s, Cajones = %s, Color = %s,
                    Altura_barra_colgadora = %s, Tipo_puerta = %s,
                    Altura_zocalo = %s, Material_fondo = %s,
                    Piezas_cortar = %s, Estado_modelo = %s
                WHERE id_modelo = %s
            """
            valores = (
                modelo.nombre_modelo, modelo.descripcion, modelo.alto,
                modelo.ancho, modelo.largo, modelo.grosor, modelo.puertas,
                modelo.compartimientos, modelo.entrepanos_compartimientos,
                modelo.cajones, modelo.color, modelo.altura_barra_colgadora,
                modelo.tipo_puerta, modelo.altura_zocalo, modelo.material_fondo,
                modelo.piezas_cortar, modelo.estado_modelo, modelo.id_modelo,
            )
            cursor.execute(sql, valores)
            conexion.commit()
            return cursor.rowcount > 0
        except Error as error:
            print("Error al actualizar modelo:", error)
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def eliminar_modelo(self, id_modelo: int) -> bool:
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            cursor.execute("DELETE FROM Modelo WHERE id_modelo = %s", (id_modelo,))
            conexion.commit()
            return cursor.rowcount > 0
        except Error as error:
            print("Error al eliminar modelo:", error)
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)