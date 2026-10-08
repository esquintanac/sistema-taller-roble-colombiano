// src/components/ui/StatusBadge.jsx
// Etiqueta de estado: Nuevo / Revisado (usado en el historial del
// administrador - RF8, HU-03)

export default function StatusBadge({ estado }) {
    // "Nuevo" está pendiente de revisión (ámbar) y "Revisado" ya está
    // resuelto (verde). Se compara contra "Revisado" para que cualquier
    // estado inesperado del backend caiga del lado "pendiente" en vez de
    // mostrarse en verde como si estuviera atendido.
    const texto = estado || "Nuevo";
    const clase = texto === "Revisado" ? "badge-done" : "badge-new";
    return <span className={`badge ${clase}`}>{texto}</span>;
}