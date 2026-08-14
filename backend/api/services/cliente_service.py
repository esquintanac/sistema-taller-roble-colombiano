"""
Servicio de Clientes: reglas de negocio y validaciones.
Ruta: backend/api/services/cliente_service.py
"""

import re
from src.dao.cliente_dao import ClienteDAO
from src.models.cliente import Cliente

class ClienteService:
    dao = ClienteDAO()

    @staticmethod
    def validar_datos(datos, es_actualizacion=False):
        errores = []

        campos_obligatorios = [
            "nombre", "apellido", "tipo_documento_identificacion",
            "numero_documento_identificacion",
        ]
        for campo in campos_obligatorios:
            if not es_actualizacion or campo in datos:
                if not str(datos.get(campo, "")).strip():
                    errores.append(f"El campo {campo} es obligatorio")
        
        correo = datos.get("correo_cliente", "")
        if correo:
            patron = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
            if not re.match(patron, correo):
                errores.append("El correo electronico no tiene un formato valido.")

        return errores

    @classmethod
    def listar(cls):
        return cls.dao.consultar_clientes()

    @classmethod
    def obtener(cls, id_cliente):
        return cls.dao.consultar_cliente_por_id(id_cliente)

    @classmethod
    def crear(cls, datos):
        cliente = Cliente(
            nombre=datos["nombre"],
            apellido=datos["apellido"],
            tipo_documento_identificacion=datos["tipo_documento_identificacion"],
            numero_documento_identificacion=datos["numero_documento_identificacion"],
            telefono_cliente=datos.get("telefono_cliente", ""),
            correo_cliente=datos.get("correo_cliente", ""),
            direccion_cliente=datos.get("direccion_cliente", ""),
        )
        cls.dao.insertar_cliente(cliente)
        clientes = cls.dao.consultar_clientes()
        return clientes[-1] if clientes else None

    @classmethod
    def actualizar(cls, id_cliente, datos):
        cliente = cls.dao.consultar_cliente_por_id(id_cliente)
        if cliente is None:
            return None
        for campo in ["nombre", "apellido", "tipo_documento_identificacion",
                      "numero_documento_identificacion", "telefono_cliente",
                      "correo_cliente", "direccion_cliente"]:
            if campo in datos:
                setattr(cliente, campo, datos[campo])
        cls.dao.actualizar_cliente(cliente)
        return cliente

    @classmethod
    def eliminar(cls, id_cliente):
        if cls.dao.consultar_cliente_por_id(id_cliente) is None:
            return False
        return cls.dao.eliminar_cliente(id_cliente)