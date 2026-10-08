// src/components/auth/VerificationCodeForm.jsx
// Paso del código de 6 dígitos (RNF: seguridad). El BACKEND genera, envía
// por correo y valida el código (VerificacionService); aquí solo se pide,
// se muestra el destino enmascarado y se captura lo que ingresa el usuario.
//
// Se usa en dos flujos:
//   - Login (sin props): confirma contra /api/auth/verificacion/confirmar/
//     y, con el código correcto, activa la sesión JWT y entra al panel.
//   - Registro (con props): el padre (RegisterForm) recibe el código y lo
//     canjea junto con los datos del formulario en /api/auth/registro/.
//
// En desarrollo el backend devuelve además "codigo_demo" (el código que
// acaba de enviar por el canal de consola); si viene, se muestra para poder
// probar sin leer la terminal. En producción ese dato no existe.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import Button from "../ui/Button";
import Alert from "../ui/Alert";

export default function VerificationCodeForm({
  destino: destinoProp,
  nombreCuenta: nombreProp,
  codigoDemo: codigoDemoInicial,
  expiraEn: expiraEnInicial,
  reenviarEnSegundos = 0,
  onConfirmar,
  onReenviar,
  onVolver,
  textoVolver = "Volver al login",
} = {}) {
  const { usuarioPendiente, confirmarSesion, cancelarVerificacion } = useAuth();
  const navigate = useNavigate();

  // Sin props -> flujo de login: los datos salen de la sesión pendiente
  // que guardó authService durante POST /api/auth/login/.
  const pendienteInicial = authService.sesionPendiente();
  const destino = destinoProp ?? pendienteInicial?.destino ?? "";
  const nombreCuenta = nombreProp ?? usuarioPendiente?.nombre ?? "";

  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [codigoDemo, setCodigoDemo] = useState(
    codigoDemoInicial ?? pendienteInicial?.codigoDemo ?? ""
  );
  // Expiración del código: la decide el backend (expira_en_ms).
  const [expiraEn, setExpiraEn] = useState(
    expiraEnInicial ?? pendienteInicial?.expiraEn ?? 0
  );
  // Instante a partir del cual se puede pedir un reenvío (cooldown 60 s).
  const [puedeReenviarEn, setPuedeReenviarEn] = useState(() =>
    expiraEnInicial !== undefined
      ? Date.now() + reenviarEnSegundos * 1000
      : pendienteInicial?.reenviarDisponibleEn ?? 0
  );

  // "tick" fuerza el re-render cada segundo para actualizar los contadores.
  const [, setTick] = useState(0);
  useEffect(() => {
    const temporizador = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(temporizador);
  }, []);

  const restante = Math.max(0, Math.ceil((expiraEn - Date.now()) / 1000));
  const expirado = restante <= 0;
  const minutos = Math.floor(restante / 60);
  const segundos = String(restante % 60).padStart(2, "0");

  const esperaReenvio = Math.max(0, Math.ceil((puedeReenviarEn - Date.now()) / 1000));
  const minutosReenvio = Math.floor(esperaReenvio / 60);
  const segundosReenvio = String(esperaReenvio % 60).padStart(2, "0");

  function handleChange(e) {
    setError("");
    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setAviso("");

    if (expirado) {
      setError("El código expiró. Solicita uno nuevo para continuar.");
      return;
    }
    if (codigo.length !== 6) {
      setError("Ingresa el código completo de 6 dígitos.");
      return;
    }

    setEnviando(true);
    try {
      if (onConfirmar) {
        // Flujo de registro: el padre canjea el código junto a los datos
        // del formulario (el backend los consume en un solo paso).
        await onConfirmar(codigo);
      } else {
        // Flujo de login: el backend valida el código y solo entonces
        // devuelve los tokens; con ellos se activa la sesión.
        await confirmarSesion(codigo);
        // Se entra directo al Panel del Taller; HomePage ya arma las
        // tarjetas según el rol, así que no hace falta decidir la ruta.
        navigate("/inicio", { replace: true });
      }
    } catch (err) {
      // El mensaje del backend distingue: código incorrecto (con los
      // intentos que quedan), expirado, bloqueado o sesión perdida. El
      // registro devuelve la lista en "errores" en lugar de "mensaje".
      const data = err?.response?.data;
      setError(
        data?.mensaje ||
          (Array.isArray(data?.errores) ? data.errores.join(" ") : "") ||
          err?.message ||
          "No se pudo verificar el código. Intenta de nuevo."
      );
      setCodigo("");
    } finally {
      setEnviando(false);
    }
  }

  async function handleReenviar() {
    if (esperaReenvio > 0 || enviando) return;
    setError("");
    setAviso("");
    setEnviando(true);
    try {
      const datos = onReenviar ? await onReenviar() : await authService.reenviarCodigo();
      if (!datos?.verificacion) {
        setError("La sesión de verificación se perdió. Vuelve a iniciar el proceso.");
        return;
      }
      const { verificacion } = datos;
      setCodigo("");
      setCodigoDemo(datos.codigo_demo || "");
      setExpiraEn(verificacion.expira_en_ms);
      setPuedeReenviarEn(
        Date.now() + (verificacion.reenviar_disponibles_en || 0) * 1000
      );
      if (verificacion.reenviar_disponibles_en > 0) {
        // El cooldown del servidor manda: NO se envió otro correo.
        setAviso(
          `Aún no puedes pedir otro código: espera ${verificacion.reenviar_disponibles_en} segundos.`
        );
      } else {
        setAviso("Se envió un nuevo código a tu correo.");
      }
    } catch (err) {
      setError(
        err?.response?.data?.mensaje ||
          err?.message ||
          "No se pudo reenviar el código. Intenta de nuevo."
      );
    } finally {
      setEnviando(false);
    }
  }

  function handleVolver() {
    if (onVolver) {
      onVolver();
      return;
    }
    cancelarVerificacion();
    navigate("/login");
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Alert
        tipo="info"
        mensaje={
          <>
            Código enviado al correo <strong>{destino}</strong>
            {nombreCuenta && (
              <>
                , cuenta de <strong>{nombreCuenta}</strong>
              </>
            )}
          </>
        }
      />

      {error && <Alert tipo="error" mensaje={error} />}
      {aviso && !error && <Alert tipo="success" mensaje={aviso} />}

      <div className="form-group">
        <label className="form-label" htmlFor="codigo">
          Código de verificación <span style={{ color: "var(--error)" }}>*</span>
        </label>
        <input
          id="codigo"
          name="codigo"
          inputMode="numeric"
          autoComplete="one-time-code"
          className={`form-control ${error ? "is-error" : ""}`}
          style={{ textAlign: "center", fontSize: 24, letterSpacing: 8, fontWeight: 700 }}
          maxLength={6}
          value={codigo}
          onChange={handleChange}
          placeholder="000000"
        />
        {error && <span className="field-error">{error}</span>}
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "var(--tx-muted)", marginBottom: 16 }}>
        {expirado ? (
          <strong style={{ color: "var(--error)" }}>El código expiró</strong>
        ) : (
          <>
            El código expira en{" "}
            <strong style={{ color: "var(--primary)" }}>
              {minutos}:{segundos}
            </strong>
          </>
        )}
      </p>

      <Button
        tipo="submit"
        variante="primary"
        tamano="lg"
        fullWidth
        disabled={expirado || enviando}
      >
        {enviando ? "Verificando…" : "Verificar código"}
      </Button>

      {/* Modo demostración: solo cuando el BACKEND informa el código que
          envió (DEBUG=True, canal de consola). En producción no existe. */}
      {codigoDemo && (
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--tx-muted)", marginTop: 14 }}>
          Modo demostración — el backend envió a tu correo:{" "}
          <strong style={{ letterSpacing: 2, color: "var(--tx-sec)" }}>{codigoDemo}</strong>
        </p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
          fontSize: 13,
        }}
      >
        <button
          type="button"
          onClick={handleVolver}
          style={{ background: "none", border: "none", color: "var(--tx-sec)", cursor: "pointer", padding: 0 }}
        >
          {textoVolver}
        </button>
        <button
          type="button"
          onClick={handleReenviar}
          disabled={esperaReenvio > 0 || enviando}
          style={{
            background: "none",
            border: "none",
            color: esperaReenvio > 0 ? "var(--tx-sec)" : "var(--primary)",
            fontWeight: 700,
            cursor: esperaReenvio > 0 ? "not-allowed" : "pointer",
            padding: 0,
            opacity: esperaReenvio > 0 ? 0.7 : 1,
          }}
        >
          {esperaReenvio > 0
            ? `Reenviar en ${minutosReenvio}:${segundosReenvio}`
            : "Reenviar código"}
        </button>
      </div>
    </form>
  );
}