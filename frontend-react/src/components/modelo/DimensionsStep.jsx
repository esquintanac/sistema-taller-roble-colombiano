// src/components/modelo/DimensionsStep.jsx
// Sub-paso 1A: tipo de modelo, alto, ancho, largo, grosor (RF2).

import FormField from "../ui/FormField";
import Button from "../ui/Button";
import ModelTypeSelector from "./ModelTypeSelector";

export default function DimensionsStep({ datos, errores, onChange, onTipoChange, onSiguiente }) {
  return (
    <div>
      <h2>Nuevo Modelo</h2>
      <h3 style={{ color: "var(--marron-osc)" }}>Dimensiones generales</h3>

      <div className="form-group">
        <label className="form-label">Tipo de modelo *</label>
        <ModelTypeSelector tipoSeleccionado={datos.tipoModelo} onSelect={onTipoChange} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <FormField label="Alto (cm)" name="alto" tipo="number" value={datos.alto} onChange={onChange} error={errores.alto} requerido />
        <FormField label="Ancho (cm)" name="ancho" tipo="number" value={datos.ancho} onChange={onChange} error={errores.ancho} requerido />
        <FormField label="Largo (cm)" name="largo" tipo="number" value={datos.largo} onChange={onChange} error={errores.largo} requerido />
      </div>

      <FormField
        label="Grosor de la melanina"
        name="grosor"
        as="select"
        value={datos.grosor}
        onChange={onChange}
        error={errores.grosor}
        requerido
        opciones={[
          { value: "9", label: "9 mm" },
          { value: "15", label: "15 mm" },
          { value: "18", label: "18 mm" },
        ]}
      />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <Button variante="primary" onClick={onSiguiente}>Siguiente →</Button>
      </div>
    </div>
  );
}