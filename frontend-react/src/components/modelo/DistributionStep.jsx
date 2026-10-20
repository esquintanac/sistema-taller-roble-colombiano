// src/components/modelo/DistributionStep.jsx
// Sub-paso 1B: compartimentos, entrepaños, cajones, barra (RF2).

import FormField from "../ui/FormField";
import ToggleSwitch from "../ui/ToggleSwitch";
import Button from "../ui/Button";
import { ALTO_POR_CAJON, LIMITES_RANGO } from "./limitesModelo";

export default function DistributionStep({ datos, errores, onChange, onToggle, onSiguiente, onAtras }) {
  // Advertencia informativa (no bloquea el registro): cada cajón ocupa
  // ~15 cm de alto (fondo + guía). Si la suma no cabe en el alto del
  // mueble, el carpintero debe ajustar cantidades o medidas.
  const altoMueble = Number(datos.alto);
  const cajones = Number(datos.numCajones);
  const advertenciaCajones =
    datos.llevaCajones &&
    Number.isFinite(altoMueble) &&
    Number.isFinite(cajones) &&
    cajones * ALTO_POR_CAJON > altoMueble
      ? `Advertencia: ${cajones} cajones pueden no caber en ${datos.alto} cm de alto (~${ALTO_POR_CAJON} cm por cajón).`
      : null;
  return (
    <div>
      <h2>Nuevo Modelo</h2>
      <h3 style={{ color: "var(--marron-osc)" }}>Distribución interna</h3>

      <div className="grid-2">
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
        <FormField
          label="¿Cuántos cajones?" name="numCajones" tipo="text" inputMode="numeric" maxLength={2}
          value={datos.numCajones} onChange={onChange} error={errores.numCajones}
          hint={advertenciaCajones || `Entre ${LIMITES_RANGO.numCajones.min} y ${LIMITES_RANGO.numCajones.max} cajones`}
          requerido
        />
      )}

      <ToggleSwitch checked={datos.llevaBarra} onChange={() => onToggle("llevaBarra")} label="¿Lleva barra colgadora?" />
      {datos.llevaBarra && (
        <FormField
          label="Altura de la barra (cm)" name="alturaBarra" tipo="text" inputMode="decimal" maxLength={5}
          value={datos.alturaBarra} onChange={onChange} error={errores.alturaBarra}
          hint={`Entre ${LIMITES_RANGO.alturaBarra.min} y ${LIMITES_RANGO.alturaBarra.max} cm, menor que el alto (${datos.alto} cm)`}
          requerido
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Button variante="secondary" onClick={onAtras}>← Atrás</Button>
        <Button variante="primary" onClick={onSiguiente}>Siguiente →</Button>
      </div>
    </div>
  );
}