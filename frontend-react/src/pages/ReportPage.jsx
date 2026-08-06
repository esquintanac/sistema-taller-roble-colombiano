// src/pages/ReportPage.jsx
import Stepper from "../components/ui/Stepper";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";

export default function ReportPage() {
  const datos = JSON.parse(sessionStorage.getItem("trc_modelo") || "{}");
  const tipoModelo = datos.tipoModelo || "Modelo";
  const cliente = datos.nombreCliente || "Cliente sin nombre";
  const medidas = datos.alto && datos.ancho && datos.largo
    ? `${datos.alto} × ${datos.ancho} × ${datos.largo} cm`
    : "Medidas no registradas";

  return (
    <div className="container" style={{ maxWidth: 1000, paddingTop: 30, paddingBottom: 40 }}>
      <Stepper pasoActual={4} />
      <Alert
        tipo="success"
        titulo="Diseño confirmado exitosamente"
        mensaje={`${tipoModelo} para ${cliente} — ${medidas}`}
      />

      <div className="card">
        <h2>Reporte de construcción</h2>
        <p style={{ color: "var(--tx-sec)", marginBottom: 16 }}>
          La generación de PDF (RF5, HU-02) se conectará con el backend en una próxima evidencia.
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          <Button variante="primary">⬇ Descargar PDF</Button>
          <Button variante="secondary">🖨 Imprimir</Button>
        </div>
      </div>
    </div>
  );
}