// src/components/modelo/FinishesStep.jsx
// Sub-paso 1C: puertas, cliente y observaciones (RF2).
//
// El cliente se SELECCIONA de los ya registrados (no se escribe a mano):
// el backend exige un id_cliente válido y solo el Administrador puede
// crear clientes nuevos.

import FormField from "../ui/FormField";
import ToggleSwitch from "../ui/ToggleSwitch";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { etiquetaCliente } from "../../services/clientesService";

export default function FinishesStep({
  datos,
  errores,
  onChange,
  onToggle,
  onRegistrar,
  onAtras,
  clientes = [],
  cargandoClientes = false,
  errorClientes = "",
}) {
  // Opciones del <select> de clientes: "Ana Pérez — CC 10203040"
  const opcionesClientes = clientes.map((cliente) => ({
    value: cliente.id_cliente,
    label: etiquetaCliente(cliente),
  }));

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

      {errorClientes && <Alert tipo="error" mensaje={errorClientes} />}
      <FormField
        label="Cliente"
        name="idCliente"
        as="select"
        value={datos.idCliente}
        onChange={onChange}
        error={errores.idCliente}
        requerido
        hint={
          cargandoClientes
            ? "Cargando clientes…"
            : clientes.length === 0
              ? "No hay clientes registrados. Un administrador debe crearlos primero."
              : undefined
        }
        opciones={opcionesClientes}
      />
      <FormField label="Observaciones" name="observaciones" as="textarea" value={datos.observaciones} onChange={onChange} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
        <Button variante="secondary" onClick={onAtras}>← Atrás</Button>
        <Button
          variante="primary"
          tamano="lg"
          onClick={onRegistrar}
          disabled={cargandoClientes || clientes.length === 0}
        >
          Registrar datos →
        </Button>
      </div>
    </div>
  );
}