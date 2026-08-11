"""
Servicio de autenticación: contiene las reglas de negocio.
Ruta: backend/api/services/auth_service.py

Esta capa NO sabe nada de HTTP (no ve request ni response). Solo
recibe datos ya limpios y aplica la lógica real: validar reglas,
hashear contraseñas, verificar credenciales. Esto permite reutilizar
esta lógica desde otro lugar en el futuro (por ejemplo, un comando
de consola) sin depender de Django REST Framework.
"""

import re
from django.contrib.auth.hashers import make_password, check_password
from api.models_api.usuario_model import Usuario


class AuthService:

    @staticmethod
    def validar_datos_registro(datos):
        """
        Valida las reglas de negocio del registro. Retorna una lista
        de errores (vacía si todo es válido).
        """
        errores = []

        if not datos.get("nombre", "").strip():
            errores.append("El nombre es obligatorio.")

        if not datos.get("apellido", "").strip():
            errores.append("El apellido es obligatorio.")

        correo = datos.get("correo", "")
        patron_correo = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        if not re.match(patron_correo, correo):
            errores.append("El correo electrónico no tiene un formato válido.")

        if Usuario.objects.filter(correo=correo).exists():
            errores.append("Ya existe una cuenta registrada con este correo.")

        usuario = datos.get("usuario", "")
        if len(usuario) < 4:
            errores.append("El nombre de usuario debe tener al menos 4 caracteres.")
        elif Usuario.objects.filter(usuario=usuario).exists():
            errores.append("Ese nombre de usuario ya está en uso.")

        contrasena = datos.get("contrasena", "")
        if len(contrasena) < 6:
            errores.append("La contraseña debe tener al menos 6 caracteres.")

        rol = datos.get("rol_usuario", "")
        if rol not in ("Carpintero", "Administrador"):
            errores.append("El rol debe ser Carpintero o Administrador")

        return errores

    @staticmethod
    def registrar_usuario(datos):
        """Crea el usuario con la contraseña hasheada (nunca en texto plano)."""
        nuevo_usuario = Usuario.objects.create(
            nombre=datos["nombre"],
            apellido=datos["apellido"],
            correo=datos["correo"],
            telefono=datos.get("telefono", ""),
            usuario=datos["usuario"],
            contrasena=make_password(datos["contrasena"]),  # hash seguro
            rol_usuario=datos["rol_usuario"],
        )
        return nuevo_usuario

    @staticmethod
    def autenticar(usuario_input, contrasena_input):
        """
        Verifica las credenciales. Retorna el objeto Usuario si son
        correctas, o None si no lo son. Nunca revela cuál de los dos
        datos (usuario o contraseña) fue el incorrecto, por seguridad.
        """
        try:
            usuario = Usuario.objects.get(usuario=usuario_input)
        except Usuario.DoesNotExist:
            return None

        if not check_password(contrasena_input, usuario.contrasena):
            return None

        return usuario