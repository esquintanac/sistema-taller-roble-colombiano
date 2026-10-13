// src/config/sesion.js
// Constantes del cierre de sesión por inactividad (RNF). Viven en un módulo
// propio —y no dentro de AuthContext— para que puedan importarlas también
// AvisoSesion, SessionExpiredPage y los tutoriales: así el número que ve el
// usuario en los textos NUNCA se desincroniza del valor real del temporizador.
//
// Plazo de inactividad antes de cerrar la sesión. Se puede sobrescribir con
// VITE_INACTIVIDAD_MS (en milisegundos, en un .env.local) para probar el
// flujo completo sin esperar el plazo real; reiniciar Vite al cambiarlo.
export const TIEMPO_INACTIVIDAD_MS =
  Number(import.meta.env.VITE_INACTIVIDAD_MS) || 15 * 60 * 1000;

// Minutos enteros del plazo, para mostrar en los textos ("15 minutos").
// El Math.max(1, ...) evita decir "0 minutos" si alguien prueba con un
// valor diminuto como VITE_INACTIVIDAD_MS=20000.
export const MINUTOS_INACTIVIDAD = Math.max(
  1,
  Math.round(TIEMPO_INACTIVIDAD_MS / 60000),
);

// Cuánto antes del cierre se avisa al usuario: EXACTAMENTE 5 minutos, como
// exige el requisito ("el aviso aparece 5 minutos antes de cerrar la sesión").
// La excepción es cuando el plazo total es más corto que el propio aviso
// (pruebas con VITE_INACTIVIDAD_MS diminutos): ahí se usa el 20 % del plazo
// para que el aviso siga apareciendo y el flujo completo sea visible sin
// esperar.
export const TIEMPO_AVISO_MS =
  TIEMPO_INACTIVIDAD_MS > 5 * 60 * 1000
    ? 5 * 60 * 1000
    : TIEMPO_INACTIVIDAD_MS * 0.2;
