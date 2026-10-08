"""
Comando de gestión: recalcula la columna Piezas_cortar de todos los modelos.

Ruta: backend/api/management/commands/recalcular_piezas.py

Para qué sirve
--------------
Piezas_cortar es un dato DERIVADO: se calcula con CalculadoraService al crear
el modelo y se guarda en la tabla Modelo. Si después cambia la forma de
calcular las piezas —por ejemplo el día que se añadieron los divisores
verticales—, los modelos ya guardados conservan el número viejo y la columna
queda en desacuerdo con lo que devuelve /api/modelos/<id>/diseno/ y con el
reporte en PDF.

Este comando vuelve a calcular ese número para cada modelo y lo persiste, de
modo que la base de datos quede otra vez coherente con la calculadora actual.

Uso:
    python manage.py recalcular_piezas
    python manage.py recalcular_piezas --seco    # solo muestra, no escribe
"""

from django.core.management.base import BaseCommand

from api.services.calculadora_service import CalculadoraService
from src.dao.modelo_dao import ModeloDAO


class Command(BaseCommand):
    help = "Recalcula y guarda la columna Piezas_cortar de todos los modelos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--seco",
            action="store_true",
            help="Muestra qué cambiaría, sin escribir nada en la base de datos.",
        )

    def handle(self, *args, **opciones):
        modo_seco = opciones["seco"]
        dao = ModeloDAO()
        modelos = dao.consultar_modelos()

        if not modelos:
            self.stdout.write(
                "No se encontraron modelos (o la base de datos no respondió)."
            )
            return

        cambios = 0
        for modelo in modelos:
            datos = {
                "alto": modelo.alto,
                "ancho": modelo.ancho,
                "largo": modelo.largo,
                "grosor": modelo.grosor,
                # Los tres campos que hacen falta para que la calculadora
                # emita los divisores verticales.
                "compartimientos": modelo.compartimientos,
                "entrepanos_compartimientos": modelo.entrepanos_compartimientos,
                "puertas": modelo.puertas,
                "material_fondo": modelo.material_fondo,
            }

            # Se reutiliza la MISMA calculadora que usa la API, para que el
            # número guardado no pueda diferir del que se muestra en pantalla.
            piezas = CalculadoraService.calcular_piezas(datos)
            nuevo = len(piezas)
            anterior = modelo.piezas_cortar

            if nuevo == anterior:
                continue

            cambios += 1
            self.stdout.write(
                f"Modelo #{modelo.id_modelo} ({modelo.nombre_modelo}): "
                f"{anterior} -> {nuevo} piezas"
            )

            if not modo_seco:
                modelo.piezas_cortar = nuevo
                dao.actualizar_modelo(modelo)

        resumen = f"{cambios} modelo(s) actualizado(s) de {len(modelos)}."
        if modo_seco and cambios:
            resumen += " Modo seco: no se escribió nada."
        self.stdout.write(self.style.SUCCESS(resumen))
