// src/services/modelosService.js
// Conecta el flujo de registro de modelos (RF2) con los endpoints de
// Modelo del backend Django:
//   POST /api/modelos/                  -> crear modelo (rol Carpintero)
//   GET  /api/modelos/?id_carpintero=   -> listar modelos del carpintero
//   GET  /api/modelos/<id>/             -> detalle de un modelo
//   GET  /api/modelos/<id>/diseno/      -> piezas a cortar + melanina
//   GET  /api/modelos/<id>/materiales/  -> materiales asociados (modelo_material)
//   POST /api/modelos/<id>/materiales/melanina/ -> asocia la melanina calculada
//                                              por el backend (rol Administrador)
//   GET  /api/modelos/<id>/pdf/         -> reporte PDF descargable
//   GET  /api/modelos/<id>/pdf/materiales/ -> reporte PDF de materiales y costos

import api from "./api";

// Traduce las claves internas del formulario (ModelWizard) a las claves
// que espera el backend. Se centraliza aquí para que tanto el wizard
// como la pantalla de validación usen exactamente la misma conversión
// y no se dupliquen reglas en dos sitios.
export function construirPayload(datos, usuario) {
  const aNumero = (valor, respaldo = 0) => {
    const n = Number(valor);
    return Number.isFinite(n) ? n : respaldo;
  };

  return {
    id_carpintero: usuario?.id,
    id_cliente: aNumero(datos.idCliente),
    nombre_modelo: datos.tipoModelo || "Sin nombre",
    descripcion: datos.observaciones || "",
    alto: aNumero(datos.alto),
    ancho: aNumero(datos.ancho),
    largo: aNumero(datos.largo),
    grosor: aNumero(datos.grosor, 18),
    // Las puertas/cajones/barra solo cuentan si el usuario los activó
    puertas: datos.llevaPuertas ? aNumero(datos.numPuertas) : 0,
    compartimientos: aNumero(datos.compartimentos),
    entrepanos_compartimientos: aNumero(datos.entrepanos),
    cajones: datos.llevaCajones ? aNumero(datos.numCajones) : 0,
    color: datos.color || "",
    altura_barra_colgadora: datos.llevaBarra ? aNumero(datos.alturaBarra) : 0,
    tipo_puerta: datos.llevaPuertas ? datos.tipoPuerta || "" : "",
    altura_zocalo: aNumero(datos.alturaZocalo),
    material_fondo: datos.materialFondo || "",
  };
}

const modelosService = {
  // POST /api/modelos/ -> devuelve el modelo creado (incluye id_modelo)
  crear: async (payload) => {
    const { data } = await api.post("/modelos/", payload);
    return data;
  },

  // GET /api/modelos/ (el backend filtra por id_carpintero si se envía)
  listar: async (idCarpintero) => {
    const { data } = await api.get("/modelos/", {
      params: idCarpintero ? { id_carpintero: idCarpintero } : {},
    });
    return data;
  },

  obtener: async (idModelo) => {
    const { data } = await api.get(`/modelos/${idModelo}/`);
    return data;
  },

  // Materiales REALMENTE asociados al modelo (tabla modelo_material).
  // Cada uno trae cantidad, unidad_medida y costo_utilizado, que quedó
  // congelado al momento de asociarlo (no cambia si el precio del
  // material sube después).
  materialesDelModelo: async (idModelo) => {
    const { data } = await api.get(`/modelos/${idModelo}/materiales/`);
    return data;
  },

  // POST /api/modelos/<id>/materiales/melanina/
  // Atajo del backend: la CalculadoraService calcula cuánta melanina
  // necesita el modelo (área de piezas / área de lámina x 1.15 de
  // desperdicio) y la asocia con el material indicado, congelando el
  // costo_unitario en modelo_material. Así el costo deja de ser un
  // estimado del frontend y pasa a ser un dato real del modelo.
  // Requiere rol Administrador.
  asociarMelanina: async (idModelo, idMaterialMelanina) => {
    const { data } = await api.post(`/modelos/${idModelo}/materiales/melanina/`, {
      id_material_melanina: idMaterialMelanina,
    });
    return data;
  },

  // Devuelve { piezas: [...], melanina: {...} } para la pantalla de Diseño 3D
  calcularDiseno: async (idModelo) => {
    const { data } = await api.get(`/modelos/${idModelo}/diseno/`);
    return data;
  },

  // Se pide como blob porque la respuesta es un archivo PDF binario
  descargarPdf: async (idModelo) => {
    const { data } = await api.get(`/modelos/${idModelo}/pdf/`, {
      responseType: "blob",
    });
    return data;
  },

  // Reporte de MATERIALES Y COSTOS. Es un documento distinto del
  // anterior: aquel lista las piezas a cortar, este el desglose de
  // materiales con su costo real (congelado en modelo_material) y el
  // total.
  descargarPdfMateriales: async (idModelo) => {
    const { data } = await api.get(`/modelos/${idModelo}/pdf/materiales/`, {
      responseType: "blob",
    });
    return data;
  },
};

export default modelosService;
