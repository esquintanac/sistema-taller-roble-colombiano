// src/pages/Design3dPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../components/ui/Stepper";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import Modal from "../components/ui/Modal";
import Viewer3D from "../components/diseno3d/Viewer3D";
import modelosService from "../services/modelosService";
import { mensajeDeError } from "../utils/descargas";
import Spinner from "../components/ui/Spinner";

export default function Design3DPage() {
  const navigate = useNavigate();
  const [modelo, setModelo] = useState(null);
  const [diseno, setDiseno] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  // Estado vacío (entrada directa por URL, sin modelo creado): es una
  // tarjeta con su botón, no una ventana emergente.
  const [sinModelo, setSinModelo] = useState(false);

  useEffect(() => {
    const modeloCreado = JSON.parse(sessionStorage.getItem("trc_modelo_creado") || "null");

    if (!modeloCreado?.id_modelo) {
      setSinModelo(true);
      setCargando(false);
      return;
    }

    (async () => {
      try {
        const [datosModelo, datosDiseno] = await Promise.all([
          modelosService.obtener(modeloCreado.id_modelo),
          modelosService.calcularDiseno(modeloCreado.id_modelo),
        ]);
        setModelo(datosModelo);
        setDiseno(datosDiseno);
      } catch (e) {
        setError(mensajeDeError(e, "el modelo generado"));
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  if (cargando) {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <div className="card"><Spinner texto="Calculando el diseño…" /></div>
      </div>
    );
  }

  if (sinModelo) {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <div className="card">
          <Alert
            tipo="warning"
            titulo="No hay un modelo generado"
            mensaje="No hay un modelo generado todavía. Vuelve al formulario para crear uno."
          />
          <Button variante="primary" onClick={() => navigate("/formulario-datos")}>
            Ir al formulario
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    // Falló el cálculo del diseño y el fondo queda vacío: el modal solo
    // se cierra con su botón (bloquearCierre), que lleva al formulario.
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <Modal
          tipo="error"
          bloquearCierre
          titulo="No se pudo mostrar el diseño"
          mensaje={error}
          textoAceptar="Ir al formulario"
          onAceptar={() => navigate("/formulario-datos")}
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 1000, paddingTop: 30, paddingBottom: 40 }}>
      <Stepper pasoActual={3} />
      <h2>Diseño 3D del modelo</h2>
      <p style={{ color: "var(--tx-sec)", marginBottom: 16 }}>
        {modelo.nombre_modelo} — {modelo.alto} × {modelo.ancho} × {modelo.largo} cm
      </p>

      <div className="layout-panel">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Viewer3D piezas={diseno.piezas} modelo={modelo} />

          <Alert
            tipo="success"
            mensaje="¿Este es el diseño que vas a construir? Revisa las medidas antes de confirmar."
          />
          <div style={{ display: "flex", gap: 12 }}>
            <Button variante="success" tamano="lg" onClick={() => navigate("/reporte")}>
              Sí, confirmar diseño
            </Button>
            <Button variante="danger" onClick={() => navigate("/formulario-datos")}>
              No, crear otro modelo
            </Button>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: 15 }}>Piezas a cortar ({diseno.piezas.length})</h3>
          {diseno.piezas.map((p, i) => (
            <div
              key={i}
              style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}
            >
              <span>{p.nombre}</span>
              <strong>{p.ancho} × {p.alto} cm</strong>
            </div>
          ))}
          <p style={{ fontSize: 12, color: "var(--tx-muted)", marginTop: 10 }}>
            Melanina necesaria: {Math.ceil(diseno.melanina.laminas_necesarias)} láminas ({diseno.melanina.lamina_estandar})
          </p>
        </div>
      </div>
    </div>
  );
}