// src/hooks/useDatosExternos.js
// Hooks para los datos de las integraciones externas (Fase 7).
//
// Viven aquí y no dentro de cada pantalla porque los usan varias y el patrón
// es siempre el mismo: intentar traer el dato y, si no se puede, dejar que la
// pantalla no dibuje nada.

import { useEffect, useState } from "react";
import { obtenerClima, obtenerDivisa } from "../services/externoService";

function useDatoExterno(obtener) {
  const [dato, setDato] = useState(null);

  useEffect(() => {
    // "activo" evita actualizar el estado si el componente se desmontó
    // mientras la petición estaba en vuelo.
    let activo = true;

    // obtener() nunca rechaza: si algo falla devuelve null.
    obtener().then((valor) => {
      if (activo) setDato(valor);
    });

    return () => {
      activo = false;
    };
  }, [obtener]);

  return dato;
}

/** Clima (humedad y temperatura) de la zona del taller. */
export function useClima() {
  return useDatoExterno(obtenerClima);
}

/** Tipo de cambio COP <-> USD. */
export function useTipoCambio() {
  return useDatoExterno(obtenerDivisa);
}