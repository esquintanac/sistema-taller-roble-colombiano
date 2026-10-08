// src/pages/NotFoundPage.jsx
// Pantalla 404: se muestra cuando la URL no coincide con ninguna ruta
// declarada en App.jsx. Antes, una dirección desconocida dejaba el cuerpo
// vacío (solo Header y Footer), sin explicarle nada al usuario.
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/ui/Button";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  // Con sesión activa lo natural es volver al panel; sin sesión, al login.
  const destino = usuario ? "/inicio" : "/login";

  return (
    <div className="container" style={{ maxWidth: 480, paddingTop: 60, paddingBottom: 60 }}>
      <div className="card" style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🧭</div>
        <h1 style={{ fontSize: 22 }}>Página no encontrada</h1>
        <p style={{ color: "var(--tx-sec)", margin: "10px 0 24px" }}>
          La dirección que abriste no existe o cambió de lugar.
        </p>
        <Button variante="primary" tamano="lg" fullWidth onClick={() => navigate(destino)}>
          {usuario ? "Volver al panel" : "Ir a iniciar sesión"}
        </Button>
      </div>
    </div>
  );
}