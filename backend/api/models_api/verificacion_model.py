"""
Modelo de datos de los artefactos de verificación de identidad.
Ruta: backend/api/models_api/verificacion_model.py

Se mapea sobre la tabla 'verificacion', creada con el script
database/verificacion.sql. managed = False le indica a Django que NO debe
crear ni modificar esta tabla: el esquema se lleva con SQL, igual que las
tablas heredadas del proyecto (Usuario, Cliente, ...).

Una sola tabla para los tres propósitos (login, registro, recuperacion),
tal como lo exige el RNF de garantías uniformes. Dato clave de seguridad:
aquí NO se guarda el código ni el token en claro, sino su hash SHA-256
(valor_hash). Aunque la base se filtra, el valor que llegó al correo no se
puede reconstruir a partir de ese hash.
"""

from django.db import models


class Verificacion(models.Model):
    id_verificacion = models.AutoField(primary_key=True, db_column="id_verificacion")
    proposito = models.CharField(max_length=20, db_column="proposito")
    destino = models.CharField(max_length=150, db_column="destino")
    # Anulable: en 'registro' (y en cuentas inexistentes de 'recuperacion')
    # el artefacto se emite sin que exista aún una cuenta asociada.
    id_usuario = models.IntegerField(null=True, blank=True, db_column="id_usuario")
    valor_hash = models.CharField(max_length=64, db_column="valor_hash")
    creado_en = models.DateTimeField(db_column="creado_en")
    expira_en = models.DateTimeField(db_column="expira_en")
    intentos = models.SmallIntegerField(default=0, db_column="intentos")
    usado = models.BooleanField(default=False, db_column="usado")

    class Meta:
        managed = False               # Django no crea/modifica esta tabla
        db_table = "verificacion"     # Nombre exacto de la tabla en MySQL

    def __str__(self):
        estado = "usado" if self.usado else "vigente"
        return f"Verificación {self.proposito} hacia {self.destino} ({estado})"