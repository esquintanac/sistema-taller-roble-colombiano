// src/utils/numeros.js
// Utilidades genéricas para campos numéricos de solo ENTEROS.
// Están en su propio módulo (sin dependencias de axios ni de servicios)
// para poder probarlas con node y reutilizarlas en cualquier formulario.

/**
 * Deja únicamente los dígitos de un valor: "1.234" -> "1234", "a1-b2" -> "12".
 *
 * @param {*} valor cualquier valor recibido del input.
 * @returns {string} solo dígitos; "" si no había ninguno.
 */
export function soloDigitos(valor) {
    return String(valor ?? "").replace(/\D/g, "");
}

/**
 * Formatea dígitos con separador de miles al estilo colombiano:
 * "9999999" -> "9.999.999", "85000" -> "85.000".
 *
 * El punto es SOLO separador de miles: estos campos no manejan decimales
 * (regla de negocio del taller, igual que en los PDF), así que cualquier
 * carácter que no sea dígito se descarta antes de agrupar.
 *
 * @param {*} valor número o texto con o sin formato previo.
 * @returns {string} texto formateado ("" si no hay dígitos).
 */
export function formatearMiles(valor) {
    const digitos = soloDigitos(valor);
    if (!digitos) return "";
    return digitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}
