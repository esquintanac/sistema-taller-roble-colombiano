// src/components/ui/MenuAcciones.jsx
// Menú desplegable de acciones por fila de tabla. Sustituye a la fila de
// botones de la pantalla de facturas, donde cinco botones seguidos
// (detalle, PDF, editar, pagada, eliminar) ensuciaban la tabla: ahora hay
// un solo botón por fila y las opciones viven dentro del menú.
//
// Se cierra al pulsar fuera, con Escape (devolviendo el foco al botón,
// para no perderse al navegar con teclado) o al elegir una opción.
// Rol menu/menuitem para lectores de pantalla. Cada opción recibe
// { etiqueta, accion, peligro? }; peligro pinta el ítem en rojo.

import { useEffect, useRef, useState } from "react";
import Button from "./Button";

export default function MenuAcciones({ etiqueta = "Acciones", items = [] }) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const botonRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    function manejarClicFuera(evento) {
      if (!contenedorRef.current?.contains(evento.target)) setAbierto(false);
    }
    function manejarEscape(evento) {
      if (evento.key === "Escape") {
        setAbierto(false);
        botonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", manejarClicFuera);
    document.addEventListener("keydown", manejarEscape);
    return () => {
      document.removeEventListener("mousedown", manejarClicFuera);
      document.removeEventListener("keydown", manejarEscape);
    };
  }, [abierto]);

  function ejecutar(accion) {
    setAbierto(false);
    accion();
  }

  return (
    <div className="menu-acciones" ref={contenedorRef}>
      <Button
        ref={botonRef}
        tamano="sm"
        variante="secondary"
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((v) => !v)}
      >
        {etiqueta} ▾
      </Button>

      {abierto && (
        <div className="menu-acciones-lista" role="menu">
          {items.map((item, indice) => (
            <button
              key={`${item.etiqueta}-${indice}`}
              type="button"
              role="menuitem"
              className={`menu-acciones-item ${item.peligro ? "menu-acciones-peligro" : ""}`}
              onClick={() => ejecutar(item.accion)}
            >
              {item.etiqueta}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}