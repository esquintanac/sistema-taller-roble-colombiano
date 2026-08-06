// src/components/auth/RegistrerForm.jsx
// Formulario completo de registro (RF1). incluye el RoleSelector
// para elegir Carpintero o Administrador.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FormField from "../ui/FormField";
import Button from "../ui/Button";
import RoleSelector from "./RoleSelector";

const CAMPOS_INICIALES = {
    nombre: "", apellidos: "", telefono: "", correo: "", usuario: "", contrasena: "",
};

export default function RegistrerForm() {
    const [valores, setValores] = useState(CAMPOS_INICIALES);
    const [rol, setRol] = useState("Carpintero");
    const [errores, setErrores] = useState({});
    const navigate = useNavigate();

    function handleChange(e) {
        setValores({ ...valores, [e.target.name]: e.target.value });
    }

    function validar() {
        const nuevosErrores = {};
        Object.entries(valores).forEach(([campo, val]) => {
            if (!val.trim()) nuevosErrores[campo] = "Este campo es obligatorio.";
        });
        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!validar()) return;
        navigate("/verificacion");
    }

    return (
    <form onSubmit={handleSubmit} noValidate>
      <FormField label="Nombre" name="nombre" value={valores.nombre} onChange={handleChange} error={errores.nombre} requerido />
      <FormField label="Apellidos" name="apellidos" value={valores.apellidos} onChange={handleChange} error={errores.apellidos} requerido />
      <FormField label="Número telefónico" name="telefono" tipo="tel" value={valores.telefono} onChange={handleChange} error={errores.telefono} requerido />
      <FormField label="Correo electrónico" name="correo" tipo="email" value={valores.correo} onChange={handleChange} error={errores.correo} requerido />
      <FormField label="Usuario" name="usuario" value={valores.usuario} onChange={handleChange} error={errores.usuario} requerido />
      <FormField label="Contraseña" name="contrasena" tipo="password" value={valores.contrasena} onChange={handleChange} error={errores.contrasena} requerido />

      <div className="form-group">
        <label className="form-label">Rol <span style={{ color: "var(--error)" }}>*</span></label>
        <RoleSelector rolSeleccionado={rol} onSelect={setRol} />
      </div>

      <Button tipo="submit" variante="primary" tamano="lg" fullWidth>
        Registrarse
      </Button>
    </form>
  );
}