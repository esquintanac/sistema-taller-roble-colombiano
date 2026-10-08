# backend/Dockerfile
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

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]