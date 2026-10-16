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
            "numero_documento_identificacion", "telefono_cliente",
        ]
        for campo in campos_obligatorios:
            if not es_actualizacion or campo in datos:
                if not str(datos.get(campo, "")).strip():
                    errores.append(f"El campo {campo} es obligatorio")

        # El teléfono es obligatorio, y además debe parecer uno: sin esto se
        # guardan cadenas como "llamar a la tia" que no sirven para contactar.
        # El límite de 15 caracteres es el tamaño real de la columna
        # Telefono_cliente; pasarse haría que MySQL rechazara el INSERT y el
        # cliente quedara sin guardar.
        telefono = str(datos.get("telefono_cliente", "") or "").strip()
        if telefono:
            if len(telefono) > 15:
                errores.append("El telefono no puede superar los 15 caracteres.")
            elif not re.fullmatch(r"\+?\d[\d\s-]{5,13}", telefono):
                errores.append(
                    "El telefono solo puede contener numeros, espacios, + o guiones."
                )
        
        correo = datos.get("correo_cliente", "")
        if correo:
            patron = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
            if not re.match(patron, correo):
                errores.append("El correo electronico no tiene un formato valido.")

        # Limites de longitud por campo, por debajo del tamano real de las
        # columnas de MySQL (Nombre/Apellido/Direccion 255, documento 30,
        # correo 100): sin esto, un texto largo llegaria al INSERT y MySQL lo
        # rechazaria con "Data too long". El formulario aplica los mismos
        # limites (ClientesPage.jsx), pero se repiten aqui por si alguien
        # llama a la API directamente.
        limites = {
            "nombre": 50,
            "apellido": 50,
            "numero_documento_identificacion": 20,
            "correo_cliente": 40,
            "direccion_cliente": 100,
        }
        for campo, maximo in limites.items():
            valor = str(datos.get(campo, "") or "")
            if len(valor) > maximo:
                errores.append(
                    f"El campo {campo} no puede superar los {maximo} caracteres."
                )

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
        # Antes se devolvía clientes[-1] (el último de la lista) y se daba por
        # hecho que se había guardado. Si el INSERT fallaba —por ejemplo con un
        # teléfono que no cabía en la columna— el controlador respondía 201 con
        # los datos de OTRO cliente y el formulario mostraba "guardado" sin que
        # nada se hubiera escrito. Ahora se pregunta al DAO y se devuelve None.
        if not cls.dao.insertar_cliente(cliente):
            return None
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