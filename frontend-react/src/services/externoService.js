// src/services/externoService.js
// Conecta con las integraciones externas que expone el backend (Fase 7):
// el clima de la zona del taller y el tipo de cambio COP <-> USD.
//
// Estas llamadas son INFORMACIÓN DE APOYO: si fallan, la pantalla debe seguir
// funcionando igual. Por eso, en vez de propagar el error, el servicio
// resuelve null y quien lo use simplemente no dibuja nada.
//
// Las respuestas se memorizan en el módulo: dos componentes que las pidan a
// la vez comparten UNA sola petición en lugar de lanzar dos.

import api from "./api";

let promesaClima = null;
let promesaDivisa = null;

/** Clima actual del taller, o null si no se pudo obtener. */
export function obtenerClima() {
  if (!promesaClima) {
    promesaClima = api
      .get("/externo/clima/")
      .then(({ data }) => (data?.exito ? data : null))
      .catch(() => {
        // Se olvida el intento fallido para que la próxima pantalla pueda
        // volver a probar, en vez de arrastrar el fallo toda la sesión.
        promesaClima = null;
        return null;
      });
  }
  return promesaClima;
}

/** Tipo de cambio COP <-> USD, o null si no se pudo obtener. */
export function obtenerDivisa() {
  if (!promesaDivisa) {
    promesaDivisa = api
      .get("/externo/divisa/")
      .then(({ data }) => (data?.exito ? data : null))
      .catch(() => {
        promesaDivisa = null;
        return null;
      });
  }
  return promesaDivisa;
}