"""
Servicio de integraciones externas (Fase 7).
Ruta: backend/api/services/externo_service.py

Consulta dos APIs públicas que no piden clave:

  - Open-Meteo   -> humedad y temperatura de la zona del taller.
  - open.er-api  -> tipo de cambio entre el peso colombiano y el dólar.

Tres decisiones que conviene tener presentes:

1. Se usa "urllib" de la librería estándar en vez de "requests", que no está
   instalado en el proyecto. No vale la pena añadir una dependencia solo por
   dos llamadas HTTP.

2. Las respuestas se guardan en memoria unos minutos. Estos datos cambian
   despacio y, sin caché, cada carga de pantalla golpearía el servicio
   externo hasta que este acabara rechazando las peticiones.

3. El servicio NUNCA lanza una excepción hacia arriba: si el servicio externo
   falla, devuelve {"error": ...} y la pantalla simplemente no dibuja la
   tarjeta. Un sistema de taller no debe dejar de funcionar por no tener
   internet.
"""

import json
import time
import urllib.error
import urllib.request

from api.config import api_config


class ExternoService:
    """Encapsula las dos consultas externas y su caché temporal."""

    # {url: (momento_en_que_se_guardó, datos)}
    _cache = {}

    @staticmethod
    def _leer_json(url, segundos_cache):
        """
        Descarga y deserializa un JSON, reutilizando la caché si sigue
        vigente. Devuelve (datos, error): exactamente uno de los dos es None.
        """
        ahora = time.time()
        guardado = ExternoService._cache.get(url)
        if guardado and (ahora - guardado[0]) < segundos_cache:
            return guardado[1], None

        peticion = urllib.request.Request(
            url,
            # Algunos servicios públicos rechazan peticiones sin User-Agent.
            headers={"User-Agent": "TallerRobleColombiano/1.0"},
        )

        try:
            with urllib.request.urlopen(
                peticion, timeout=api_config.TIMEOUT_EXTERNO_SEGUNDOS
            ) as respuesta:
                datos = json.loads(respuesta.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError):
            # Los fallos NO se cachean: así el siguiente intento vuelve a
            # probar, en vez de arrastrar el error durante diez minutos.
            return None, "No se pudo consultar el servicio externo."

        ExternoService._cache[url] = (ahora, datos)
        return datos, None

    # ------------------------------------------------------------------
    # Clima / humedad
    # ------------------------------------------------------------------

    @classmethod
    def consultar_clima(cls):
        """
        Humedad y temperatura actuales de la zona del taller, junto con una
        recomendación de almacenamiento.

        La recomendación es el valor real de esta integración: al carpintero
        no le sirve de nada saber que hay 72 % de humedad si no sabe qué hacer
        con las láminas de melamina a causa de eso.
        """
        url = api_config.URL_CLIMA.format(
            lat=api_config.TALLER_LATITUD,
            lon=api_config.TALLER_LONGITUD,
        )
        datos, error = cls._leer_json(url, api_config.CACHE_CLIMA_SEGUNDOS)
        if error:
            return {"error": error}

        actual = datos.get("current") or {}
        humedad = actual.get("relative_humidity_2m")
        if humedad is None:
            return {"error": "El servicio de clima no devolvió la humedad."}

        nivel, recomendacion = cls.evaluar_humedad(humedad)

        return {
            "ubicacion": api_config.TALLER_UBICACION,
            "humedad": humedad,
            "temperatura": actual.get("temperature_2m"),
            "nivel": nivel,
            "recomendacion": recomendacion,
        }

    @staticmethod
    def evaluar_humedad(humedad):
        """
        Traduce el porcentaje de humedad a un nivel y a una recomendación.
        Se separa del resto para poder probarlo sin llamar al servicio externo.
        """
        if humedad < api_config.HUMEDAD_MINIMA_IDEAL:
            return (
                "seca",
                "El ambiente está seco: la melamina puede arquearse y los "
                "pegues fraguan demasiado rápido.",
            )
        if humedad <= api_config.HUMEDAD_MAXIMA_IDEAL:
            return ("adecuada", "Humedad adecuada para almacenar melamina y madera.")
        if humedad <= api_config.HUMEDAD_ALTA:
            return (
                "alta",
                "Humedad alta: ventila el taller y evita apoyar las láminas "
                "directamente en el piso.",
            )
        return (
            "muy alta",
            "Humedad muy alta: hay riesgo de hinchazón del MDF y de manchas. "
            "Almacena las láminas separadas, ventiladas y sin contacto con el suelo.",
        )

    # ------------------------------------------------------------------
    # Tipo de cambio
    # ------------------------------------------------------------------

    @classmethod
    def consultar_divisa(cls):
        """
        Tipo de cambio entre el peso colombiano y el dólar.

        Se devuelven las dos direcciones a propósito, porque se usan para
        cosas distintas:
          - cop_por_usd -> para MOSTRAR   ("1 USD = $3.311")
          - usd_por_cop -> para CONVERTIR ("$1.409.440 = US$ 425,65")
        """
        url = api_config.URL_DIVISA.format(base=api_config.MONEDA_BASE)
        datos, error = cls._leer_json(url, api_config.CACHE_DIVISA_SEGUNDOS)
        if error:
            return {"error": error}

        if datos.get("result") != "success":
            return {"error": "El servicio de divisas no devolvió una tasa válida."}

        usd_por_cop = (datos.get("rates") or {}).get(api_config.MONEDA_DESTINO)
        if not usd_por_cop:
            return {"error": "No hay tasa disponible para " + api_config.MONEDA_DESTINO + "."}

        return {
            "base": api_config.MONEDA_BASE,
            "moneda": api_config.MONEDA_DESTINO,
            "usd_por_cop": usd_por_cop,
            "cop_por_usd": round(1 / usd_por_cop, 2),
            "actualizado": datos.get("time_last_update_utc"),
        }

