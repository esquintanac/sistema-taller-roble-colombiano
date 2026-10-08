// src/components/modelo/FinishesStep.jsx
// Sub-paso 1C: puertas, color, zócalo, fondo, cliente y observaciones (RF2).
//
// El cliente se SELECCIONA de los ya registrados (no se escribe a mano):
// el backend exige un id_cliente válido y solo el Administrador puede
// crear clientes nuevos.

import FormField from "../ui/FormField";
import ToggleSwitch from "../ui/ToggleSwitch";
import Button from "../ui/Button";
import Alert from "../ui/Alert";
import { etiquetaCliente } from "../../services/clientesService";

// Acabado de la melanina (opcional). Mismos valores que el formulario de
// referencia del proyecto.
const COLORES_MELANINA = [
  { value: "blanco", label: "Blanco" },
  { value: "negro", label: "Negro" },
  { value: "roble", label: "Roble" },
  { value: "nogal", label: "Nogal" },
];

// Materiales para el panel de fondo trasero. Importa que el usuario elija
// uno: la CalculadoraService del backend solo genera la pieza
// "Fondo trasero" cuando material_fondo llega con valor.
const MATERIALES_FONDO = [
  { value: "MDF 3mm", label: "MDF 3 mm" },
  { value: "Melanina 6mm", label: "Melanina 6 mm" },
  { value: "Triplex 4mm", label: "Triplex 4 mm" },
];

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
        <div className="grid-2 mb-md">
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

      <FormField
        label="Color de la melanina"
        name="color"
        as="select"
        value={datos.color}
        onChange={onChange}
        opciones={COLORES_MELANINA}
      />

      <ToggleSwitch
        checked={datos.llevaZocalo}
        onChange={() => onToggle("llevaZocalo")}
        label="¿Lleva zócalo?"
      />
      {datos.llevaZocalo && (
        <FormField
          label="Altura del zócalo (cm)"
          name="alturaZocalo"
          tipo="number"
          value={datos.alturaZocalo}
          onChange={onChange}
          error={errores.alturaZocalo}
          requerido
        />
      )}

      <ToggleSwitch
        checked={datos.llevaFondo}
        onChange={() => onToggle("llevaFondo")}
        label="¿Lleva fondo trasero?"
      />
      {datos.llevaFondo && (
        <FormField
          label="Material del fondo"
          name="materialFondo"
          as="select"
          value={datos.materialFondo}
          onChange={onChange}
          opciones={MATERIALES_FONDO}
        />
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