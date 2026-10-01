// src/utils/descargas.js
// Utilidades de descarga de archivos.
//
// Se centraliza aquí porque varios módulos necesitan descargar un PDF
// binario que llega como Blob desde axios: el detalle del administrador
// (reportes de construcción y de factura) y el reporte del carpintero.
// Tener dos copias de esta función es justo el tipo de duplicación que
// después se corrige en un sitio y no en el otro.

/**
 * Dispara la descarga de un Blob sin recargar la página.
 *
 * Crea una URL temporal que apunta al Blob, la usa en un <a download>
 * invisible, y libera la URL al terminar. Sin el revokeObjectURL el
 * navegador mantiene el archivo en memoria hasta cerrar la pestaña.
 */
export function guardarBlob(blob, nombreArchivo) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

/**
 * Traduce el error de axios a un mensaje entendible para el usuario.
 * El parámetro `recurso` permite personalizar el texto según lo que se
 * estaba intentando cargar ("el diseño", "el reporte").
 */
export function mensajeDeError(error, recurso = "la información") {
  const estado = error?.response?.status;
  if (estado === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  if (estado === 403) return "No tienes permiso para consultar este diseño.";
  if (estado === 404) return `No se encontró ${recurso} solicitado.`;
  return "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.";
}

/** Formato de pesos colombianos: 85000 -> $85.000 */
export const pesos = (valor) => `$${Number(valor || 0).toLocaleString("es-CO")}`;