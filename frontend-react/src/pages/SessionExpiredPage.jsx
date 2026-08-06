// src/pages/SessionExpiredPage.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";

export default function SessionExpiredPage() {
  const navigate = useNavigate();
  const { cerrarSesion } = useAuth();

  function handleVolver() {
    cerrarSesion(); // limpia el usuario para que el Header desaparezca en /login
    navigate("/login");
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--seminegro)" }}>
      <div className="card" style={{ maxWidth: 400, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--error-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 28 }}>⚠</div>
        <h1 style={{ fontSize: 22 }}>Sesión expirada</h1>
        <p style={{ color: "var(--tx-sec)", margin: "10px 0 24px" }}>
          Tu sesión se cerró automáticamente por 30 minutos de inactividad.
        </p>
        <Button variante="primary" tamano="lg" fullWidth onClick={handleVolver}>
          Volver a iniciar sesión
        </Button>
      </div>
    </div>
  );
}