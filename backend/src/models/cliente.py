"""
Modelo de datos Cliente.
Ruta: backend/src/models/cliente.py
"""


class Cliente:
    """Representa un cliente del taller."""

    def __init__(self, id_cliente=None, nombre="", apellido="",
                 tipo_documento_identificacion="", numero_documento_identificacion="",
                 telefono_cliente="", correo_cliente="", direccion_cliente="",
                 fecha_registro=None):
        self.id_cliente = id_cliente
        self.nombre = nombre
        self.apellido = apellido
        self.tipo_documento_identificacion = tipo_documento_identificacion
        self.numero_documento_identificacion = numero_documento_identificacion
        self.telefono_cliente = telefono_cliente
        self.correo_cliente = correo_cliente
        self.direccion_cliente = direccion_cliente
        self.fecha_registro = fecha_registro

    def __str__(self):
        return f"#{self.id_cliente} | {self.nombre} {self.apellido} | {self.numero_documento_identificacion}"