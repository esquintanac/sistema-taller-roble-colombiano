// src/pages/ValidateDataPage.jsx
// Paso 2 del flujo: resumen de los datos y confirmación final. Aquí es
// donde el modelo se guarda realmente en el backend (POST /api/modelos/).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../components/ui/Stepper";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import { useAuth } from "../context/AuthContext";
import modelosService, { construirPayload } from "../services/modelosService";

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
  clienteEtiqueta: { label: "Cliente" },
  observaciones: { label: "Observaciones" },
};

// Orden en el que se muestran los campos (más natural que el orden del objeto)
const ORDEN = [
  "tipoModelo", "alto", "ancho", "largo", "grosor",
  "compartimentos", "entrepanos", "llevaCajones", "numCajones",
  "llevaBarra", "alturaBarra", "llevaPuertas", "tipoPuerta", "numPuertas",
  "clienteEtiqueta", "observaciones",
];

export default function ValidateDataPage() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [guardando, setGuardando] = useState(false);
  const [errorGuardado, setErrorGuardado] = useState([]);
  const datos = JSON.parse(sessionStorage.getItem("trc_modelo") || "{}");

  // Si se entra directo a la URL sin pasar por el formulario no hay
  // datos que validar: se avisa y se ofrece volver al paso anterior.
  const hayDatos = Object.keys(datos).length > 0;

  // Aquí es donde el modelo se persiste de verdad en el backend
  // (POST /api/modelos/). El id devuelto se guarda en sessionStorage
  // para que Diseño 3D y Reporte sepan qué modelo consultar.
  async function confirmarYGuardar() {
    setErrorGuardado([]);
    setGuardando(true);
    try {
      const modeloCreado = await modelosService.crear(construirPayload(datos, usuario));
      sessionStorage.setItem("trc_modelo_creado", JSON.stringify(modeloCreado));
      navigate("/diseno-3d");
    } catch (error) {
      const data = error?.response?.data;
      // El backend responde { errores: [...] } en fallos de validación.
      setErrorGuardado(
        data?.errores || [
          data?.mensaje ||
            "No se pudo guardar el modelo. Verifica tu conexión e inténtalo de nuevo.",
        ]
      );
    } finally {
      setGuardando(false);
    }
  }

  if (!hayDatos) {
    return (
      <div className="container" style={{ maxWidth: 800, paddingTop: 30, paddingBottom: 40 }}>
        <Stepper pasoActual={2} />
        <div className="card">
          <Alert
            tipo="warning"
            titulo="No hay datos para validar"
            mensaje="Primero debes registrar las medidas del modelo."
          />
          <Button variante="primary" onClick={() => navigate("/formulario-datos")}>
            Ir al formulario
          </Button>
        </div>
      </div>
    );
  }

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

        {errorGuardado.length > 0 && (
          <Alert
            tipo="error"
            titulo="No se pudo guardar el modelo"
            mensaje={errorGuardado.join(" ")}
          />
        )}

        <p style={{ fontWeight: 700, marginBottom: 12 }}>¿Los datos registrados son correctos?</p>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variante="success" tamano="lg" onClick={confirmarYGuardar} disabled={guardando}>
            {guardando ? "Guardando modelo…" : "Sí, generar diseño 3D"}
          </Button>
          <Button
            variante="danger"
            tamano="lg"
            onClick={() => navigate("/formulario-datos")}
            disabled={guardando}
          >
            No, corregir datos
          </Button>
        </div>
      </div>
    </div>
  );
}