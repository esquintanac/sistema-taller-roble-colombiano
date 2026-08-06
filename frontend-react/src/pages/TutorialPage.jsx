// src/pages/TutorialPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TutorialProgressBar from "../components/tutorial/TutorialProgressBar";
import TutorialStepCard from "../components/tutorial/TutorialStepCard";
import Button from "../components/ui/Button";

const PASOS = [
  { icono: "🔑", titulo: "Iniciar sesión", descripcion: "Usa tu usuario y contraseña, y verifica tu identidad con el código enviado por SMS.", consejo: "Guarda tus credenciales en un lugar seguro." },
  { icono: "📋", titulo: "Registrar los datos del modelo", descripcion: "Selecciona el tipo de modelo e ingresa las medidas en centímetros.", consejo: "Ten las medidas del cliente antes de empezar." },
  { icono: "🔍", titulo: "Validar y confirmar", descripcion: "Revisa el resumen de datos antes de generar el diseño 3D.", consejo: "Esta es tu última oportunidad de corregir errores." },
];

export default function TutorialPage() {
  const [paso, setPaso] = useState(1);
  const navigate = useNavigate();

  return (
    <div className="container" style={{ maxWidth: 680, paddingTop: 30, paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h1 style={{ margin: 0 }}>Bienvenido al sistema</h1>
        <Button variante="secondary" tamano="sm" onClick={() => navigate("/formulario-datos")}>
          Saltar tutorial
        </Button>
      </div>

      <p style={{ color: "var(--tx-sec)", marginBottom: 20 }}>
        Esta guía te explica cómo registrar un modelo paso a paso.
      </p>

      <TutorialProgressBar pasoActual={paso} totalPasos={PASOS.length} />
      <TutorialStepCard paso={PASOS[paso - 1]} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Button variante="secondary" disabled={paso === 1} onClick={() => setPaso(paso - 1)}>
          Paso anterior
        </Button>
        <Button
          variante="primary"
          onClick={() => (paso < PASOS.length ? setPaso(paso + 1) : navigate("/formulario-datos"))}
        >
          {paso < PASOS.length ? "Siguiente paso" : "Ir al sistema"}
        </Button>
      </div>
    </div>
  );
}