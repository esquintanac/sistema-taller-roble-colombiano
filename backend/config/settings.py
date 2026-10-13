"""
================================================================================================
SISTEMA DE GESTION DE INVENTARIOS Y DISEÑO GRAFICO - TALLER DEL ROBLE COLOMBIANO
Proyecto web - Framework seleccionado: Django (Python)
================================================================================================

Justificacion de la eleccion del framework:

Se seleccionó el framework de Django porque el proyecto es de tipo web (NO standalone ni
movil), y Django implementa de forma nativa el patron de arquitectura
MVC (Modelo Vista Controlador), que es la arquitectura definida previamente
para este sistema.

Django incluye de forma integrada sistemas de autenticacion,
panel administrativo, ORM para el manejo de la base de datos, y un
sistema de enrutamiento (urls.py) que facilita separar claramente
las responsabilidades del sistema, tal como lo requiere el proyecto
academico que va a incluir multiples modulos (Material, Modelo, Cliente, Usuario,
Historial, Factura).

Es el framework mas adecuado frente a alternativas standalone (no aplica,
debido a que el proyecto es web) o moviles (no aplica, se definio arquitectura web con
posible version movil hibrida posterior), por lo cual Django cubre
exactamente el alcance tanto de esta evidencia como de este proyecto.
"""

"""
Django settings for config project.

Generado por 'django-admin startproject'. El proyecto usa Django 6.1.1
(ver backend/requirements.txt).

Para mas informacion sobre este archivo, ver
https://docs.djangoproject.com/en/6.1/topics/settings/

Para la lista completa de ajustes y sus valores, ver
https://docs.djangoproject.com/en/6.1/ref/settings/
"""

from pathlib import Path
from datetime import timedelta
import os

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/6.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# En desarrollo vale la clave por defecto; en producción (Railway) se
# sobreescribe con la variable de entorno SECRET_KEY (nunca se sube a Git).
SECRET_KEY = os.environ.get(
    'SECRET_KEY',
    'django-insecure-nm%ayak(@hh4tk)i5=c^6^6=@@ipu!yj*=z8w4zy)k$%-(o=g9',
)

# SECURITY WARNING: don't run with debug turned on in production!
# Por defecto True para desarrollo local; en Railway se pone DEBUG=False.
DEBUG = os.environ.get('DEBUG', 'True').lower() in ('1', 'true', 'si', 'yes')

# .railway.app cubre cualquier servicio desplegado en Railway (todos los
# dominios terminan en .up.railway.app). Orígenes extra (dominios propios,
# etc.) se agregan con la variable ALLOWED_HOSTS separada por comas.
ALLOWED_HOSTS = ['.railway.app', 'localhost', '127.0.0.1'] + [
    host.strip()
    for host in os.environ.get('ALLOWED_HOSTS', '').split(',')
    if host.strip()
]


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'materiales', # La aplicacion del proyecto registrada
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # debe ir antes de CommonMiddleware
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'api.middlewares.validation_middleware.ValidacionJSONMiddleware',
]

# Permite que React (puerto 5173) consuma esta API sin bloqueo del navegador.
# Se incluyen ambas formas del host porque el dev server de Vite puede
# reportarse como "localhost" o "127.0.0.1" segun como se abra en el navegador.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # Vite sube al siguiente puerto libre si el 5173 ya esta ocupado;
    # sin estos dos origenes el navegador bloquearia la API en ese caso
    # y la app fallaria en silencio.
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

# Orígenes extra para producción (separados por comas). En Railway, por
# ejemplo:
#   CORS_ALLOWED_ORIGINS_EXTRA=https://prolific-grace-production.up.railway.app
CORS_ALLOWED_ORIGINS += [
    origen.strip()
    for origen in os.environ.get('CORS_ALLOWED_ORIGINS_EXTRA', '').split(',')
    if origen.strip()
]

REST_FRAMEWORK = {
    #'DEFAULT_AUTHENTICATION_CLASSES': (
    #   'rest_framework_simplejwt.authentication.JWTAuthentication',
    #),
    # Comentado intencionalmente: nuestro sistema valida el token
    # manualmente con decoradores propios (ver api/middlewares/auth_decorators.py),
    # porque JWTAuthentication espera el modelo de usuarios nativos de Django.
}

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'


