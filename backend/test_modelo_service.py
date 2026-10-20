"""
Pruebas de las reglas de validación del servicio de Modelo.
Ruta: backend/test_modelo_service.py

Solo se prueba `validar_datos`, que es lógica pura: no toca la base de
datos. Los rangos son el espejo de los del frontend
(frontend-react/src/components/modelo/limitesModelo.js) y las reglas entre
campos (barra/zócalo dentro del alto del mueble) son las mismas del
wizard.

Ejecución:  python test_modelo_service.py   (desde backend/)
"""
import unittest

from api.services.modelo_service import ModeloService


class TestValidarDatosModelo(unittest.TestCase):
    """Rangos de negocio del asistente de modelos."""

    def setUp(self):
        # Un modelo válido de referencia: closet de 200x100x60 cm.
        self.datos_base = {
            "id_carpintero": 1,
            "id_cliente": 1,
            "nombre_modelo": "Closet de prueba",
            "descripcion": "Modelo de prueba",
            "alto": 200,
            "ancho": 100,
            "largo": 60,
            "grosor": 18,
            "puertas": 2,
            "compartimientos": 2,
            "entrepanos_compartimientos": 1,
            "cajones": 0,
            "altura_barra_colgadora": 0,
            "altura_zocalo": 0,
        }

    def test_modelo_valido_no_reporta_errores(self):
        self.assertEqual(ModeloService.validar_datos(self.datos_base), [])

    def test_obligatorios_faltantes(self):
        datos = dict(self.datos_base)
        del datos["id_carpintero"]
        del datos["id_cliente"]
        errores = ModeloService.validar_datos(datos)
        self.assertTrue(any("id_carpintero" in e for e in errores), errores)
        self.assertTrue(any("id_cliente" in e for e in errores), errores)

    def test_rangos_de_las_medidas(self):
        casos = [
            ("alto", 9), ("alto", 301),
            ("ancho", 9), ("ancho", 501),
            ("largo", 9), ("largo", 121),
        ]
        for campo, valor in casos:
            with self.subTest(campo=campo, valor=valor):
                datos = dict(self.datos_base)
                datos[campo] = valor
                errores = ModeloService.validar_datos(datos)
                self.assertTrue(
                    any(campo in e for e in errores),
                    f"debería rechazar {campo}={valor}: {errores}",
                )

    def test_los_limites_de_las_medidas_se_aceptan(self):
        for campo, valor in [
            ("alto", 10), ("alto", 300),
            ("ancho", 10), ("ancho", 500),
            ("largo", 10), ("largo", 120),
        ]:
            with self.subTest(campo=campo, valor=valor):
                datos = dict(self.datos_base)
                datos[campo] = valor
                self.assertEqual(ModeloService.validar_datos(datos), [])

    def test_contadores_deben_ser_enteros(self):
        for campo in ("puertas", "compartimientos",
                      "entrepanos_compartimientos", "cajones"):
            with self.subTest(campo=campo):
                datos = dict(self.datos_base)
                datos[campo] = 2.5
                errores = ModeloService.validar_datos(datos)
                self.assertTrue(
                    any("entero" in e for e in errores),
                    f"debería rechazar {campo}=2.5: {errores}",
                )

    def test_contadores_fuera_de_rango(self):
        casos = [
            ("puertas", 5), ("compartimientos", 7),
            ("entrepanos_compartimientos", 9), ("cajones", 11),
        ]
        for campo, valor in casos:
            with self.subTest(campo=campo, valor=valor):
                datos = dict(self.datos_base)
                datos[campo] = valor
                errores = ModeloService.validar_datos(datos)
                self.assertTrue(
                    any(campo in e for e in errores),
                    f"debería rechazar {campo}={valor}: {errores}",
                )

    def test_grosor_invalido(self):
        datos = dict(self.datos_base)
        datos["grosor"] = 12
        errores = ModeloService.validar_datos(datos)
        self.assertTrue(
            any("grosor" in e for e in errores),
            f"debería rechazar un grosor de 12 mm: {errores}",
        )

    def test_descripcion_muy_larga(self):
        datos = dict(self.datos_base)
        datos["descripcion"] = "x" * 501
        errores = ModeloService.validar_datos(datos)
        self.assertTrue(
            any("500 caracteres" in e for e in errores),
            f"debería rechazar una descripción de 501 caracteres: {errores}",
        )

    def test_barra_y_zocalo_apagados_se_aceptan(self):
        # 0 = elemento apagado: no hay nada que medir.
        for extra in [
            {"altura_barra_colgadora": 0, "altura_zocalo": 0},
            {"altura_barra_colgadora": 30, "altura_zocalo": 1},
            {"altura_barra_colgadora": 150, "altura_zocalo": 10},
        ]:
            with self.subTest(extra=extra):
                datos = dict(self.datos_base)
                datos.update(extra)
                self.assertEqual(ModeloService.validar_datos(datos), [])

    def test_barra_encendida_bajo_el_minimo(self):
        # Una barra colgada a 12 cm del piso no deja espacio para colgar
        # ropa: el mínimo del taller son 30 cm.
        datos = dict(self.datos_base)
        datos["altura_barra_colgadora"] = 12
        errores = ModeloService.validar_datos(datos)
        self.assertTrue(
            any("altura_barra_colgadora" in e for e in errores),
            f"debería rechazar una barra de 12 cm: {errores}",
        )

    def test_zocalo_encendido_bajo_el_minimo(self):
        datos = dict(self.datos_base)
        datos["altura_zocalo"] = 0.5
        errores = ModeloService.validar_datos(datos)
        self.assertTrue(
            any("altura_zocalo" in e for e in errores),
            f"debería rechazar un zócalo de 0.5 cm: {errores}",
        )

    def test_barra_no_puede_igualar_el_alto(self):
        datos = dict(self.datos_base)
        datos["altura_barra_colgadora"] = 200
        errores = ModeloService.validar_datos(datos)
        self.assertTrue(
            any("barra colgadora" in e for e in errores),
            f"debería rechazar una barra igual al alto: {errores}",
        )

    def test_zocalo_no_puede_superar_el_alto(self):
        datos = dict(self.datos_base)
        datos["altura_zocalo"] = 200
        errores = ModeloService.validar_datos(datos)
        self.assertTrue(
            any("zócalo" in e for e in errores),
            f"debería rechazar un zócalo mayor que el alto: {errores}",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)