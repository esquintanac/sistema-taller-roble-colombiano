// src/pages/ValidateDataPage.jsx
import { useNavigate } from "react-router-dom";
import Stepper from "../components/ui/Stepper";
import Button from "../components/ui/Button";

// Traduce las claves internas del formulario a etiquetas legibles,
// y define qué unidad mostrar junto al valor (si aplica).
const ETIQUETAS = {
  tipoModelo: { label: "Tipo de modelo" },
  alto: { label: "Alto", unidad: "cm" },
  ancho: { label: "Ancho", unidad: "cm" },
  largo: { label: "Largo", unidad: "cm" },
  grosor: { label: "Grosor de melanina", unidad: "mm" },
  compartimentos: { label: "Compartimentos verticales" },
  entrepanos: { label: "Entrepaños por compartimento" },
  llevaCajones: { label: "¿Lleva cajones?", formato: (v) => (v ? "Sí" : "No") },
  numCajones: { label: "Número de cajones" },
  llevaBarra: { label: "¿Lleva barra colgadora?", formato: (v) => (v ? "Sí" : "No") },
  alturaBarra: { label: "Altura de la barra", unidad: "cm" },
  llevaPuertas: { label: "¿Lleva puertas?", formato: (v) => (v ? "Sí" : "No") },
  tipoPuerta: { label: "Tipo de puerta" },
  numPuertas: { label: "Número de puertas" },
  nombreCliente: { label: "Nombre del cliente" },
  observaciones: { label: "Observaciones" },
};

// Orden en el que se muestran los campos (más natural que el orden del objeto)
const ORDEN = [
  "tipoModelo", "alto", "ancho", "largo", "grosor",
  "compartimentos", "entrepanos", "llevaCajones", "numCajones",
  "llevaBarra", "alturaBarra", "llevaPuertas", "tipoPuerta", "numPuertas",
  "nombreCliente", "observaciones",
];

export default function ValidateDataPage() {
  const navigate = useNavigate();
  const datos = JSON.parse(sessionStorage.getItem("trc_modelo") || "{}");

  return (
    <div className="container" style={{ maxWidth: 800, paddingTop: 30, paddingBottom: 40 }}>
      <Stepper pasoActual={2} />

      <div className="card">
        <h2>Verificar los datos registrados</h2>
        <p style={{ color: "var(--tx-sec)", marginBottom: 18 }}>
          Confirma que los datos sean correctos antes de generar el diseño 3D
        </p>

        <div style={{ background: "var(--bg-alt)", borderRadius: 12, padding: "14px 18px", marginBottom: 20 }}>
          {ORDEN.map((clave) => {
            const valor = datos[clave];
            const config = ETIQUETAS[clave];

            // Oculta campos vacíos, false sin marcar, o que no aplican
            const estaVacio = valor === "" || valor === undefined || valor === null;
            const esFalseIrrelevante = valor === false && !["llevaCajones", "llevaBarra", "llevaPuertas"].includes(clave);
            if (estaVacio || esFalseIrrelevante) return null;

            const valorMostrado = config.formato
              ? config.formato(valor)
              : `${valor}${config.unidad ? " " + config.unidad : ""}`;

            return (
              <div
                key={clave}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <span style={{ color: "var(--tx-sec)" }}>{config.label}</span>
                <strong>{valorMostrado}</strong>
              </div>
            );
          })}
        </div>

        <p style={{ fontWeight: 700, marginBottom: 12 }}>¿Los datos registrados son correctos?</p>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variante="success" tamano="lg" onClick={() => navigate("/disenio-3d")}>
            Sí, generar diseño 3D
          </Button>
          <Button variante="danger" tamano="lg" onClick={() => navigate("/formulario-datos")}>
            No, corregir datos
          </Button>
        </div>
      </div>
    </div>
  );
}