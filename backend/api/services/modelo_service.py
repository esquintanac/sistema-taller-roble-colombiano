"""
Servicio de Modelo: reglas de negocio, validaciones y orquestación
del cálculo de piezas y melanina.
Ruta: backend/api/services/modelo_service.py
"""

from src.dao.historial_dao import HistorialDAO
from src.dao.modelo_dao import ModeloDAO
from src.models.modelo import Modelo
from api.services.calculadora_service import CalculadoraService


class ModeloService:
    dao = ModeloDAO()
    historial_dao = HistorialDAO()

    # Reglas de límite del asistente de modelos (espejo del frontend en
    # ModelWizard/limitesModelo.js). Los mínimos no son cosméticos: con un
    # ancho menor que 2×grosor, los entrepaños del cálculo quedan con
    # medidas negativas. Todos los topes quedan muy por debajo de las
    # columnas reales de MySQL (decimal(10,2) e int), así que no hay choque.
    RANGO_MEDIDAS = {
        "alto": (10, 300),
        "ancho": (10, 500),
        "largo": (10, 120),
    }
    # Campos opcionales: 0 significa "elemento apagado" (el wizard no los
    # envía). Los cuatro primeros son contadores y deben ser enteros.
    RANGO_OPCIONALES = {
        "puertas": (0, 4),
        "compartimientos": (0, 6),
        "entrepanos_compartimientos": (0, 8),
        "cajones": (0, 10),
        "altura_barra_colgadora": (0, 300),
        "altura_zocalo": (0, 30),
    }
    # Mínimo cuando el elemento está ENCENDIDO (valor > 0). El 0 significa
    # "elemento apagado": el frontend lo envía así cuando su interruptor está
    # off, y en ese caso no hay nada que medir. Estos mínimos son los mismos
    # del wizard (frontend-react/src/components/modelo/limitesModelo.js): una
    # barra colgada a 15 cm del piso no deja espacio para colgar ropa y un
    # zócalo de 0 cm no es un zócalo.
    RANGO_MINIMO_ENCENDIDO = {
        "altura_barra_colgadora": 30,
        "altura_zocalo": 1,
    }
    CONTADORES_ENTEROS = {
        "puertas", "compartimientos", "entrepanos_compartimientos", "cajones",
    }

    @staticmethod
    def validar_datos(datos, es_actualizacion=False):
        errores = []

        for campo, (minimo, maximo) in ModeloService.RANGO_MEDIDAS.items():
            if not es_actualizacion or campo in datos:
                try:
                    valor = float(datos.get(campo, -1))
                    if valor < minimo or valor > maximo:
                        errores.append(
                            f"El campo {campo} debe estar entre {minimo} y {maximo} cm."
                        )
                except (ValueError, TypeError):
                    errores.append(f"El campo {campo} debe ser un número válido.")

        # Campos opcionales fuera de rango. Los contadores deben ser ENTEROS
        # además de estar en rango: crear() los convierte con int() y un
        # decimal dispararía un error 500 en el servidor.
        for campo, (minimo, maximo) in ModeloService.RANGO_OPCIONALES.items():
            if not es_actualizacion or campo in datos:
                try:
                    valor = float(datos.get(campo, 0) or 0)
                    if valor < minimo or valor > maximo:
                        errores.append(
                            f"El campo {campo} debe estar entre {minimo} y {maximo}."
                        )
                    elif campo in ModeloService.CONTADORES_ENTEROS and valor != int(valor):
                        errores.append(f"El campo {campo} debe ser un número entero.")
                    elif (
                        campo in ModeloService.RANGO_MINIMO_ENCENDIDO
                        and 0 < valor < ModeloService.RANGO_MINIMO_ENCENDIDO[campo]
                    ):
                        # Elemento encendido con una medida por debajo del
                        # mínimo del taller (barra de 12 cm, zócalo de 0.5 cm).
                        errores.append(
                            f"El campo {campo} debe ser al menos "
                            f"{ModeloService.RANGO_MINIMO_ENCENDIDO[campo]} cm."
                        )
                except (ValueError, TypeError):
                    errores.append(f"El campo {campo} debe ser un número válido.")

        # Columna Descripcion VARCHAR(500): MySQL rechazaría un INSERT más largo.
        if not es_actualizacion or "descripcion" in datos:
            if len(datos.get("descripcion", "") or "") > 500:
                errores.append("La descripción no puede superar los 500 caracteres.")

        # Reglas entre campos (espejo del wizard): la barra y el zócalo deben
        # caber dentro de la altura del mueble. 0 = elemento apagado.
        try:
            alto = float(datos.get("alto", 0) or 0)
        except (ValueError, TypeError):
            alto = 0
        if alto > 0:
            for campo, mensaje in (
                ("altura_barra_colgadora",
                 "La altura de la barra colgadora debe ser menor que el alto del modelo."),
                ("altura_zocalo",
                 "La altura del zócalo debe ser menor que el alto del modelo."),
            ):
                try:
                    valor = float(datos.get(campo, 0) or 0)
                except (ValueError, TypeError):
                    continue
                if valor > 0 and valor >= alto:
                    errores.append(mensaje)

        if not es_actualizacion or "id_carpintero" in datos:
            if not datos.get("id_carpintero"):
                errores.append("El id_carpintero es obligatorio.")

        if not es_actualizacion or "id_cliente" in datos:
            if not datos.get("id_cliente"):
                errores.append("El id_cliente es obligatorio.")

        grosor = datos.get("grosor", 18)
        if int(grosor) not in (9, 15, 18):
            errores.append("El grosor debe ser 9, 15 o 18 mm.")

        return errores

    @classmethod
    def listar(cls, id_carpintero=None):
        return cls.dao.consultar_modelos(id_carpintero)

    @classmethod
    def obtener(cls, id_modelo):
        return cls.dao.consultar_modelo_por_id(id_modelo)

    @classmethod
    def crear(cls, datos):
        piezas = CalculadoraService.calcular_piezas(datos)

        modelo = Modelo(
            id_carpintero=datos["id_carpintero"],
            id_cliente=datos["id_cliente"],
            nombre_modelo=datos.get("nombre_modelo", "Sin nombre"),
            descripcion=datos.get("descripcion", ""),
            alto=float(datos["alto"]),
            ancho=float(datos["ancho"]),
            largo=float(datos["largo"]),
            grosor=int(datos.get("grosor", 18)),
            puertas=int(datos.get("puertas", 0) or 0),
            compartimientos=int(datos.get("compartimientos", 0) or 0),
            entrepanos_compartimientos=int(datos.get("entrepanos_compartimientos", 0) or 0),
            cajones=int(datos.get("cajones", 0) or 0),
            color=datos.get("color", ""),
            altura_barra_colgadora=float(datos.get("altura_barra_colgadora", 0) or 0),
            tipo_puerta=datos.get("tipo_puerta", ""),
            altura_zocalo=float(datos.get("altura_zocalo", 0) or 0),
            material_fondo=datos.get("material_fondo", ""),
            piezas_cortar=len(piezas),
            estado_modelo="Creado",
        )

        id_nuevo = cls.dao.insertar_modelo(modelo)
        if id_nuevo is None:
            return None

        # NUEVO: crear automáticamente la entrada de historial
        cls.historial_dao.insertar_historial_automatico(
            id_modelo=id_nuevo,
            id_usuario=datos["id_carpintero"],
            id_cliente=datos["id_cliente"],
            accion="Creación de diseño",
        )

        return cls.dao.consultar_modelo_por_id(id_nuevo)

    @classmethod
    def actualizar(cls, id_modelo, datos):
        modelo = cls.dao.consultar_modelo_por_id(id_modelo)
        if modelo is None:
            return None

        for campo in ["nombre_modelo", "descripcion", "alto", "ancho", "largo",
                       "grosor", "puertas", "compartimientos",
                       "entrepanos_compartimientos", "cajones", "color",
                       "altura_barra_colgadora", "tipo_puerta", "altura_zocalo",
                       "material_fondo", "estado_modelo"]:
            if campo in datos:
                setattr(modelo, campo, datos[campo])

        cls.dao.actualizar_modelo(modelo)
        return modelo

    @classmethod
    def eliminar(cls, id_modelo):
        if cls.dao.consultar_modelo_por_id(id_modelo) is None:
            return False
        return cls.dao.eliminar_modelo(id_modelo)

    @classmethod
    def calcular_diseno(cls, id_modelo):
        """
        Endpoint especial: retorna las piezas y el cálculo de melanina
        de un modelo ya guardado (usado por la pantalla de Diseño 3D
        del frontend).
        """
        modelo = cls.dao.consultar_modelo_por_id(id_modelo)
        if modelo is None:
            return None

        datos_modelo = {
            "alto": modelo.alto, "ancho": modelo.ancho, "largo": modelo.largo,
            "grosor": modelo.grosor,
            # Necesario para emitir los divisores verticales: sin él, un
            # modelo guardado con 4 compartimentos se calcularía como si
            # fuera uno solo.
            "compartimientos": modelo.compartimientos,
            "entrepanos_compartimientos": modelo.entrepanos_compartimientos,
            "puertas": modelo.puertas,
            "material_fondo": modelo.material_fondo,
        }

        piezas = CalculadoraService.calcular_piezas(datos_modelo)
        melanina = CalculadoraService.calcular_melanina(piezas)

        return {"piezas": piezas, "melanina": melanina}