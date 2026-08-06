// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem("trc_usuario");
    return guardado ? JSON.parse(guardado) : null;
  });

  function iniciarSesion(datosUsuario) {
    setUsuario(datosUsuario);
    localStorage.setItem("trc_usuario", JSON.stringify(datosUsuario));
  }

  function cerrarSesion() {
    setUsuario(null);
    localStorage.removeItem("trc_usuario");
  }

  return (
    <AuthContext.Provider value={{ usuario, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}