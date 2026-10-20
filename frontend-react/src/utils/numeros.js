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

/**
 * Limita un valor numérico en vivo: deja únicamente dígitos y como máximo
 * UN punto decimal, cortando los dígitos enteros y decimales según los
 * topes indicados. Pensado para las medidas del asistente de modelos
 * (ej. "300.5" cm → 3 enteros + 1 decimal): un decimal en centímetros es
 * 1 milímetro, que es lo que realmente se corta en el taller.
 *
 * @param {*} valor valor crudo recibido del input.
 * @param {number} maxEnteros cantidad máxima de dígitos antes del punto.
 * @param {number} maxDecimales cantidad máxima de dígitos después del punto.
 * @returns {string} valor filtrado, listo para guardar en el estado.
 */
export function limitarDecimal(valor, maxEnteros, maxDecimales) {
    const texto = String(valor ?? "").replace(/[^\d.]/g, "");
    const posicionPunto = texto.indexOf(".");
    if (maxDecimales < 1 || posicionPunto === -1) {
        return texto.replace(/\./g, "").slice(0, maxEnteros);
    }
    const enteros = texto.slice(0, posicionPunto).slice(0, maxEnteros);
    const decimales = texto.slice(posicionPunto + 1).replace(/\./g, "").slice(0, maxDecimales);
    // Se conserva el punto aunque aún no haya decimales ("300.") para que
    // el usuario pueda seguir escribiendo la parte decimal.
    return texto.length > posicionPunto + 1 ? `${enteros}.${decimales}` : `${enteros}.`;
}
