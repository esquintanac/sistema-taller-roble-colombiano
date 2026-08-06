// src/components/modelo/FinishesStep.jsx
// Sub-paso 1C: puertas, zócalo, fondo, cliente, observaciones (RF2).

import FormField from "../ui/FormField";
import ToggleSwitch from "../ui/ToggleSwitch";
import Button from "../ui/Button";

export default function FinishesStep({ datos, errores, onChange, onToggle, onRegistrar, onAtras }) {
  return (
    <div>
      <h2>Nuevo Modelo</h2>
      <h3 style={{ color: "var(--marron-osc)" }}>Acabados y extras</h3>

      <ToggleSwitch checked={datos.llevaPuertas} onChange={() => onToggle("llevaPuertas")} label="¿Lleva puertas?" />
      {datos.llevaPuertas && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <FormField
            label="Tipo de puerta" name="tipoPuerta" as="select" value={datos.tipoPuerta} onChange={onChange} error={errores.tipoPuerta}
            opciones={[{ value: "abatible", label: "Abatible" }, { value: "corrediza", label: "Corrediza" }]}
          />
          <FormField
            label="Número de puertas" name="numPuertas" as="select" value={datos.numPuertas} onChange={onChange} error={errores.numPuertas}
            opciones={[1, 2, 3, 4].map((n) => ({ value: n, label: n }))}
          />
        </div>
      )}

      <FormField label="Nombre del cliente" name="nombreCliente" value={datos.nombreCliente} onChange={onChange} error={errores.nombreCliente} requerido />
      <FormField label="Observaciones" name="observaciones" as="textarea" value={datos.observaciones} onChange={onChange} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Button variante="secondary" onClick={onAtras}>← Atrás</Button>
        <Button variante="primary" tamano="lg" onClick={onRegistrar}>Registrar datos →</Button>
      </div>
    </div>
  );
}