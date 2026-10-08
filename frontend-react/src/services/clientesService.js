// src/services/clientesService.js
// Gestión de clientes del taller.
//
// Regla del backend (ver cliente_controller.py): cualquier usuario
// autenticado puede LISTAR clientes (GET), porque el carpintero los necesita
// para asociarlos a un modelo; crear, editar y eliminar queda reservado al
// rol Administrador.

import api from "./api";

// Forma exacta que espera la API. Se exporta para que el formulario y la
// tabla partan siempre de los mismos campos, incluido al editar.
export const CLIENTE_VACIO = {
  nombre: "",
  apellido: "",
  tipo_documento_identificacion: "",
  numero_documento_identificacion: "",
  telefono_cliente: "",
  correo_cliente: "",
  direccion_cliente: "",
};

// Tipos de documento habituales en Colombia. El campo es varchar(20) en la
// base, así que se manda el código corto que es el que se muestra en los
// documentos.
export const TIPOS_DOCUMENTO = [
  { value: "CC", label: "Cédula de ciudadanía (CC)" },
  { value: "CE", label: "Cédula de extranjero (CE)" },
  { value: "TI", label: "Tarjeta de identidad (TI)" },
  { value: "NIT", label: "NIT" },
  { value: "PAS", label: "Pasaporte (PAS)" },
];

const clientesService = {
  listar: async () => {
    const { data } = await api.get("/clientes/");
    return data;
  },

  obtener: async (idCliente) => {
    const { data } = await api.get(`/clientes/${idCliente}/`);
    return data;
  },

  // Requiere rol Administrador. En caso de validación devuelve 400 con
  // {exito:false, errores:[...]}, que el formulario muestra tal cual.
  crear: async (cliente) => {
    const { data } = await api.post("/clientes/", cliente);
    return data;
  },

  actualizar: async (idCliente, cliente) => {
    const { data } = await api.put(`/clientes/${idCliente}/`, cliente);
    return data;
  },

  eliminar: async (idCliente) => {
    const { data } = await api.delete(`/clientes/${idCliente}/`);
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
