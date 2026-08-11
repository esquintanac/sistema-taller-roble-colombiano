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