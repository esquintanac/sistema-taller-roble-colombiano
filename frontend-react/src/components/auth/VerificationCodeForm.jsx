// src/components/auth/VerificationCodeForm.jsx
// Segundo factor de autenticación (RNF: seguridad de doble factor).
// El usuario ya validó usuario/contraseña contra la API, pero la sesión
// JWT permanece PENDIENTE hasta que ingrese el código de 6 dígitos que
// simula el envío por SMS. Al verificar, la sesión se activa y se
// redirige al Panel del Taller (/inicio), que arma sus acciones
// según el rol del usuario.

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import authService from "../../services/authService";
import Button from "../ui/Button";
import Alert from "../ui/Alert";

export default function VerificationCodeForm() {
  const { usuarioPendiente, confirmarSesion, cancelarVerificacion } = useAuth();
  const navigate = useNavigate();

  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  // Código "enviado" y su hora de expiración, tomados de la sesión
  // pendiente que guardó authService durante el login.
  const pendienteInicial = authService.sesionPendiente();
  const [codigoDemo, setCodigoDemo] = useState(pendienteInicial?.codigo ?? "");
  const [expiraEn, setExpiraEn] = useState(pendienteInicial?.expiraEn ?? 0);

  // "tick" fuerza el re-render cada segundo para actualizar el contador.
  const [, setTick] = useState(0);
  useEffect(() => {
    const temporizador = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(temporizador);
  }, []);

  const restante = Math.max(0, Math.ceil((expiraEn - Date.now()) / 1000));
  const expirado = restante <= 0;
  const minutos = Math.floor(restante / 60);
  const segundos = String(restante % 60).padStart(2, "0");

  function handleChange(e) {
    setError("");
    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6));
  }

  function handleSubmit(e) {
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
    if (!authService.verificarCodigo(codigo)) {
      setError("Código incorrecto. Verifica el número e inténtalo de nuevo.");
      return;
    }

    // Código correcto: se activa la sesión JWT y se entra directamente
    // al Panel del Taller. HomePage ya arma las tarjetas según el rol,
    // así que no hace falta decidir la ruta aquí. El tutorial queda
    // disponible desde el Header y desde el propio panel, por si el
    // usuario quiere repasarlo.
    const usuario = confirmarSesion();
    if (!usuario) {
      // Si la sesión pendiente se perdió (por ejemplo, se venció el
      // código justo al confirmar), NO se navega a ciegas: una ruta
      // protegida con el usuario en null rebotaría a /login y el usuario
      // no sabría por qué.
      setError("La sesión de verificación se perdió. Vuelve a iniciar sesión.");
      return;
    }
    navigate("/inicio", { replace: true });
  }

  function handleReenviar() {
    const nuevo = authService.reenviarCodigo();
    if (!nuevo) {
      setError("La sesión de verificación se perdió. Inicia sesión nuevamente.");
      return;
    }
    setCodigo("");
    setError("");
    setCodigoDemo(nuevo.codigo);
    setExpiraEn(nuevo.expiraEn);
    setAviso("Se envió un nuevo código a tu teléfono.");
  }

  function handleVolver() {
    cancelarVerificacion();
    navigate("/login");
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Alert
        tipo="info"
        mensaje={
          <>
            Código enviado al número <strong>+57 ****** 5896</strong>
            {usuarioPendiente?.nombre && (
              <>
                , cuenta de <strong>{usuarioPendiente.nombre}</strong>
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

      <Button tipo="submit" variante="primary" tamano="lg" fullWidth disabled={expirado}>
        Verificar código
      </Button>

      {/* Modo demostración: como no hay una pasarela SMS real, se muestra
          el código generado para que el flujo pueda probarse. */}
      {codigoDemo && (
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--tx-muted)", marginTop: 14 }}>
          Modo demostración — código enviado:{" "}
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
          Volver al login
        </button>
        <button
          type="button"
          onClick={handleReenviar}
          style={{ background: "none", border: "none", color: "var(--primary)", fontWeight: 700, cursor: "pointer", padding: 0 }}
        >
          Reenviar código
        </button>
      </div>
    </form>
  );
}