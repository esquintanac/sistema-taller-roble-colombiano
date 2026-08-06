// src/components/layout/Header.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { usuario, cerrarSesion } = useAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (!usuario) return null;

  const iniciales = usuario.nombre
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const paginasConBoton = [
    "/formulario-datos",
    "/validar-datos",
    "/disenio-3d",
    "/reporte",
    "/historial",
    "/materiales",
  ];

  const mostrarBoton = paginasConBoton.includes(location.pathname) || location.pathname.startsWith("/detalle-admin/");

  function handleLogout() {
    cerrarSesion();
    navigate("/login");
  }

  return (
    <header className="site-header">
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}
      >
        <div className="site-logo">
          Taller del <span>Roble</span> Colombiano
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginLeft: "auto",
            position: "relative",
          }}
        >

          <div
            className="nav-avatar"
            onClick={() => setMenuAbierto(!menuAbierto)}
            role="button"
            tabIndex={0}
          >
            {iniciales}
          </div>
          <span style={{ fontSize: 13, color: "#d4c2b0" }}>{usuario.nombre}</span>
          <span className={`badge-rol ${usuario.rol === "Administrador" ? "badge-admin" : "badge-carpintero"}`}>
            {usuario.rol}
          </span>

          {mostrarBoton && (
            <button 
            onClick={() => navigate(usuario.rol === "Administrador" ? "/tutorial-admin" : "/tutorial")}
            style={{ padding: "8px 16px", background: "var(--marron-cla)", color: "var(--tx-main)", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: 700 }}
            >
            Repetir tutorial
          </button>
          )}
          
          {menuAbierto && (
            <div
              style={{
                position: "absolute", top: "calc(100% + 10px)", right: 0,
                minWidth: 160, background: "#fff", border: "1px solid var(--border)",
                borderRadius: 8, boxShadow: "0 4px 14px rgba(0,0,0,.15)", zIndex: 200,
              }}
            >
              <button
                onClick={handleLogout}
                style={{ display: "block", width: "100%", padding: "10px 14px", textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
              >
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}