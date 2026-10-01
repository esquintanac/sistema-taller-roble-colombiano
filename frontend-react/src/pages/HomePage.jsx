// src/pages/HomePage.jsx
// Panel del Taller: pantalla de inicio tras autenticarse. Muestra las
// acciones disponibles segun el rol del usuario (Carpintero/Administrador).
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

// Accesos del Carpintero: flujo de creacion y validacion de un modelo.
const ACCIONES_CARPINTERO = [
  { icono: "📋", titulo: "Nuevo modelo", descripcion: "Registra las medidas y caracteristicas de un mueble.", ruta: "/formulario-datos" },
  { icono: "🔍", titulo: "Validar datos", descripcion: "Revisa y confirma la informacion antes de generar el diseno.", ruta: "/validar-datos" },
  { icono: "🧊", titulo: "Diseno 3D", descripcion: "Visualiza el modelo tridimensional del mueble.", ruta: "/diseno-3d" },
  { icono: "📄", titulo: "Reporte PDF", descripcion: "Genera el reporte tecnico con materiales y costos.", ruta: "/reporte" },
  { icono: "🎓", titulo: "Tutorial", descripcion: "Vuelve a ver la guia paso a paso del sistema.", ruta: "/tutorial" },
];

// Accesos del Administrador: supervision, historial e inventario.
const ACCIONES_ADMINISTRADOR = [
  { icono: "🗂️", titulo: "Historial de disenos", descripcion: "Consulta y revisa los modelos creados por los carpinteros.", ruta: "/historial" },
  { icono: "📦", titulo: "Materiales", descripcion: "Administra el inventario y los costos de los materiales.", ruta: "/materiales" },
  { icono: "🎓", titulo: "Tutorial", descripcion: "Vuelve a ver la guia paso a paso del sistema.", ruta: "/tutorial-admin" },
];

export default function HomePage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const esAdmin = usuario?.rol === "Administrador";
  const acciones = esAdmin ? ACCIONES_ADMINISTRADOR : ACCIONES_CARPINTERO;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <h1 style={{ marginBottom: 4 }}>
        Hola, {usuario?.nombre || "usuario"}
      </h1>
      <p style={{ color: "var(--tx-sec)", marginBottom: 24 }}>
        {esAdmin
          ? "Panel de administracion: supervisa disenos e inventario del taller."
          : "Panel del taller: crea y valida los modelos de mobiliario a medida."}
      </p>

      <div className="grid-acciones">
        {acciones.map((accion) => (
          <Card key={accion.ruta} className="card-accion">
            <div style={{ fontSize: 32, marginBottom: 8 }}>{accion.icono}</div>
            <h3 style={{ margin: "0 0 6px" }}>{accion.titulo}</h3>
            <p style={{ color: "var(--tx-sec)", fontSize: 14, marginBottom: 16 }}>
              {accion.descripcion}
            </p>
            <Button variante="primary" tamano="sm" onClick={() => navigate(accion.ruta)}>
              Abrir
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}