"""
Modulo de conexion a la base de datos
Proyecto : Sistema de Gestion de Inventarios y Diseño Grafico - Taller del Roble Colombiano
Ruta     : backend/src/config/conexion.py
 
Equivalente en Python al patron de conexion JDBC de Java, usando el
driver oficial MySQL Connector/Python.
"""

import os

import mysql.connector
from mysql.connector import Error

class Conexion:
    # Gestiona la conexion hacia la base de datos de MySQL del proyecto

    # Los parametros NO estan hardcodeados: se leen del entorno con el MISMO
    # patron que config/settings.py (DB_* en local; MYSQL* publicadas por el
    # plugin MySQL de Railway; si no hay ninguna, los defaults locales).
    # Antes el host era "localhost" fijo y en produccion
    # Conexion.obtener_conexion()
    # devolvia None: todos los DAO (cliente, material, modelo, historial,
    # factura) fallaban en silencio y las listas venian vacias ("0 clientes").
    HOST = os.environ.get('DB_HOST') or os.environ.get('MYSQLHOST') or 'localhost'
    PUERTO = int(os.environ.get('DB_PORT') or os.environ.get('MYSQLPORT') or '3306')
    BASE_DATOS = os.environ.get('DB_NAME') or os.environ.get('MYSQLDATABASE') or 'mydb'
    USUARIO = os.environ.get('DB_USER') or os.environ.get('MYSQLUSER') or 'root'
    PASSWORD = os.environ.get('DB_PASSWORD') or os.environ.get('MYSQLPASSWORD') or 'admin'

    @staticmethod
    def obtener_conexion():

        # Abre y retorna una nueva conexion a la base de datos
        try:
           conexion = mysql.connector.connect(
               host = Conexion.HOST,
               port = Conexion.PUERTO,
               database = Conexion.BASE_DATOS,
               user = Conexion.USUARIO,
               password = Conexion.PASSWORD,
           ) 

           if conexion.is_connected():
               print("Conexion exitosa")

               return conexion
        except Error as e:
            print(f"Error al conectar la base de datos: {e}")
            return None
    
    @staticmethod
    def cerrar_conexion(conexion):
        # Cierra la conexion si esta activa
        if conexion is not None and conexion.is_connected():
            conexion.close()
            print("Conexion cerrada correctamente.")

if __name__ == "__main__":
    conn = Conexion.obtener_conexion()
    Conexion.cerrar_conexion(conn)