# backend/Dockerfile
# Imagen del backend para despliegue contenedorizado (Railway, etc.).
# Si Railway detecta este archivo usa la imagen; si no, cae en el
# Procfile (gunicorn) de esta misma carpeta. Ambos caminos terminan
# sirviendo con gunicorn sobre el puerto $PORT que asigna Railway.
FROM python:3.12-slim

# Dependencias de sistema necesarias para mysqlclient y WeasyPrint
RUN apt-get update && apt-get install -y \
    build-essential \
    default-libmysqlclient-dev \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# gunicorn en lugar de runserver: runserver es SOLO para desarrollo y
# Railway lo trata como servidor de desarrollo. $PORT lo inyecta Railway
# (8000 por defecto); localmente el contenedor usa 8000 igual que siempre.
CMD ["sh", "-c", "gunicorn config.wsgi --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 120"]