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

        nombre = datos.get("nombre", "").strip()
        if not nombre:
            errores.append("El nombre es obligatorio.")
        elif len(nombre) > 255:
            errores.append("El nombre no puede exceder los 255 caracteres.")

        apellido = datos.get("apellido", "").strip()
        if not apellido:
            errores.append("El apellido es obligatorio.")
        elif len(apellido) > 255:
            errores.append("El apellido no puede exceder los 255 caracteres.")

        correo = datos.get("correo", "")
        patron_correo = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
        if not re.match(patron_correo, correo):
            errores.append("El correo electrónico no tiene un formato válido.")
        elif len(correo) > 100:
            errores.append("El correo no puede exceder los 100 caracteres.")

        if Usuario.objects.filter(correo=correo).exists():
            errores.append("Ya existe una cuenta registrada con este correo.")

        usuario = datos.get("usuario", "")
        if len(usuario) < 4:
            errores.append("El nombre de usuario debe tener al menos 4 caracteres.")
        elif len(usuario) > 50:
            errores.append("El nombre de usuario no puede exceder los 50 caracteres.")
        elif Usuario.objects.filter(usuario=usuario).exists():
            errores.append("Ese nombre de usuario ya está en uso.")

        contrasena = datos.get("contrasena", "")
        if len(contrasena) < 6:
            errores.append("La contraseña debe tener al menos 6 caracteres.")
        elif len(contrasena) > 128:
            errores.append("La contraseña no puede exceder los 128 caracteres.")

        telefono = datos.get("telefono", "")
        if telefono and len(telefono) > 15:
            errores.append("El teléfono no puede exceder los 15 caracteres.")

        rol = datos.get("rol_usuario", "")
        if rol not in ("Carpintero", "Administrador"):
            errores.append("El rol debe ser Carpintero o Administrador")

        return errores

    @staticmethod
    def validar_datos_login(datos):
        """
        Valida los datos de login antes de autenticar. Retorna una lista
        de errores (vacía si todo es válido).
        """
        errores = []

        usuario = datos.get("usuario", "")
        if not usuario.strip():
            errores.append("El usuario es obligatorio.")
        elif len(usuario) < 4:
            errores.append("El nombre de usuario debe tener al menos 4 caracteres.")
        elif len(usuario) > 50:
            errores.append("El nombre de usuario no puede exceder los 50 caracteres.")

        contrasena = datos.get("contrasena", "")
        if not contrasena.strip():
            errores.append("La contraseña es obligatoria.")
        elif len(contrasena) < 6:
            errores.append("La contraseña debe tener al menos 6 caracteres.")
        elif len(contrasena) > 128:
            errores.append("La contraseña no puede exceder los 128 caracteres.")

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