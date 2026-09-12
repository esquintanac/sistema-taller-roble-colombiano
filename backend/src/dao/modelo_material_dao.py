"""
DAO del Modulo modelo_material (tabla intermedia entre Modelo y
Material). Registra que materiales y en que cantidad usa cada
modelo -- la pieza que faltaba para poder generar facturas reales
con multiples materiales.
Ruta: backend/src/dao/modelo_material_dao.py
"""

from mysql.connector import Error
from src.config.conexion import Conexion
from src.dao.material_dao import MaterialDAO

class ModeloMaterialDAO:
    """CRUD sobre la tabla modelo_material."""

    material_dao = MaterialDAO()

    def asociar_material(self, id_modelo: int, id_material: int, cantidad: float, unidad_medida: str = ""):
        """
        Registra que un modelo usa una cantidad de un material.
        El costo se calcula en el momento (cantidad x costo_unitario
        del material), quedando "congelado" en modelo_material aunque
        el precio del material cambie despues -- esto es intencional,
        para que el costo historico de un modelo ya diseñado no varie
        si el precio de un material sube o baja mas adelante.
        """
        material = self.material_dao.consultar_material_por_id(id_material)
        if material is None:
            return None

        costo_utilizado = round(cantidad * material.costo_unitario, 2)

        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return None
        try:
            cursor = conexion.cursor()
            sql = """
            INSERT INTO modelo_material
            (id_modelo, id_material, Cantidad, Unidad_medida, Costo_utilizado)
            VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                id_modelo, id_material, cantidad,
                unidad_medida or material.unidad_medida, costo_utilizado
            ))
            conexion.commit()
            return cursor.lastrowid
        except Error as error:
            print(f"Error al asociar material al modelo: {error}")
            return None
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def consultar_materiales_de_modelo(self, id_modelo: int) -> list:
        """Lista los materiales asociados a un modelo, con su nombre ya resuelto"""
        conexion = Conexion.obtener_conexion()
        registros = []
        if conexion is None:
            return registros
        try:
            cursor = conexion.cursor()
            cursor.execute("""
            SELECT mm.id_modelo_material, mm.id_modelo, mm.id_material,
            mm.Cantidad, mm.Unidad_medida, mm.Costo_utilizado,
            m.Nombre_material
            FROM modelo_material mm
            INNER JOIN Material m ON mm.id_material = m.id_material
            WHERE mm.id_modelo = %s
            """,
            (id_modelo,)
            )
            for fila in cursor.fetchall():
                registros.append({
                    "id_modelo_material": fila[0],
                    "id_modelo": fila[1],
                    "id_material": fila[2],
                    "cantidad": fila[3],
                    "unidad_medida": fila[4],
                    "costo_utilizado": fila[5],
                    "nombre_material": fila[6]
                })
            return registros
        except Error as error:
            print(f"Error al consultar materiales del modelo: {error}")
            return registros
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    def eliminar_asociacion(self, id_modelo_material: int) -> bool:
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            cursor.execute("""DELETE FROM modelo_material WHERE id_modelo_material = %s""", (id_modelo_material,))
            conexion.commit()
            return cursor.rowcount > 0
        except Error as error:
            print("Error al eliminar asociacion", error)
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)