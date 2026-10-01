"""
DAO (Data Access Object) del modulo Material.
Proyecto : Sistema de Inventario - Taller del Roble Colombiano
Ruta     : backend/src/dao/material_dao.py
 
Implementa el CRUD completo sobre la tabla Material:
    - insertar_material()
    - consultar_materiales() / consultar_material_por_id()
    - actualizar_material()
    - eliminar_material()
"""

from mysql.connector import Error
from src.config.conexion import Conexion
from src.models.material import Material

class MaterialDAO:
    # Encapsula todas las operaciones CRUD sobre la tabla material
    
    # ---------- READ (todos) ----------
    def consultar_materiales(self) -> list:
        conexion = Conexion.obtener_conexion()
        materiales = []
        if conexion is None:
            return materiales
        try:
            cursor = conexion.cursor()
            cursor.execute("SELECT * FROM Material ORDER BY id_material")
            filas = cursor.fetchall()
            for fila in filas:
                materiales.append(Material(
                    id_material=fila[0], nombre_material=fila[1],
                    tipo_material=fila[2], unidad_medida=fila[3],
                    costo_unitario=fila[4], stock=fila[5],
                    stock_minimo=fila[6], fecha_registro=fila[7],
                ))
            return materiales
        except Error as error:
            print("Error al consultar materiales:", error)
            return materiales
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)
    
    # READ - Consultar un material por su ID
    def consultar_material_por_id(self, id_material: int):
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return None
        try:
            cursor = conexion.cursor()
            cursor.execute(
                "SELECT * FROM material WHERE id_material = %s", (id_material,)
            )
            fila = cursor.fetchone()
            if fila is None:
                print(f"No se encontro material con ID {id_material}")
                return None
            return Material(
                id_material=fila[0], nombre_material=fila[1],
                tipo_material=fila[2], unidad_medida=fila[3],
                costo_unitario=fila[4], stock=fila[5],
                stock_minimo=fila[6], fecha_registro=fila[7],
            )
        except Error as e:
            print("Error al consultar el material:", e)
            return None
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)

    # CREATE: Crear un nuevo material
    def insertar_material(self, material: Material) -> bool:
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            sql = """
            INSERT INTO Material(Nombre_material, Tipo_material, Unidad_medida, Costo_unitario, Stock,
            Stock_minimo, Fecha_registro) VALUES(%s, %s, %s, %s, %s, %s, NOW())
            """
            valores = (
                material.nombre_material, material.tipo_material, material.unidad_medida,
            material.costo_unitario, material.stock, material.stock_minimo,
            )
            cursor.execute(sql, valores)
            conexion.commit()
            print(f"Material insertado correctamente. ID generado: {cursor.lastrowid}")
            return True
        except Error as e:
            print(f"Ocurrio un error al insertar el material: {e}")
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)


    # UPDATE: Actualiza un material
    def actualizar_material(self, material: Material) -> bool:
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            sql = """
            UPDATE Material SET Nombre_material = %s, Tipo_material = %s, Unidad_medida = %s, Costo_unitario = %s,
            Stock = %s, Stock_minimo = %s WHERE id_material = %s
            """
            valores = (
                material.nombre_material, material.tipo_material, material.unidad_medida, material.costo_unitario,
                material.stock, material.stock_minimo, material.id_material,
            )
            cursor.execute(sql, valores)
            conexion.commit()
            if cursor.rowcount == 0:
                print(f"No se actualizó ningun registro. Verifica el ID: {material.id_material}")
                return False
            print(f"Material #{material.id_material} actualizado correctamente.")
            return True
        except Error as e:
            print(f"Error al actualizar material: {e}")
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)
    
    # DELETE: Eliminar un material
    def eliminar_material(self, id_material: int) -> bool:
        conexion = Conexion.obtener_conexion()
        if conexion is None:
            return False
        try:
            cursor = conexion.cursor()
            cursor.execute(
                "DELETE FROM Material WHERE id_material = %s", (id_material,)
            )
            conexion.commit()
            if cursor.rowcount == 0:
                print(f"No se eliminó ningún registro. Verifica el ID {id_material}")
                return False
            print(f"Material #{id_material} eliminado correctamente.")
            return True
        except Error as e:
            print(f"Error al eliminar material: {e}")
            return False
        finally:
            cursor.close()
            Conexion.cerrar_conexion(conexion)