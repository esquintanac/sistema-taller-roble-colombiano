"""
Modelo de datos del Usuario.
Ruta: backend/api/models_api/usuario_model.py

Se mapea directamente sobre la tabla 'Usuario' que ya existe en MySQL
(creada en el script SQL de la evidencia del modelo relacional).
managed = False le indica a Django que NO debe crear ni modificar esta
tabla — solo la usa para leer y escribir, porque ya existe y ya tiene
datos reales.
"""

from django.db import models


class Usuario(models.Model):
    id_usuario = models.AutoField(primary_key=True, db_column="id_usuario")
    nombre = models.CharField(max_length=255, db_column="Nombre")
    apellido = models.CharField(max_length=255, db_column="Apellido")
    correo = models.CharField(max_length=100, db_column="Correo", unique=True)
    telefono = models.CharField(max_length=15, db_column="Telefono", null=True, blank=True)
    usuario = models.CharField(max_length=255, db_column="Usuario", unique=True)
    contrasena = models.CharField(max_length=255, db_column="Contrasena")
    rol_usuario = models.CharField(max_length=50, db_column="Rol_usuario")

    class Meta:
        managed = False           # Django no crea/modifica esta tabla
        db_table = "Usuario"      # Nombre exacto de la tabla en MySQL

    def __str__(self):
        return f"{self.nombre} {self.apellido} ({self.usuario})"