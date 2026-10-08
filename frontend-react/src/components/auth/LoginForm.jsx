// src/components/auth/LoginForm.jsx
// Formulario de usuario/contraseña. Valida campos y muestra error de
// credenciales incorrectas (RF1, RF7, HU-01).

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import FormField from "../ui/FormField";
import Button from "../ui/Button";
import Alert from "../ui/Alert";

export default function LoginForm() {
  const [valores, setValores] = useState({ usuario: "", contrasena: "" });
  const [errores, setErrores] = useState({});
  const [errorGlobal, setErrorGlobal] = useState("");
  const [cargando, setCargando] = useState(false);
  const { iniciarVerificacion } = useAuth();
  const navigate = useNavigate();

  function handleChange(e) {
    setValores({ ...valores, [e.target.name]: e.target.value });
  }

  function validar() {
    const nuevosErrores = {};
    if (!valores.usuario.trim()) nuevosErrores.usuario = "Este campo es obligatorio.";
    if (!valores.contrasena.trim()) nuevosErrores.contrasena = "Este campo es obligatorio.";
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorGlobal("");
    if (!validar()) return;

    setCargando(true);
    try {
      await authService.login(valores.usuario, valores.contrasena);
      // Las credenciales son correctas, pero la sesión todavía NO se
      // activa: el backend envió el código de verificación al correo y
      // los tokens recién llegan al confirmarlo (segundo factor, RNF).
      iniciarVerificacion();
      navigate("/verificacion");
    } catch (error) {
      const mensaje =
        error?.response?.data?.mensaje ||
        "Usuario o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.";
      setErrorGlobal(mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {errorGlobal && <Alert tipo="error" mensaje={errorGlobal} />}

      <FormField
        label="Usuario"
        name="usuario"
        value={valores.usuario}
        onChange={handleChange}
        error={errores.usuario}
        requerido
        placeholder="Ingresa tu nombre de usuario"
      />

      <FormField
        label="Contraseña"
        name="contrasena"
        tipo="password"
        value={valores.contrasena}
        onChange={handleChange}
        error={errores.contrasena}
        requerido
        placeholder="••••••••"
      />

      <Link to="/recuperar-contrasena" className="auth-forgot">
        ¿Olvidaste tu contraseña?
      </Link>

      <Button tipo="submit" variante="primary" tamano="lg" fullWidth>
        {cargando ? "Ingresando…" : "Iniciar sesión"}
      </Button>
    </form>
  );
}