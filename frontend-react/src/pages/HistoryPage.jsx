// src/pages/HistoryPage.jsx
import { useNavigate } from "react-router-dom";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import Button from "../components/ui/Button";

const DATOS_REFERENCIA = [
  { id: "014", creadoPor: "Juan Pérez", tipo: "Closet", medidas: "200x120x60", fecha: "Hoy, 9:14am", estado: "Nuevo" },
  { id: "013", creadoPor: "Luis González", tipo: "Mueble", medidas: "90x180x45", fecha: "Hoy, 8:02am", estado: "Nuevo" },
];

const COLUMNAS = [
  { key: "id", label: "ID" },
  { key: "creadoPor", label: "Creado por" },
  { key: "tipo", label: "Tipo" },
  { key: "medidas", label: "Medidas (cm)" },
  { key: "fecha", label: "Fecha" },
  { key: "estado", label: "Estado", render: (f) => <StatusBadge estado={f.estado} /> },
];

export default function HistoryPage() {
  const navigate = useNavigate();

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <h1>Historial de diseños</h1>
      <p style={{ color: "var(--tx-sec)", marginBottom: 18 }}>
        Solo lectura — no se pueden modificar los diseños
      </p>
      <div className="card">
        <DataTable
          columnas={COLUMNAS}
          datos={DATOS_REFERENCIA}
          renderAcciones={(fila) => (
            <Button
              tamano="sm"
              variante="secondary"
              onClick={() => navigate(`/detalle-admin/${fila.id}`)}
            >
              Ver diseño
            </Button>
          )}
        />
      </div>
    </div>
  );
}