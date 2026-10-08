// src/components/auth/RegisterForm.jsx
// Formulario completo de registro (RF1) en DOS pasos:
//   Paso 1: los datos del formulario (incluye RoleSelector). El backend
//           los valida y, si todo está bien, envía el código de 6 dígitos
//           al correo informado.
//   Paso 2: el código de verificación. Solo con el código correcto y
//           consumido el backend crea la cuenta; después se va al login.
//
// Los datos del formulario —incluida la contraseña— viven SOLO en memoria
// React entre pasos: nunca se guardan en localStorage/sessionStorage.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import FormField from "../ui/FormField";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import RoleSelector from "./RoleSelector";
import VerificationCodeForm from "./VerificationCodeForm";

const CAMPOS_INICIALES = {
    nombre: "", apellidos: "", telefono: "", correo: "", usuario: "", contrasena: "",
};

export default function RegisterForm() {
    const [valores, setValores] = useState(CAMPOS_INICIALES);
    const [rol, setRol] = useState("Carpintero");
    const [errores, setErrores] = useState({});
    const [erroresServidor, setErroresServidor] = useState([]);
    const [cargando, setCargando] = useState(false);
    // Paso 1 = datos del formulario; paso 2 = código de verificación.
    const [paso, setPaso] = useState(1);
    // Respuesta del paso 1 (id, destino enmascarado, tiempos). Se mantiene
    // solo en memoria: sin ella se vuelve al paso 1 a pedir otro código.
    const [verificacion, setVerificacion] = useState(null);
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

    // Paso 1: valida los datos contra el backend y hace enviar el código
    // al correo informado. Si el backend responde 400, data.errores trae
    // la lista (campos inválidos o cuentas duplicadas).
    async function solicitarCodigo(e) {
        e.preventDefault();
        setErroresServidor([]);
        if (!validar()) return;

        setCargando(true);
        try {
            const data = await authService.solicitarRegistro({ ...valores, rol });
            setVerificacion({
                id: data.verificacion.id_verificacion,
                destino: data.verificacion.destino_enmascarado,
                expiraEn: data.verificacion.expira_en_ms,
                reenviarEnSegundos: data.verificacion.reenviar_disponibles_en,
                codigoDemo: data.codigo_demo || "",
            });
            setPaso(2);
        } catch (error) {
            const data = error?.response?.data;
            // El backend devuelve { errores: [...] } en fallos de validación.
            const lista = data?.errores || [data?.mensaje || "No se pudo enviar el código de verificación."];
            setErroresServidor(lista);
        } finally {
            setCargando(false);
        }
    }

    // Paso 2: el código se canjea junto con los datos del formulario; el
    // backend crea la cuenta solo si ambos son válidos.
    async function confirmarCodigo(codigo) {
        await authService.registrar({ ...valores, rol }, verificacion.id, codigo);
        // Registro exitoso -> al login para autenticarse con JWT.
        navigate("/login");
    }

    // Reenvío del mismo código de registro (el cooldown lo decide el
    // backend; el nombre viaja porque la cuenta aún no existe).
    function reenviarCodigo() {
        return authService.reenviarCodigo(verificacion.id, valores.nombre);
    }

    function volverAlFormulario() {
        setErroresServidor([]);
        setPaso(1);
    }

    // Paso 2: la pantalla de código reutiliza el mismo componente del login.
    if (paso === 2 && verificacion) {
        return (
            <VerificationCodeForm
                destino={verificacion.destino}
                nombreCuenta={valores.nombre}
                codigoDemo={verificacion.codigoDemo}
                expiraEn={verificacion.expiraEn}
                reenviarEnSegundos={verificacion.reenviarEnSegundos}
                onConfirmar={confirmarCodigo}
                onReenviar={reenviarCodigo}
                onVolver={volverAlFormulario}
                textoVolver="Volver al formulario"
            />
        );
    }

    return (
    <form onSubmit={solicitarCodigo} noValidate>
      {erroresServidor.length > 0 && (
        <Alert tipo="error" mensaje={erroresServidor.join(" ")} />
      )}

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

      <Button tipo="submit" variante="primary" tamano="lg" fullWidth disabled={cargando}>
        {cargando ? "Enviando código…" : "Continuar"}
      </Button>
    </form>
    );
}