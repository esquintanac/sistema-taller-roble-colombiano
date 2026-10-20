// src/components/modelo/limitesModelo.js
// Reglas de límite del asistente de nuevo modelo (RF2), centralizadas en un
// solo módulo para que el orquestador y los pasos del wizard no las
// dupliquen (misma filosofía que "regla única" en modelosService). Los
// valores están alineados con la realidad del taller: una lámina mide
// 244x122 cm, un clóset no llega a 10 m de alto y 1 cm con un decimal son
// 1 mm, la precisión real de corte.

// Rangos que se validan antes de avanzar de paso y al registrar. Los
// mínimos no son solo cosméticos: con un ancho menor que 2×grosor, los
// entrepaños del cálculo quedan con medidas negativas.
export const LIMITES_RANGO = {
  alto: { min: 10, max: 300, etiqueta: "El alto", unidad: "cm" },
  ancho: { min: 10, max: 500, etiqueta: "El ancho", unidad: "cm" },
  largo: { min: 10, max: 120, etiqueta: "El largo", unidad: "cm" },
  numCajones: { min: 1, max: 10, etiqueta: "El número de cajones", unidad: "" },
  alturaBarra: { min: 30, max: 300, etiqueta: "La altura de la barra", unidad: "cm" },
  alturaZocalo: { min: 1, max: 30, etiqueta: "La altura del zócalo", unidad: "cm" },
};

// Máximo de caracteres de observaciones: coincide con la columna
// Descripcion VARCHAR(500) de la tabla modelo; un texto más largo haría
// fallar el INSERT en MySQL.
export const MAX_OBSERVACIONES = 500;

// Altura aproximada que ocupa cada cajón (fondo + guía). Solo alimenta la
// advertencia informativa del paso de Distribución: nunca bloquea el
// registro, avisa al carpintero para que ajuste números o medidas.
export const ALTO_POR_CAJON = 15;
