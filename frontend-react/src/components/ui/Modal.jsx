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
// El foco va al boton principal al abrirse y se devuelve al elemento que
// abrio la ventana al cerrarse; Escape cierra los avisos y cancela las
// confirmaciones (nunca confirma); el modal de confirmacion no se cierra
// al pulsar fuera: eliminar tiene que ser una decision explicita.
//
// Con bloquearCierre tampoco cierran Escape ni el clic fuera: sirve para
// los errores de pantalla completa, donde el fondo queda vacio y solo se
// debe salir con los botones (Aceptar / Cancelar).

import { useEffect, useRef } from "react";
import Button from "./Button";

const ICONOS = { success: "✓", error: "✕", confirm: "⚠", info: "✎" };

const TITULOS = {
  success: "Operación exitosa",
  error: "No se pudo completar la operación",
  confirm: "Confirma la acción",
  info: "Editar registro",
};

export default function Modal({
  tipo = "success",
  titulo,
  mensaje,
  children,
  textoAceptar = "Aceptar",
  textoCancelar = "Cancelar",
  textoConfirmar = "Eliminar",
  deshabilitado = false,
  bloquearCierre = false,
  onAceptar,
  onConfirmar,
  onCancelar,
}) {
  const botonPrincipal = useRef(null);
  const esConfirmacion = tipo === "confirm";
  // Escape y el clic en el fondo cierran el aviso o cancelan la acción;
  // nunca ejecutan la acción principal por su cuenta. Con bloquearCierre
  // tampoco cierran: en un error de pantalla completa el fondo está vacío
  // y solo se debe salir con los botones.
  const cierraConFondo = !esConfirmacion && !bloquearCierre;
  const cerrar = onCancelar ?? onAceptar;

  // Al abrirse, el foco va al boton principal: con teclado se responde de
  // inmediato sin tabular por la ventana (mismo criterio que AvisoSesion).
  // Al cerrarse se devuelve al elemento que abrió la ventana, para que el
  // teclado no pierda su sitio (recomendación ARIA para diálogos).
  useEffect(() => {
    const elementoPrevio = document.activeElement;
    botonPrincipal.current?.focus();
    return () => {
      if (elementoPrevio && typeof elementoPrevio.focus === "function") {
        elementoPrevio.focus();
      }
    };
  }, []);

  useEffect(() => {
    function manejarEscape(evento) {
      if (evento.key !== "Escape") return;
      if (bloquearCierre) return;
      if (esConfirmacion) onCancelar?.();
      else cerrar?.();
    }
    window.addEventListener("keydown", manejarEscape);
    return () => window.removeEventListener("keydown", manejarEscape);
  }, [bloquearCierre, esConfirmacion, onCancelar, cerrar]);

  return (
    // En los avisos (exito/error) y en los formularios (info) pulsar fuera
    // cierra o cancela; en las confirmaciones y con bloquearCierre el fondo
    // no hace nada: la decisión solo se toma con los botones.
    <div
      className="modal-overlay"
      onClick={cierraConFondo ? cerrar : undefined}
    >
      <div
        className="modal-aviso"
        // alertdialog para lo que exige respuesta (avisos de resultado y
        // confirmaciones); dialog para los formularios embebidos (info).
        role={tipo === "info" ? "dialog" : "alertdialog"}
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

        {children}

        <div className="modal-aviso-acciones">
          {esConfirmacion ? (
            <>
              {/* Cancelar va primero y recibe el foco: si se pulsa Enter
                  sin querer se cancela, nunca se borra. */}
              <Button ref={botonPrincipal} variante="secondary" fullWidth onClick={onCancelar}>
                {textoCancelar}
              </Button>
              <Button variante="danger" fullWidth onClick={onConfirmar}>
                {textoConfirmar}
              </Button>
            </>
          ) : (
            <>
              {onCancelar && (
                <Button variante="secondary" fullWidth onClick={onCancelar}>
                  {textoCancelar}
                </Button>
              )}
              <Button
                ref={botonPrincipal}
                variante={tipo === "error" ? "danger" : "primary"}
                fullWidth
                onClick={onAceptar}
                disabled={deshabilitado}
              >
                {textoAceptar}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}