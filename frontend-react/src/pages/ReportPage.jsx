// src/pages/ReportPage.jsx
// Paso final del flujo del carpintero (RF5, HU-02): descarga de los
// reportes PDF del modelo ya guardado en el backend.
//
// Son DOS documentos distintos, con endpoints distintos, porque
// responden a preguntas distintas:
//   1) Reporte de construcción -> GET /api/modelos/<id>/pdf/
//      Qué piezas hay que cortar y cuánta melanina se necesita.
//   2) Reporte de materiales y costos -> GET /api/modelos/<id>/pdf/materiales/
//      Qué materiales lleva el mueble (tabla modelo_material), cuánto de
//      cada uno y cuánto cuesta, con el total. Ese costo quedó congelado
//      al asociar el material, así que no cambia si sube el inventario.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../components/ui/Stepper";
import Alert from "../components/ui/Alert";
import Button from "../components/ui/Button";
import modelosService from "../services/modelosService";
import { guardarBlob, mensajeDeError } from "../utils/descargas";

// Descripción de los dos reportes, para no duplicar el marcado.
const REPORTES = [
  {
    clave: "construccion",
    titulo: "Reporte de construcción",
    descripcion:
      "Lista las piezas a cortar con sus medidas y la melanina necesaria. Es el documento para el taller.",
  },
  {
    clave: "materiales",
    titulo: "Reporte de materiales y costos",
    descripcion:
      "Desglose de materiales del mueble con su costo real y el total. Es el documento para cotizar.",
  },
];

export default function ReportPage() {
  const navigate = useNavigate();
  const [descargando, setDescargando] = useState(null);
  const [aviso, setAviso] = useState(null);

  // El modelo guardado es la fuente autoritativa: es el único que trae el
  // id_modelo que necesitan los endpoints de PDF.
  const modeloCreado = JSON.parse(sessionStorage.getItem("trc_modelo_creado") || "null");
  const datosFormulario = JSON.parse(sessionStorage.getItem("trc_modelo") || "{}");

  // Sin modelo guardado no hay nada que reportar: los endpoints piden un
  // id que todavía no existe.
  if (!modeloCreado?.id_modelo) {
    return (
      <div className="container" style={{ maxWidth: 800, paddingTop: 30, paddingBottom: 40 }}>
        <Stepper pasoActual={4} />
        <div className="card">
          <Alert
            tipo="warning"
            titulo="No hay un modelo generado"
            mensaje="Los reportes se generan a partir de un modelo ya guardado. Registra las medidas para crear uno."
          />
          <Button variante="primary" onClick={() => navigate("/formulario-datos")}>
            Ir al formulario
          </Button>
        </div>
      </div>
    );
  }

  const medidas = `${modeloCreado.alto} × ${modeloCreado.ancho} × ${modeloCreado.largo} cm`;
  const cliente = datosFormulario.clienteEtiqueta || "Cliente no registrado";

  async function descargarReporte(tipo) {
    setDescargando(tipo);
    setAviso(null);
    try {
      // Cada reporte se pide a su propio endpoint; ambos devuelven un PDF
      // binario que axios entrega como Blob (responseType: "blob").
      const blob =
        tipo === "construccion"
          ? await modelosService.descargarPdf(modeloCreado.id_modelo)
          : await modelosService.descargarPdfMateriales(modeloCreado.id_modelo);

      const nombreArchivo =
        tipo === "construccion"
          ? `reporte_modelo_${modeloCreado.id_modelo}.pdf`
          : `materiales_modelo_${modeloCreado.id_modelo}.pdf`;

      guardarBlob(blob, nombreArchivo);

      setAviso({
        tipo: "success",
        titulo: "Reporte generado",
        mensaje:
          tipo === "construccion"
            ? "Se descargó el reporte de construcción con las piezas a cortar."
            : "Se descargó el reporte de materiales y costos del mueble.",
      });
    } catch (e) {
      setAviso({
        tipo: "error",
        titulo: "No se pudo generar el reporte",
        mensaje: mensajeDeError(e, "el modelo"),
      });
    } finally {
      setDescargando(null);
    }
  }

  return (
    <div className="container" style={{ maxWidth: 1000, paddingTop: 30, paddingBottom: 40 }}>
      <Stepper pasoActual={4} />

      <Alert
        tipo="success"
        titulo="Diseño confirmado exitosamente"
        mensaje={`${modeloCreado.nombre_modelo} — ${medidas} — ${cliente}`}
      />

      {aviso && <Alert tipo={aviso.tipo} titulo={aviso.titulo} mensaje={aviso.mensaje} />}

      <div className="card">
        <h2>Reportes del modelo</h2>
        <p style={{ color: "var(--tx-sec)", marginBottom: 20 }}>
          Descarga los documentos del mueble <strong>#{modeloCreado.id_modelo}</strong> en formato PDF.
        </p>

        <div className="grid-reportes">
          {REPORTES.map((reporte) => (
            <div key={reporte.clave} className="reporte-item">
              <h3 style={{ fontSize: 15, marginBottom: 6 }}>{reporte.titulo}</h3>
              <p style={{ color: "var(--tx-sec)", fontSize: 13, marginBottom: 14 }}>
                {reporte.descripcion}
              </p>
              <Button
                variante="primary"
                disabled={descargando !== null}
                onClick={() => descargarReporte(reporte.clave)}
              >
                {descargando === reporte.clave ? "Generando PDF…" : "⬇ Descargar PDF"}
              </Button>
            </div>
          ))}
        </div>

        {/* Imprimir usa el diálogo del navegador (Ctrl+P). No necesita
            backend: sirve para llevar los datos en papel sin depender de
            la descarga del PDF. */}
        <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
          <Button variante="secondary" onClick={() => window.print()}>
            🖨 Imprimir esta página
          </Button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <Button variante="secondary" onClick={() => navigate("/inicio")}>
          Volver al panel
        </Button>
        <Button variante="secondary" onClick={() => navigate("/formulario-datos")}>
          Crear otro modelo
        </Button>
      </div>
    </div>
  );
}