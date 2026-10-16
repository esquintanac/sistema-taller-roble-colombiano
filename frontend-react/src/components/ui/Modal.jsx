// src/components/ui/Modal.jsx
// Ventana emergente reutilizable para comunicar el resultado de una
// operacion (exito o error) y para confirmar acciones destructivas.
//
// Sustituye a la etiqueta de mensaje que vivia arriba de los formularios
// de materiales y clientes (indicacion del instructor: el resultado de
// guardarse debe verse como ventana emergente) y al window.confirm() del
// navegador, que se veia como el aviso generico de cualquier pagina.
// Reutiliza las mismas clases del aviso de sesion (modal-overlay /
// modal-aviso) para que todos los modales del sistema se vean iguales.
//
// El foco va al boton principal al abrirse; Escape cierra los avisos y
// cancela las confirmaciones (nunca confirma); el modal de confirmacion
// no se cierra al pulsar fuera: eliminar tiene que ser una decision
// explicita.

import { useEffect, useRef } from "react";
import Button from "./Button";

const ICONOS = { success: "✓", error: "✕", confirm: "⚠" };

const TITULOS = {
  success: "Operación exitosa",
  error: "No se pudo completar la operación",
  confirm: "Confirma la acción",
};

export default function Modal({
  tipo = "success",
  titulo,
  mensaje,
  textoAceptar = "Aceptar",
  textoConfirmar = "Eliminar",
  onAceptar,
  onConfirmar,
  onCancelar,
}) {
  const botonPrincipal = useRef(null);
  const esConfirmacion = tipo === "confirm";

  // Al abrirse, el foco va al boton principal: con teclado se responde de
  // inmediato sin tabular por la ventana (mismo criterio que AvisoSesion).
  useEffect(() => {
    botonPrincipal.current?.focus();
  }, []);

  // Escape cierra los avisos y cancela las confirmaciones. Nunca confirma:
  // la tecla de salida rapida no debe borrar nada.
  useEffect(() => {
    function manejarEscape(evento) {
      if (evento.key !== "Escape") return;
      if (esConfirmacion) onCancelar?.();
      else onAceptar?.();
    }
    window.addEventListener("keydown", manejarEscape);
    return () => window.removeEventListener("keydown", manejarEscape);
  }, [esConfirmacion, onAceptar, onCancelar]);

  return (
    // En los avisos (exito/error) pulsar fuera tambien los cierra; en las
    // confirmaciones el fondo no hace nada: la decision solo se toma con
    // los botones.
    <div
      className="modal-overlay"
      onClick={esConfirmacion ? undefined : onAceptar}
    >
      <div
        className="modal-aviso"
        role={esConfirmacion ? "alertdialog" : "dialog"}
        aria-modal="true"
        aria-label={titulo || TITULOS[tipo]}
        // El clic dentro de la caja no debe burbujear al overlay.
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`modal-aviso-icono modal-icono-${tipo}`} aria-hidden="true">
          {ICONOS[tipo]}
        </div>

        <h2 className="modal-aviso-titulo">{titulo || TITULOS[tipo]}</h2>

        <p className="modal-aviso-texto">{mensaje}</p>

        <div className="modal-aviso-acciones">
          {esConfirmacion ? (
            <>
              {/* Cancelar va primero y recibe el foco: si se pulsa Enter
                  sin querer se cancela, nunca se borra. */}
              <Button ref={botonPrincipal} variante="secondary" fullWidth onClick={onCancelar}>
                Cancelar
              </Button>
              <Button variante="danger" fullWidth onClick={onConfirmar}>
                {textoConfirmar}
              </Button>
            </>
          ) : (
            <Button
              ref={botonPrincipal}
              variante={tipo === "error" ? "danger" : "primary"}
              fullWidth
              onClick={onAceptar}
            >
              {textoAceptar}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}