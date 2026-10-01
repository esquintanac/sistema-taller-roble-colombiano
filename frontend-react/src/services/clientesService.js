// src/services/clientesService.js
// Consulta los clientes registrados en el taller.
//
// Importante (regla del backend, ver cliente_controller.py): cualquier
// usuario autenticado puede LISTAR clientes (GET), pero crear, editar o
// eliminar queda reservado al rol Administrador. Por eso el formulario
// de modelos solo permite SELECCIONAR un cliente existente.

import api from "./api";

const clientesService = {
  listar: async () => {
    const { data } = await api.get("/clientes/");
    return data;
  },

  obtener: async (idCliente) => {
    const { data } = await api.get(`/clientes/${idCliente}/`);
    return data;
  },
};

// Arma la etiqueta legible que se muestra en los <select> y en el
// resumen de validación ("Ana Pérez — CC 10203040").
export function etiquetaCliente(cliente) {
  if (!cliente) return "";
  const nombreCompleto = `${cliente.nombre} ${cliente.apellido}`.trim();
  const documento = cliente.numero_documento_identificacion;
  return documento ? `${nombreCompleto} — ${documento}` : nombreCompleto;
}

export default clientesService;
