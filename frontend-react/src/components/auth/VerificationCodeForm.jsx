// src/components/auth/VerificationCodeForm.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";
import Alert from "../ui/Alert";

export default function VerificationCodeForm() {
  const [codigo, setCodigo] = useState("");
  const [segundos, setSegundos] = useState(299);
  const [error, setError] = useState("");
  const { usuario } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (segundos <= 0) return;
    const timer = setInterval(() => setSegundos((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [segundos]);

  const minutos = Math.floor(segundos / 60);
  const restoSegundos = String(segundos % 60).padStart(2, "0");

  function handleSubmit(e) {
    e.preventDefault();
    if (codigo.length !== 6) {
      setError("Ingresa el código de 6 dígitos.");
      return;
    }
    if (codigo !== "123456") {
      setError("Código incorrecto. Inténtalo de nuevo.");
      return;
    }

    // Redirección según el rol del usuario que inició sesión
    if (usuario?.rol === "Administrador") {
      navigate("/tutorial-admin");
    } else {
      navigate("/tutorial");
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Alert tipo="info" mensaje="Se envió un código de 6 dígitos a tu número registrado." />

      <div className="form-group">
        <label className="form-label" htmlFor="codigo">Código de verificación *</label>
        <input
          id="codigo"
          className={`form-control ${error ? "is-error" : ""}`}
          style={{ textAlign: "center", fontSize: 24, letterSpacing: 8 }}
          maxLength={6}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
        />
        {error && <span className="field-error">{error}</span>}
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "var(--tx-muted)", marginBottom: 16 }}>
        El código expira en <strong style={{ color: "var(--primary)" }}>{minutos}:{restoSegundos}</strong>
      </p>

      <Button tipo="submit" variante="primary" tamano="lg" fullWidth>
        Verificar código
      </Button>
    </form>
  );
}