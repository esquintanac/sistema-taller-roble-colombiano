"""
Configuración específica de la API (separada de settings.py para
mantener la organización pedida en el ejercicio).
Ruta: backend/api/config/api_config.py
"""

# Tiempo de vida del token de sesión, en minutos (relacionado con el
# requerimiento no funcional de cierre de sesión por inactividad)
TIEMPO_EXPIRACION_TOKEN_MINUTOS = 30

# Roles válidos del sistema, usados por el servicio de validación
ROLES_VALIDOS = ["Carpintero", "Administrador"]

# ============================================================================
# Integraciones externas (Fase 7)
# ============================================================================
#
# El sistema consulta dos servicios públicos que NO piden clave de API, así
# que el proyecto no necesita guardar secretos ni que nadie se registre:
#
#   - Open-Meteo   -> humedad y temperatura de la zona del taller
#   - open.er-api  -> tipo de cambio entre el peso colombiano y el dólar
#
# En el servicio se usa "urllib" de la librería estándar en vez de
# "requests", que no está instalado: no vale la pena agregar una dependencia
# solo por dos llamadas HTTP sencillas.

# Ubicación del taller. Se usa para pedir el clima de esa zona.
TALLER_UBICACION = "Bogotá, Colombia"
TALLER_LATITUD = 4.7110
TALLER_LONGITUD = -74.0721

URL_CLIMA = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude={lat}&longitude={lon}"
    "&current=relative_humidity_2m,temperature_2m"
)

# Devuelve cuántas unidades de cada moneda equivalen a 1 de la base.
URL_DIVISA = "https://open.er-api.com/v6/latest/{base}"
MONEDA_BASE = "COP"
MONEDA_DESTINO = "USD"

# Cada cuánto se permite volver a consultar cada servicio, en segundos.
# Sirve para no golpear las APIs externas en cada carga de pantalla: sus datos
# cambian despacio (el clima, cada rato; la divisa, una vez al día) y si se
# abusa del servicio este acaba rechazando las peticiones.
CACHE_CLIMA_SEGUNDOS = 10 * 60
CACHE_DIVISA_SEGUNDOS = 6 * 60 * 60

# Espera máxima de cada llamada externa, en segundos. Sin esto, si el otro
# servicio no responde, la petición del usuario se quedaría colgada.
TIMEOUT_EXTERNO_SEGUNDOS = 8

# ============================================================================
# Rangos de humedad para el almacenamiento de la melamina
# ============================================================================
#
# Salen de la práctica del oficio: la madera y el MDF se mantienen estables
# alrededor del 40-60 % de humedad relativa. Por debajo se resecan y se
# arquean; por encima absorben vapor, se hinchan y salen manchas y hongos.
HUMEDAD_MINIMA_IDEAL = 40
HUMEDAD_MAXIMA_IDEAL = 60
HUMEDAD_ALTA = 70