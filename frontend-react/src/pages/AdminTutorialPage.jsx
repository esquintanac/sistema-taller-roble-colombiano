// src/pages/AdminTutorialPage.jsx
// Tutorial exclusivo para el rol Administrador. Al finalizar, redirige
// a /historial (no al formulario del carpintero, que no le corresponde).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TutorialProgressBar from "../components/tutorial/TutorialProgressBar";
import TutorialStepCard from "../components/tutorial/TutorialStepCard";
import Button from "../components/ui/Button";

const PASOS_ADMIN = [
  { icono: "📂", titulo: "Consultar el historial de diseños", descripcion: "Aquí verás todos los modelos creados por los carpinteros del taller, en modo solo lectura.", consejo: "No podrás modificar ningún diseño, solo consultarlo." },
  { icono: "🧮", titulo: "Ver el detalle y los costos", descripcion: "Cada diseño muestra la cantidad de materiales necesarios y su costo estimado.", consejo: "Usa esta información para comunicarte con los proveedores." },
  { icono: "📄", titulo: "Descargar reportes en PDF", descripcion: "Puedes generar un reporte con los costos totales de cada diseño.", consejo: "El reporte incluye materiales, cantidades y precios." },
];

export default function AdminTutorialPage() {
  const [paso, setPaso] = useState(1);
  const navigate = useNavigate();

  return (
    <div className="container" style={{ maxWidth: 680, paddingTop: 30, paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h1 style={{ margin: 0 }}>Bienvenido, Administrador</h1>
        <Button variante="secondary" tamano="sm" onClick={() => navigate("/inicio")}>
          Saltar tutorial
        </Button>
      </div>

      <p style={{ color: "var(--tx-sec)", marginBottom: 20 }}>
        Esta guía te explica cómo consultar el historial y los reportes del taller.
      </p>

      <TutorialProgressBar pasoActual={paso} totalPasos={PASOS_ADMIN.length} />
      <TutorialStepCard paso={PASOS_ADMIN[paso - 1]} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Button variante="secondary" disabled={paso === 1} onClick={() => setPaso(paso - 1)}>
          Paso anterior
        </Button>
        <Button
          variante="primary"
          onClick={() => (paso < PASOS_ADMIN.length ? setPaso(paso + 1) : navigate("/inicio"))}
        >
          {paso < PASOS_ADMIN.length ? "Siguiente paso" : "Ir al panel del taller"}
        </Button>
      </div>
    </div>
  );
}