// src/components/ui/StatusBadge.jsx
// Etiqueta de estado: Nuevo / Revisado (usado en el historial del
// administrador - RF8, HU-03)

export default function StatusBadge({ estado }) {
    const clase = estado === "Nuevo" ? "badge-new" : "badge-done";
    return <span className={'badge ${clase}'}>{estado}</span>;
}