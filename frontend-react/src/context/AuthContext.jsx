// src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => authService.usuarioGuardado());
  // Usuario que ya probó sus credenciales pero aún no confirma el
  // código SMS. Mientras exista, la sesión real permanece inactiva.
  const [usuarioPendiente, setUsuarioPendiente] = useState(
    () => authService.sesionPendiente()?.usuario ?? null
  );

  // Escucha el evento "sesion-expirada" que dispara el interceptor 401
  // de api.js para limpiar el estado de React ademas del localStorage.
  useEffect(() => {
    function manejarExpiracion() {
      authService.limpiarSesion();
      setUsuario(null);
      setUsuarioPendiente(null);
    }
    window.addEventListener("sesion-expirada", manejarExpiracion);
    return () => window.removeEventListener("sesion-expirada", manejarExpiracion);
  }, []);

  function iniciarSesion(datosUsuario) {
    setUsuario(datosUsuario);
    localStorage.setItem("trc_usuario", JSON.stringify(datosUsuario));
  }

  function cerrarSesion() {
    authService.limpiarSesion();
    setUsuario(null);
    setUsuarioPendiente(null);
  }

  // Se llama justo después de validar usuario/contraseña contra la API:
  // refleja en React la sesión que authService dejó pendiente de SMS.
  function iniciarVerificacion() {
    const pendiente = authService.sesionPendiente();
    setUsuarioPendiente(pendiente?.usuario ?? null);
    return pendiente;
  }

  // Se llama solo cuando el código SMS fue verificado: activa la sesión.
  function confirmarSesion() {
    const datosUsuario = authService.confirmarSesion();
    setUsuarioPendiente(null);
    if (datosUsuario) setUsuario(datosUsuario);
    return datosUsuario;
  }

  // Cancela el proceso de verificación (p. ej. volver al login).
  function cancelarVerificacion() {
    authService.descartarPendiente();
    setUsuarioPendiente(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        usuarioPendiente,
        iniciarSesion,
        cerrarSesion,
        iniciarVerificacion,
        confirmarSesion,
        cancelarVerificacion,
        estaAutenticado: Boolean(usuario),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}