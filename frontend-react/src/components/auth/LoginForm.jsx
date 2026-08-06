// src/components/auth/LoginForm.jsx
// Formulario de usuario/contraseña. Valida campos y muestra error de
// credenciales incorrectas (RF1, RF7, HU-01).

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import FormField from "../ui/FormField";
import Button from "../ui/Button";
import Alert from "../ui/Alert";

const USUARIOS_PRUEBA = [
  { usuario: "carpintero01", contrasena: "1234", nombre: "Juan Pérez", rol: "Carpintero" },
  { usuario: "admin01", contrasena: "1234", nombre: "Eric Quintana", rol: "Administrador" },
];

export default function LoginForm() {
  const [valores, setValores] = useState({ usuario: "", contrasena: "" });
  const [errores, setErrores] = useState({});
  const [errorGlobal, setErrorGlobal] = useState("");
  const { iniciarSesion } = useAuth();
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

  function handleSubmit(e) {
    e.preventDefault();
    setErrorGlobal("");
    if (!validar()) return;

    const encontrado = USUARIOS_PRUEBA.find(
      (u) => u.usuario === valores.usuario && u.contrasena === valores.contrasena
    );

    if (!encontrado) {
      setErrorGlobal("Usuario o contraseña incorrectos. Verifica tus datos e inténtalo de nuevo.");
      return;
    }

    iniciarSesion(encontrado);
    navigate("/verificacion");
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

      <Button tipo="submit" variante="primary" tamano="lg" fullWidth>
        Iniciar sesión
      </Button>
    </form>
  );
}