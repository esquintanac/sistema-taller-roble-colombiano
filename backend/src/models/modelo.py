"""
Modelo de datos Modelo (el mueble/closet diseñado por el carpintero).
Ruta: backend/src/models/modelo.py
"""

class Modelo:
    """Representa un modelo de mueble o closet diseñado en el sistema."""

    def __init__(self, id_modelo=None, id_carpintero=None, id_cliente=None,
    nombre_modelo="", descripcion="", alto=0.0, ancho=0.0,
    largo=0.0, grosor=18, puertas=0, compartimientos=0,
    entrepanos_compartimientos=0, cajones=0, color="",
    altura_barra_colgadora=0.0, tipo_puerta="", altura_zocalo=0.0,
    material_fondo="", piezas_cortar=0, estado_modelo="Creado",
    fecha_creacion=None):
        self.id_modelo = id_modelo
        self.id_carpintero = id_carpintero
        self.id_cliente = id_cliente
        self.nombre_modelo = nombre_modelo
        self.descripcion = descripcion
        self.alto = alto
        self.ancho = ancho
        self.largo = largo
        self.grosor = grosor
        self.puertas = puertas
        self.compartimientos = compartimientos
        self.entrepanos_compartimientos = entrepanos_compartimientos
        self.cajones = cajones
        self.color = color
        self.altura_barra_colgadora = altura_barra_colgadora
        self.tipo_puerta = tipo_puerta
        self.altura_zocalo = altura_zocalo
        self.material_fondo = material_fondo
        self.piezas_cortar = piezas_cortar
        self.estado_modelo = estado_modelo
        self.fecha_creacion = fecha_creacion
    
    def __str__(self):
        return f"#{self.id_modelo} | {self.nombre_modelo} | {self.alto}x{self.ancho}x{self.largo} cm"