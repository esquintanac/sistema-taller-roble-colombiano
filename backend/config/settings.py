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
SECRET_KEY = 'django-insecure-nm%ayak(@hh4tk)i5=c^6^6=@@ipu!yj*=z8w4zy)k$%-(o=g9'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = []


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

DATABASES = {
    'default': {
        'ENGINE': 'mysql.connector.django',
        'NAME': os.environ.get('DB_NAME', 'mydb'),
        'USER': os.environ.get('DB_USER', 'root'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'admin'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': '3306',
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

STATIC_URL = 'static/'

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=30),   # RNF: mismo tiempo que el cierre de sesión del frontend
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,  # reutiliza la SECRET_KEY que Django ya genera
}


# Correo electrónico (recuperación de contraseña).
# Django no exige configurar EMAIL_BACKEND: si falta, usa el backend de
# consola, que imprime el mensaje en la terminal del servidor. Así, en
# desarrollo el enlace de recuperación se ve sin credenciales SMTP.
# Para enviar correos reales (Brevo, Gmail con contraseña de aplicación,
# etc.) basta con descomentar el bloque inferior y no tocar el código.
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
DEFAULT_FROM_EMAIL = 'no-responder@tallerdelroble.com'

# EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
# EMAIL_HOST = 'smtp-relay.brevo.com'
# EMAIL_PORT = 587
# EMAIL_HOST_USER = ''        # usuario SMTP (clave API, por ejemplo)
# EMAIL_HOST_PASSWORD = ''    # contraseña/clave SMTP
# EMAIL_USE_TLS = True

# Canal de envío de códigos de verificación (login, registro, recuperación).
# El motor (verificacion_service.py) no depende del canal: elegirlo es
# configuración. 'correo' funciona hoy con el backend de consola/SMTP de
# arriba; 'sms' usa el adaptador preparado de canales_envio.py.
CANAL_VERIFICACION = 'correo'

# --- Canal SMS (preparado, sin credenciales) ---
# Para activarlo en el futuro: completar estas variables, poner
# CANAL_VERIFICACION = 'sms' arriba, instalar el SDK del proveedor
# (por ejemplo `pip install twilio`) y llenar CanalSMS.enviar() en
# backend/api/services/canales_envio.py. Mientras esté sin completar,
# el motor responde con un error explícito en lugar de fingir el envío.
# SMS_PROVIDER = 'twilio'      # proveedor elegido
# SMS_API_KEY = ''             # credencial del proveedor (p. ej. Auth Token)
# SMS_FROM_NUMBER = ''         # número remitente asignado