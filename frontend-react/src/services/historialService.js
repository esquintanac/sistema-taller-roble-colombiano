// src/services/historialService.js
// Conecta el módulo de Historial con el backend Django.
//
// El historial es un registro AUTOMÁTICO que se crea al guardar un
// modelo (HistorialDAO.insertar_historial_automatico), por eso aquí NO
// existe una operación de creación: solo consulta y cambio de estado.
//
// Endpoints (backend/api/routes/historial_routes.py):
//   GET /api/historial/                 -> lista (rol Administrador)
//   GET /api/historial/<id_historial>/  -> detalle (rol Administrador)
//   PUT /api/historial/<id>/revisar/    -> marcar como Revisado (RF9)

import api from "./api";

const historialService = {
  listar: async () => {
    const { data } = await api.get("/historial/");
    return data;
  },

  obtener: async (idHistorial) => {
    const { data } = await api.get(`/historial/${idHistorial}/`);
    return data;
  },

  marcarRevisado: async (idHistorial) => {
    const { data } = await api.put(`/historial/${idHistorial}/revisar/`);
    return data;
  },
};

// Convierte la fecha ISO que envía el backend ("2026-09-21T14:07:30")
// en un texto legible: "Hoy, 2:07 p. m." o "12/09/2026, 8:02 a. m.".
export function formatearFecha(iso) {
  if (!iso) return "—";
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return iso;

  const hora = fecha.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const esHoy = fecha.toDateString() === new Date().toDateString();
  return esHoy ? `Hoy, ${hora}` : `${fecha.toLocaleDateString("es-CO")}, ${hora}`;
}

// Adapta el registro crudo del backend a las claves que consumen las
// tablas del frontend (nombres en camelCase y ya formateados). Se
// centraliza aquí para que el historial y el detalle del administrador
// usen exactamente la misma conversión.
export function mapearRegistro(registro) {
  return {
    id: registro.id_historial,
    idModelo: registro.id_modelo,
    creadoPor: registro.creado_por || "—",
    tipo: registro.nombre_modelo || "—",
    medidas: registro.medidas || "—",
    cliente: registro.cliente || "—",
    fecha: formatearFecha(registro.fecha_creacion),
    estado: registro.estado_revision || "Nuevo",
    comentario: registro.comentario || "",
    accion: registro.accion || "",
  };
}

export default historialService;
