// src/components/layout/Header.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Header() {
  const { usuario, cerrarSesion } = useAuth();
  // Menú desplegable del avatar (escritorio) y panel de navegación (móvil).
  // Son dos estados distintos porque nunca coexisten: en pantallas estrechas
  // el bloque de escritorio está oculto por CSS.
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [navAbierto, setNavAbierto] = useState(false);
  // Sirve para saber si el clic cayó dentro de la barra o fuera de ella.
  const contenedor = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const paginasConBoton = [
    "/formulario-datos",
    "/validar-datos",
    "/diseno-3d",
    "/reporte",
    "/historial",
    "/materiales",
  ];

  const mostrarBoton = paginasConBoton.includes(location.pathname) || location.pathname.startsWith("/detalle-admin/");

  // No mostrar el acceso al panel cuando ya estamos en el panel.
  const mostrarInicio = location.pathname !== "/inicio";

  // Cierra los menús al pulsar fuera de la barra o al presionar Escape.
  // Antes el menú del avatar se quedaba abierto encima del resto de la página.
  useEffect(() => {
    if (!menuAbierto && !navAbierto) return undefined;

    function alPulsarFuera(evento) {
      if (contenedor.current && !contenedor.current.contains(evento.target)) {
        setMenuAbierto(false);
        setNavAbierto(false);
      }
    }

    function alPulsarEscape(evento) {
      if (evento.key !== "Escape") return;
      setMenuAbierto(false);
      setNavAbierto(false);
    }

    document.addEventListener("mousedown", alPulsarFuera);
    document.addEventListener("keydown", alPulsarEscape);
    return () => {
      document.removeEventListener("mousedown", alPulsarFuera);
      document.removeEventListener("keydown", alPulsarEscape);
    };
  }, [menuAbierto, navAbierto]);

  // Al cambiar de página los menús se cierran solos; si no, quedarían
  // flotando sobre la pantalla nueva.
  useEffect(() => {
    setMenuAbierto(false);
    setNavAbierto(false);
  }, [location.pathname]);

  // A partir de aquí ya no se usan hooks: el retorno temprano va después de
  // todos ellos, porque un return antes de terminar los hooks rompería el
  // orden de ejecución en cuanto el usuario entrara o saliera de sesión.
  if (!usuario) return null;

  // Fallback defensivo: si el usuario guardado no trae nombre (por ejemplo
  // una sesión antigua en localStorage), se usa su nombre de usuario y, si
  // tampoco existe, un comodín. Antes un nombre ausente rompía el Header
  // con el .split() de undefined.
  const nombreMostrado = usuario.nombre || usuario.usuario || "Usuario";
  const iniciales = nombreMostrado
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const claseRol = usuario.rol === "Administrador" ? "badge-admin" : "badge-carpintero";

  function handleLogout() {
    setMenuAbierto(false);
    setNavAbierto(false);
    cerrarSesion();
    navigate("/login");
  }

  // Todo salto de página pasa por aquí, de modo que los menús siempre se
  // cierran al navegar, sin repetir el setState en cada botón.
  function irA(ruta) {
    setMenuAbierto(false);
    setNavAbierto(false);
    navigate(ruta);
  }

  function abrirAvatar(evento) {
    // El avatar es un div con role="button", así que también hay que atender
    // Enter y Espacio para no dejar fuera a quien navega con teclado.
    if (evento.type === "keydown" && evento.key !== "Enter" && evento.key !== " ") return;
    setMenuAbierto((abierto) => !abierto);
  }

  return (
    <header className="site-header">
      <div className="container site-header-inner" ref={contenedor}>
        <div className="site-logo">
          Taller del <span>Roble</span> Colombiano
        </div>

        {/* Escritorio: identidad y accesos directos */}
        <div className="nav-escritorio">
          <div
            className="nav-avatar"
            onClick={abrirAvatar}
            onKeyDown={abrirAvatar}
            role="button"
            tabIndex={0}
            aria-haspopup="menu"
            aria-expanded={menuAbierto}
            aria-label="Menú de usuario"
          >
            {iniciales}
          </div>
          <span className="nav-nombre">{nombreMostrado}</span>
          <span className={`badge-rol ${claseRol}`}>{usuario.rol}</span>

          {mostrarInicio && (
            <button type="button" className="btn btn-sm btn-header" onClick={() => irA("/inicio")}>
              Inicio
            </button>
          )}

          {mostrarBoton && (
            <button
              type="button"
              className="btn btn-sm btn-header"
              onClick={() => irA(usuario.rol === "Administrador" ? "/tutorial-admin" : "/tutorial")}
            >
              Repetir tutorial
            </button>
          )}

          {menuAbierto && (
            <div className="nav-menu" role="menu">
              {/* Solo el nombre, como contexto de la acción. El rol ya se
                  muestra en la barra del header, así que repetirlo aquí era
                  redundante; además, las clases de badge del header están
                  calculadas para fondo oscuro y sobre el fondo blanco de este
                  menú el texto quedaba ilegible. */}
              <div className="nav-menu-cabecera">
                <div className="nav-menu-nombre">{nombreMostrado}</div>
              </div>
              <button type="button" className="nav-menu-item nav-menu-item-salir" role="menuitem" onClick={handleLogout}>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>

        {/* Móvil: botón que despliega el panel de navegación */}
        <button
          type="button"
          className="nav-toggle"
          onClick={() => setNavAbierto((abierto) => !abierto)}
          aria-expanded={navAbierto}
          aria-controls="nav-movil"
          aria-label={navAbierto ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
        >
          <span aria-hidden="true">{navAbierto ? "✕" : "☰"}</span>
        </button>

        {navAbierto && (
          <div className="nav-panel" id="nav-movil">
            <div className="nav-panel-usuario">
              <div className="nav-avatar nav-avatar-lg">{iniciales}</div>
              <div>
                <div className="nav-panel-nombre">{nombreMostrado}</div>
                <span className={`badge-rol ${claseRol}`}>{usuario.rol}</span>
              </div>
            </div>

            {mostrarInicio && (
              <button type="button" className="nav-panel-item" onClick={() => irA("/inicio")}>
                Inicio
              </button>
            )}

            {mostrarBoton && (
              <button
                type="button"
                className="nav-panel-item"
                onClick={() => irA(usuario.rol === "Administrador" ? "/tutorial-admin" : "/tutorial")}
              >
                Repetir tutorial
              </button>
            )}

            <button type="button" className="nav-panel-item nav-panel-item-salir" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}