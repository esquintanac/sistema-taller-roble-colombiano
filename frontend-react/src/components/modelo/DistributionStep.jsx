// src/components/modelo/DistributionStep.jsx
// Sub-paso 1B: compartimentos, entrepaños, cajones, barra (RF2).

import FormField from "../ui/FormField";
import ToggleSwitch from "../ui/ToggleSwitch";
import Button from "../ui/Button";

export default function DistributionStep({ datos, errores, onChange, onToggle, onSiguiente, onAtras }) {
  return (
    <div>
      <h2>Nuevo Modelo</h2>
      <h3 style={{ color: "var(--marron-osc)" }}>Distribución interna</h3>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <FormField
          label="Compartimentos verticales (1-6)" name="compartimentos" as="select"
          value={datos.compartimentos} onChange={onChange} error={errores.compartimentos} requerido
          opciones={[1, 2, 3, 4, 5, 6].map((n) => ({ value: n, label: n }))}
        />
        <FormField
          label="Entrepaños por compartimento (0-8)" name="entrepanos" as="select"
          value={datos.entrepanos} onChange={onChange} error={errores.entrepanos} requerido
          opciones={[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({ value: n, label: n }))}
        />
      </div>

      <ToggleSwitch checked={datos.llevaCajones} onChange={() => onToggle("llevaCajones")} label="¿Lleva cajones?" />
      {datos.llevaCajones && (
        <FormField label="¿Cuántos cajones?" name="numCajones" tipo="number" value={datos.numCajones} onChange={onChange} error={errores.numCajones} requerido />
      )}

      <ToggleSwitch checked={datos.llevaBarra} onChange={() => onToggle("llevaBarra")} label="¿Lleva barra colgadora?" />
      {datos.llevaBarra && (
        <FormField label="Altura de la barra (cm)" name="alturaBarra" tipo="number" value={datos.alturaBarra} onChange={onChange} error={errores.alturaBarra} requerido />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Button variante="secondary" onClick={onAtras}>← Atrás</Button>
        <Button variante="primary" onClick={onSiguiente}>Siguiente →</Button>
      </div>
    </div>
  );
}