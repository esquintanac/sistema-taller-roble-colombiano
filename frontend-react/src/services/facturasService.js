// src/services/facturasService.js
// Conecta el módulo de Facturación con el backend Django.
//
// La factura es el registro MÁS AUTORITATIVO del costo de un modelo: se
// genera a partir de los materiales asociados (modelo_material) y guarda
// el Valor_total ya sumado y congelado, además del estado y el método de
// pago. Por eso el detalle del administrador la prefiere por encima de
// recalcular desde los materiales.
//
// Endpoints (backend/api/routes/factura_routes.py):
//   GET /api/facturas/                  -> lista (rol Administrador)
//   GET /api/facturas/<id_factura>/     -> encabezado + líneas de detalle
//   GET /api/facturas/<id_factura>/pdf/ -> reporte PDF de la factura

import api from "./api";

const facturasService = {
  listar: async () => {
    const { data } = await api.get("/facturas/");
    return data;
  },

  // Trae el encabezado MÁS el arreglo `detalle` con una línea por material.
  obtener: async (idFactura) => {
    const { data } = await api.get(`/facturas/${idFactura}/`);
    return data;
  },

  // Se pide como blob porque la respuesta es un PDF binario.
  descargarPdf: async (idFactura) => {
    const { data } = await api.get(`/facturas/${idFactura}/pdf/`, {
      responseType: "blob",
    });
    return data;
  },
};

// El backend no expone un "factura por modelo", pero la lista ya incluye
// id_modelo. Se toma la más reciente (la consulta viene ORDER BY
// id_factura DESC) y se devuelve el total de coincidencias, porque un
// mismo modelo puede facturarse más de una vez.
export function facturaDeModelo(facturas, idModelo) {
  const coincidencias = facturas.filter(
    (factura) => Number(factura.id_modelo) === Number(idModelo)
  );
  return { factura: coincidencias[0] || null, total: coincidencias.length };
}

export default facturasService;
