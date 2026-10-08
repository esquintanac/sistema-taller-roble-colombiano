// src/components/layout/AvisoSesion.jsx
// Ventana emergente que avisa que la sesión está por cerrarse por
// inactividad, y da la opción de extenderla (RNF de cierre de sesión).
//
// Aparece unos minutos antes del cierre, no durante toda la espera: si el
// usuario está trabajando, el temporizador se reinicia con cada interacción
// y este aviso nunca llega a mostrarse. Solo lo ve quien de verdad se alejó
// del sistema, que es quien necesita la oportunidad de no perder su trabajo.
//
// Una vez en pantalla el aviso es BLOQUEANTE a propósito: ni mover el mouse ni
// teclear lo quitan. La cuenta regresiva sigue corriendo hasta que el usuario
// pulse "Extender sesión" o hasta que la sesión se cierre. Si el aviso se
// cerrara solo con cualquier movimiento, bastaría mover el mouse sin querer y
// la ventana no serviría de nada.
//
// La cuenta regresiva vive AQUÍ, no en el AuthContext, a propósito: el
// proveedor envuelve toda la aplicación, así que un contador por segundo
// allá re-renderizaría el sistema entero cada segundo. Encerrado en este
// componente, solo se redibuja el propio aviso.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import Button from "../ui/Button";

export default function AvisoSesion() {
  const { avisoSesion, extenderSesion, cerrarSesion } = useAuth();
  const navigate = useNavigate();
  const botonExtender = useRef(null);

  // "tick" fuerza el re-render cada segundo para refrescar el contador.
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!avisoSesion) return undefined;
    const intervalo = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(intervalo);
  }, [avisoSesion]);

  // Al abrirse, el foco va al botón de extender: quien navega con teclado
  // llega directo a la acción recomendada sin tener que tabular.
  useEffect(() => {
    if (avisoSesion) botonExtender.current?.focus();
  }, [avisoSesion]);

  // Sin aviso activo no se dibuja nada.
  if (!avisoSesion) return null;

  const restante = Math.max(0, Math.ceil((avisoSesion.expiraEn - Date.now()) / 1000));
  const minutos = Math.floor(restante / 60);
  const segundos = String(restante % 60).padStart(2, "0");

  function manejarCerrarSesion() {
    cerrarSesion();
    navigate("/login", { replace: true });
  }

  return (
    // El overlay cubre la pantalla completa y oscurece el resto: es un aviso
    // que requiere una decisión, no una notificación que se pueda ignorar.
    // Tampoco se cierra al pulsar fuera ni con Escape, justamente para que la
    // elección sea explícita.
    <div className="modal-overlay">
      <div
        className="modal-aviso"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="aviso-sesion-titulo"
        aria-describedby="aviso-sesion-texto"
      >
        <div className="modal-aviso-icono" aria-hidden="true">
          ⏳
        </div>

        <h2 id="aviso-sesion-titulo" className="modal-aviso-titulo">
          Tu sesión está por cerrarse
        </h2>

        <p id="aviso-sesion-texto" className="modal-aviso-texto">
          Por seguridad, cerramos la sesión tras 30 minutos sin actividad.
          ¿Quieres seguir conectado?
        </p>

        <p className="modal-aviso-contador" aria-live="polite">
          Se cerrará en{" "}
          <strong>
            {minutos}:{segundos}
          </strong>
        </p>

        <div className="modal-aviso-acciones">
          <Button
            ref={botonExtender}
            variante="primary"
            tamano="lg"
            fullWidth
            onClick={extenderSesion}
          >
            Extender sesión
          </Button>
          <Button variante="secondary" fullWidth onClick={manejarCerrarSesion}>
            Cerrar sesión ahora
          </Button>
        </div>
      </div>
    </div>
  );
}