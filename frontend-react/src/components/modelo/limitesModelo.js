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

// Interruptor que decide si un campo aplica. Es el recíproco de
// CAMPOS_POR_TOGGLE del wizard: si el interruptor está apagado, el campo
// se oculta y su valor residual NO debe validarse (escribir "15" en la
// barra y apagarla no debe bloquear el registro con un error invisible).
export const TOGGLE_DE_CAMPO = {
  numCajones: "llevaCajones",
  alturaBarra: "llevaBarra",
  alturaZocalo: "llevaZocalo",
};

/**
 * Valida los campos numéricos indicados contra sus rangos de negocio y
 * las reglas entre campos (barra y zócalo deben caber dentro del alto del
 * mueble).
 *
 * Los campos vacíos se ignoran: los cubre la validación de obligatorios
 * del wizard, que solo exige los de los interruptores activos.
 *
 * @param {object} datos estado actual del formulario.
 * @param {string[]} campos claves a validar.
 * @returns {object} mapa {campo: mensaje} con los errores encontrados.
 */
export function validarRangos(datos, campos) {
  const errores = {};

  for (const campo of campos) {
    const toggle = TOGGLE_DE_CAMPO[campo];
    if (toggle && !datos[toggle]) continue;

    const regla = LIMITES_RANGO[campo];
    if (!regla) continue;

    const texto = String(datos[campo] ?? "").trim();
    if (!texto) continue;

    const numero = Number(texto);
    if (!Number.isFinite(numero)) {
      errores[campo] = `${regla.etiqueta} debe ser un número válido.`;
      continue;
    }
    if (numero < regla.min || numero > regla.max) {
      errores[campo] =
        `${regla.etiqueta} debe estar entre ${regla.min} y ${regla.max}` +
        `${regla.unidad ? ` ${regla.unidad}` : ""}.`;
    }
  }

  // Reglas entre campos: una barra a la altura del techo del mueble o un
  // zócalo más alto que el mueble son errores de registro, no preferencias.
  const alto = Number(datos.alto);
  if (Number.isFinite(alto) && alto > 0) {
    const barra = Number(datos.alturaBarra);
    if (
      campos.includes("alturaBarra") && datos.llevaBarra &&
      Number.isFinite(barra) && barra >= alto
    ) {
      errores.alturaBarra =
        `La altura de la barra debe ser menor que el alto del mueble (${alto} cm).`;
    }
    const zocalo = Number(datos.alturaZocalo);
    if (
      campos.includes("alturaZocalo") && datos.llevaZocalo &&
      Number.isFinite(zocalo) && zocalo >= alto
    ) {
      errores.alturaZocalo =
        `La altura del zócalo debe ser menor que el alto del mueble (${alto} cm).`;
    }
  }

  return errores;
}
