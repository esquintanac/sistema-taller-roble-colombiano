// src/pages/RestablecerContrasenaPage.jsx
// Paso 2 de la recuperación de contraseña: la ruta lleva el token de un
// solo uso (/restablecer/:token). Al montar se valida contra el backend y,
// solo si sigue vigente, se muestra el formulario de la contraseña nueva.
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import authService from "../services/authService";
import FormField from "../components/ui/FormField";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";

export default function RestablecerContrasenaPage() {
  const { token } = useParams();

  // Estado del enlace: "validando" -> "valido" | "invalido".
  const [estadoEnlace, setEstadoEnlace] = useState("validando");
  const [mensajeEnlace, setMensajeEnlace] = useState("");

  const [valores, setValores] = useState({ contrasena: "", confirmacion: "" });
  const [errores, setErrores] = useState({});
  const [errorGlobal, setErrorGlobal] = useState("");
  const [cargando, setCargando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  // Valida el token apenas se abre la pantalla: así el usuario no escribe
  // una contraseña nueva para que al final le digan que el enlace venció.
  useEffect(() => {
    let activo = true;
    authService
      .validarTokenRecuperacion(token)
      .then((data) => {
        if (!activo) return;
        if (data.valido) {
          setEstadoEnlace("valido");
        } else {
          setEstadoEnlace("invalido");
          setMensajeEnlace(data.mensaje);
        }
      })
      .catch(() => {
        if (!activo) return;
        setEstadoEnlace("invalido");
        setMensajeEnlace("No fue posible verificar el enlace. Inténtalo más tarde.");
      });
    return () => {
      activo = false;
    };
  }, [token]);

  function handleChange(e) {
    setValores({ ...valores, [e.target.name]: e.target.value });
  }

  function validar() {
    const nuevosErrores = {};
    if (!valores.contrasena) {
      nuevosErrores.contrasena = "Este campo es obligatorio.";
    } else if (valores.contrasena.length < 6) {
      nuevosErrores.contrasena = "La contraseña debe tener al menos 6 caracteres.";
    }
    if (valores.confirmacion !== valores.contrasena) {
      nuevosErrores.confirmacion = "Las contraseñas no coinciden.";
    }
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorGlobal("");
    if (!validar()) return;

    setCargando(true);
    try {
      await authService.restablecerContrasena(token, valores.contrasena);
      setGuardado(true);
    } catch (error) {
      // Si el backend rechazó el token (vencido o ya usado), se pasa a la
      // vista de enlace inválido para ofrecer pedir uno nuevo.
      if (error?.response?.status === 400 && error?.response?.data?.exito === false) {
        setEstadoEnlace("invalido");
        setMensajeEnlace(error.response.data.mensaje);
      } else {
        setErrorGlobal(
          error?.response?.data?.mensaje ||
            "No fue posible actualizar la contraseña. Inténtalo de nuevo."
        );
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="container-sm" style={{ maxWidth: 480, margin: "60px auto" }}>
      <h1>Nueva contraseña</h1>
      <div className="card">
        {estadoEnlace === "validando" && (
          <Alert tipo="info" mensaje="Verificando el enlace de recuperación…" />
        )}

        {estadoEnlace === "invalido" && (
          <>
            <Alert tipo="error" titulo="Enlace no disponible" mensaje={mensajeEnlace} />
            <Link className="btn btn-primary btn-full" to="/recuperar-contrasena">
              Solicitar un enlace nuevo
            </Link>
            <Link className="btn btn-secondary btn-full" to="/login">
              Volver a iniciar sesión
            </Link>
          </>
        )}

        {estadoEnlace === "valido" && guardado && (
          <>
            <Alert
              tipo="success"
              titulo="Contraseña actualizada"
              mensaje="Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión con la nueva."
            />
            <Link className="btn btn-primary btn-full" to="/login">
              Iniciar sesión
            </Link>
          </>
        )}

        {estadoEnlace === "valido" && !guardado && (
          <form onSubmit={handleSubmit} noValidate>
            <p style={{ color: "var(--tx-sec)", marginBottom: 16 }}>
              Escribe tu contraseña nueva. El enlace sirve una sola vez y vence
              a los 30 minutos de haberlo solicitado.
            </p>

            {errorGlobal && <Alert tipo="error" mensaje={errorGlobal} />}

            <FormField
              label="Nueva contraseña"
              name="contrasena"
              tipo="password"
              value={valores.contrasena}
              onChange={handleChange}
              error={errores.contrasena}
              requerido
              hint="Mínimo 6 caracteres."
              placeholder="••••••••"
            />

            <FormField
              label="Confirmar contraseña"
              name="confirmacion"
              tipo="password"
              value={valores.confirmacion}
              onChange={handleChange}
              error={errores.confirmacion}
              requerido
              placeholder="••••••••"
            />

            <Button tipo="submit" variante="primary" tamano="lg" fullWidth>
              {cargando ? "Guardando…" : "Guardar contraseña"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}