// src/components/modelo/DimensionsStep.jsx
// Sub-paso 1A: tipo de modelo, alto, ancho, largo, grosor (RF2).

import FormField from "../ui/FormField";
import Button from "../ui/Button";
import ModelTypeSelector from "./ModelTypeSelector";
import { LIMITES_RANGO } from "./limitesModelo";

export default function DimensionsStep({ datos, errores, onChange, onTipoChange, onSiguiente }) {
  return (
    <div>
      <h2>Nuevo Modelo</h2>
      <h3 style={{ color: "var(--marron-osc)" }}>Dimensiones generales</h3>

      <div className="form-group">
        <label className="form-label">Tipo de modelo *</label>
        <ModelTypeSelector tipoSeleccionado={datos.tipoModelo} onSelect={onTipoChange} />
      </div>

      {/* Los campos de medida son texto con inputMode decimal para poder
          cortar la escritura en vivo (maxLength no aplica a number):
          máximo 3 dígitos enteros y 1 decimal (1 mm de precisión). */}
      <div className="grid-3">
        <FormField
          label="Alto (cm)" name="alto" tipo="text" inputMode="decimal" maxLength={5}
          value={datos.alto} onChange={onChange} error={errores.alto}
          hint={`Entre ${LIMITES_RANGO.alto.min} y ${LIMITES_RANGO.alto.max} cm`} requerido
        />
        <FormField
          label="Ancho (cm)" name="ancho" tipo="text" inputMode="decimal" maxLength={5}
          value={datos.ancho} onChange={onChange} error={errores.ancho}
          hint={`Entre ${LIMITES_RANGO.ancho.min} y ${LIMITES_RANGO.ancho.max} cm`} requerido
        />
        <FormField
          label="Largo (cm)" name="largo" tipo="text" inputMode="decimal" maxLength={5}
          value={datos.largo} onChange={onChange} error={errores.largo}
          hint={`Entre ${LIMITES_RANGO.largo.min} y ${LIMITES_RANGO.largo.max} cm`} requerido
        />
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