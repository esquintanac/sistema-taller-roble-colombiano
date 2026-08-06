// src/components/modelo/ModelTypeSelector.jsx
// Selector visual de tipo de modelo (RF2).

import SelectableCard from "../ui/SelectableCard";

const TIPOS = [
  { valor: "Closet", icono: "🚪" },
  { valor: "Mueble", icono: "📦" },
  { valor: "Otro", icono: "🪵" },
];

export default function ModelTypeSelector({ tipoSeleccionado, onSelect }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
      {TIPOS.map((t) => (
        <SelectableCard
          key={t.valor}
          icono={t.icono}
          nombre={t.valor}
          seleccionado={tipoSeleccionado === t.valor}
          onClick={() => onSelect(t.valor)}
        />
      ))}
    </div>
  );
}