# Database
# https://docs.djangoproject.com/en/6.1/ref/settings/#databases

# En desarrollo local se usan las variables DB_* (o los valores por defecto).
# En Railway el plugin MySQL publica MYSQLDATABASE / MYSQLUSER /
# MYSQLPASSWORD / MYSQLHOST / MYSQLPORT, así que cada parámetro cae a esas
# variables cuando DB_* no existe: el mismo settings.py sirve para local y
# para producción sin tocar el código.
DATABASES = {
    'default': {
        'ENGINE': 'mysql.connector.django',
        'NAME': os.environ.get('DB_NAME') or os.environ.get('MYSQLDATABASE') or 'mydb',
        'USER': os.environ.get('DB_USER') or os.environ.get('MYSQLUSER') or 'root',
        'PASSWORD': os.environ.get('DB_PASSWORD') or os.environ.get('MYSQLPASSWORD') or 'admin',
        'HOST': os.environ.get('DB_HOST') or os.environ.get('MYSQLHOST') or 'localhost',
        'PORT': os.environ.get('DB_PORT') or os.environ.get('MYSQLPORT') or '3306',
    }
}


# Password validation
# https://docs.djangoproject.com/en/6.1/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization
# https://docs.djangoproject.com/en/6.1/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/6.1/howto/static-files/

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),   # RNF: mismo tiempo que el cierre de sesión del frontend
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,  # reutiliza la SECRET_KEY que Django ya genera
}


# Correo electrónico (login, registro y recuperación de contraseña).
# En desarrollo (sin EMAIL_HOST) se usa el backend de consola: el mensaje
# se imprime en la terminal del servidor y no se toca el código.
# Para enviar correos reales (Brevo, Gmail con contraseña de aplicación,
# etc.) basta con definir EMAIL_HOST y sus credenciales como variables de
# entorno; en Railway van en la configuración del servicio del backend.
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = os.environ.get(
    'DEFAULT_FROM_EMAIL', 'no-responder@tallerdelroble.com'
)

EMAIL_HOST = os.environ.get('EMAIL_HOST', '')
if EMAIL_HOST:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_PORT = int(os.environ.get('EMAIL_PORT', '587'))
    EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
    EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
    EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True').lower() in (
        '1', 'true', 'si', 'yes',
    )
    # Evita que el proceso se cuelque si el proveedor SMTP no responde
    # (en Railway un proceso colgado termina en timeout del servicio).
    EMAIL_TIMEOUT = 15

# Canal de envío de códigos de verificación (login, registro, recuperación).
# El motor (verificacion_service.py) no depende del canal: elegirlo es
# configuración. 'correo' funciona hoy con el backend de consola/SMTP de
# arriba; 'sms' usa el adaptador preparado de canales_envio.py.
CANAL_VERIFICACION = os.environ.get('CANAL_VERIFICACION', 'correo')

# URL base del frontend para los enlaces que viajan por correo (por ejemplo
# el enlace de restablecer contraseña:
# {URL_BASE_FRONTEND}/restablecer/<token>). En desarrollo es el dev server
# de Vite; en producción se define con la variable URL_BASE_FRONTEND
# (p. ej. https://<servicio-del-frontend>.up.railway.app) para que el
# enlace apunte al dominio real y no al localhost del servidor.
URL_BASE_FRONTEND = os.environ.get('URL_BASE_FRONTEND', 'http://localhost:5173')

# --- Canal SMS (preparado, sin credenciales) ---
# Para activarlo en el futuro: completar estas variables, poner
# CANAL_VERIFICACION = 'sms' arriba, instalar el SDK del proveedor
# (por ejemplo `pip install twilio`) y llenar CanalSMS.enviar() en
# backend/api/services/canales_envio.py. Mientras esté sin completar,
# el motor responde con un error explícito en lugar de fingir el envío.
# SMS_PROVIDER = 'twilio'      # proveedor elegido
# SMS_API_KEY = ''             # credencial del proveedor (p. ej. Auth Token)
# SMS_FROM_NUMBER = ''         # número remitente asignado