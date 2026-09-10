"""
Servicio de cálculo de piezas y materiales para un modelo.
Ruta: backend/api/services/calculadora_service.py

Contiene ÚNICAMENTE lógica de negocio pura (sin HTTP, sin base de
datos): recibe las medidas y configuración de un modelo, y calcula
qué piezas hay que cortar y cuánta melanina se necesita. Esta
separación permite reutilizar el cálculo desde cualquier lugar
(la API, un reporte PDF futuro, pruebas automatizadas) sin duplicar
la fórmula en cada sitio.
"""

# Dimensiones estándar de una lámina de melanina, en centímetros
LAMINA_ANCHO_CM = 244
LAMINA_ALTO_CM = 122
FACTOR_DESPERDICIO = 1.15  # 15% de margen por cortes y desperdicio


class CalculadoraService:

    @staticmethod
    def calcular_piezas(modelo_datos: dict) -> list:
        """
        Calcula la lista de piezas a cortar según las medidas y
        configuración del modelo.

        Args:
            modelo_datos (dict): debe contener alto, ancho, largo,
                grosor, entrepanos_compartimientos, puertas,
                material_fondo (opcional, puede ser None o "").

        Returns:
            list[dict]: cada pieza con su nombre y medida (ancho x alto en cm).
        """
        alto = float(modelo_datos["alto"])
        ancho = float(modelo_datos["ancho"])
        largo = float(modelo_datos["largo"])
        grosor_cm = float(modelo_datos.get("grosor", 18)) / 10  # mm -> cm
        entrepanos = int(modelo_datos.get("entrepanos_compartimientos", 0) or 0)
        num_puertas = int(modelo_datos.get("puertas", 0) or 0)
        lleva_fondo = bool(modelo_datos.get("material_fondo"))

        piezas = []

        # Estructura principal: siempre presente en cualquier modelo
        piezas.append({"nombre": "Panel lateral izquierdo", "ancho": largo, "alto": alto})
        piezas.append({"nombre": "Panel lateral derecho", "ancho": largo, "alto": alto})
        piezas.append({"nombre": "Base inferior", "ancho": ancho, "alto": largo})
        piezas.append({"nombre": "Techo", "ancho": ancho, "alto": largo})

        # Entrepaños: se descuenta 2 veces el grosor por el ancho que ocupan los laterales
        for i in range(1, entrepanos + 1):
            piezas.append({
                "nombre": f"Entrepaño {i}",
                "ancho": ancho - (grosor_cm * 2),
                "alto": largo - grosor_cm,
            })

        # Puertas: se reparte el ancho total entre el número de puertas
        if num_puertas > 0:
            ancho_por_puerta = (ancho / num_puertas) - 1  # 1cm de holgura entre puertas
            for i in range(1, num_puertas + 1):
                piezas.append({
                    "nombre": f"Puerta {i}",
                    "ancho": round(ancho_por_puerta, 2),
                    "alto": alto - 5,  # 5cm de holgura superior/inferior
                })

        # Fondo trasero, solo si el modelo lo incluye
        if lleva_fondo:
            piezas.append({"nombre": "Fondo trasero", "ancho": ancho, "alto": alto})

        return piezas

    @staticmethod
    def calcular_melanina(piezas: list) -> dict:
        """
        Calcula cuántas láminas de melanina se necesitan, según el
        área total de las piezas y el área que rinde una lámina
        estándar, aplicando un margen de desperdicio.

        Args:
            piezas (list[dict]): lista generada por calcular_piezas().

        Returns:
            dict: área total requerida y número de láminas necesarias.
        """
        area_total_cm2 = sum(p["ancho"] * p["alto"] for p in piezas)
        area_lamina_cm2 = LAMINA_ANCHO_CM * LAMINA_ALTO_CM

        laminas_necesarias = (area_total_cm2 * FACTOR_DESPERDICIO) / area_lamina_cm2

        return {
            "area_total_cm2": round(area_total_cm2, 2),
            "laminas_necesarias": round(laminas_necesarias, 2),
            "lamina_estandar": f"{LAMINA_ANCHO_CM}x{LAMINA_ALTO_CM} cm",
        }