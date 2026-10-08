"""
Modelo de datos de los enlaces de recuperación de contraseña.
Ruta: backend/api/models_api/token_recuperacion_model.py

DEPRECADO: este modelo dejó de usarse cuando la lógica de seguridad se
unificó en VerificacionService / tabla 'verificacion' (RNF de garantías
uniformes). El archivo y la tabla se conservan por trazabilidad de la
evidencia; los flujos ya no escriben aquí.

Se mapea sobre la tabla 'token_recuperacion', creada con el script
database/token_recuperacion.sql. managed = False le indica a Django que
NO debe crear ni modificar esta tabla: el esquema se lleva con SQL, igual
que las tablas heredadas del proyecto (Usuario, Cliente, ...).

Dato clave de seguridad: aquí NO se guarda el token en claro, sino su
hash SHA-256 (token_hash). Aunque la base se filtra, el enlace que llegó
al correo no se puede reconstruir a partir de ese hash.
"""

from django.db import models


class TokenRecuperacion(models.Model):
    id_token = models.AutoField(primary_key=True, db_column="id_token")
    id_usuario = models.IntegerField(db_column="id_usuario")
    token_hash = models.CharField(max_length=64, db_column="token_hash")
    creado_en = models.DateTimeField(db_column="creado_en")
    expira_en = models.DateTimeField(db_column="expira_en")
    usado = models.BooleanField(default=False, db_column="usado")

    class Meta:
        managed = False                  # Django no crea/modifica esta tabla
        db_table = "token_recuperacion"  # Nombre exacto de la tabla en MySQL

    def __str__(self):
        estado = "usado" if self.usado else "vigente"
        return f"Token de recuperación del usuario {self.id_usuario} ({estado})"
