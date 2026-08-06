// src/components/auth/RoleSelector.jsx
// Selector de rol usando SelectableCard, dentro del registro (RF1).

import SelectableCard from "../ui/SelectableCard";

const ROLES = [
  { valor: "Carpintero", icono: "🔨" },
  { valor: "Administrador", icono: "📊" },
];

export default function RoleSelector({ rolSeleccionado, onSelect }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {ROLES.map((r) => (
        <SelectableCard
          key={r.valor}
          icono={r.icono}
          nombre={r.valor}
          seleccionado={rolSeleccionado === r.valor}
          onClick={() => onSelect(r.valor)}
        />
      ))}
    </div>
  );
}