// src/pages/FacturasPage.jsx
// Facturación del taller (solo Administrador).
//
// Una factura NO se escribe a mano: se genera a partir de los materiales que
// ya tiene asociados un modelo, y el backend calcula el total con esos costos
// congelados (ver FacturaService.generar_factura). Si el modelo no tiene
// materiales, el backend lo avisa y no se crea nada.
//
// El listado de diseños sale de /api/facturas/modelos-facturables/ y no del
// historial: el historial guarda un registro por ACCION (creación y cada
// revisión), no uno por modelo, así que un mismo diseño salía repetido y sin
// indicar si tenía materiales. Ese endpoint devuelve un modelo por fila y ya
// filtrado por los que se pueden facturar, que es justo lo que generar_factura
// exige.

import { useEffect, useMemo, useState } from "react";
import facturasService from "../services/facturasService";
import { formatearFecha } from "../services/historialService";
import { aDolares, guardarBlob, mensajeDeError, pesos } from "../utils/descargas";
import { useTipoCambio } from "../hooks/useDatosExternos";
import DataTable from "../components/ui/DataTable";
import FormField from "../components/ui/FormField";
import Button from "../components/ui/Button";
import PanelFactura from "../components/admin/PanelFactura";
import Alert from "../components/ui/Alert";
import Card from "../components/ui/Card";
import StatCard from "../components/ui/StatCard";
import Spinner from "../components/ui/Spinner";

// Métodos de pago que se manejan en el taller.
const METODOS_PAGO = [
  { value: "Efectivo", label: "Efectivo" },
  { value: "Tarjeta de crédito", label: "Tarjeta de crédito" },
  { value: "Tarjeta débito", label: "Tarjeta débito" },
  { value: "Transferencia bancaria", label: "Transferencia bancaria" },
  { value: "PSE", label: "PSE" },
  { value: "Nequi", label: "Nequi" },
];

const COLUMNAS = [
  { key: "id_factura", label: "Factura" },
  { key: "fecha_pago", label: "Fecha", render: (f) => formatearFecha(f.fecha_pago) },
  { key: "cliente", label: "Cliente" },
  { key: "nombre_modelo", label: "Modelo" },
  { key: "valor_total", label: "Total", render: (f) => pesos(f.valor_total) },
  {
    key: "estado_pago",
    label: "Estado",
    render: (f) => (
      <span className={`badge ${f.estado_pago === "Pendiente" ? "badge-pendiente" : "badge-pagada"}`}>
        {f.estado_pago}
      </span>
    ),
  },
  { key: "metodo_pago", label: "Método" },
];

const estiloBuscador = {
  height: 44,
  padding: "0 14px",
  fontSize: 14,
  background: "var(--surface)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  flex: "1 1 240px",
};

export default function FacturasPage() {
  const [facturas, setFacturas] = useState([]);
  const [detalle, setDetalle] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [descargando, setDescargando] = useState(false);

  // Generación de una factura nueva.
  const [disenos, setDisenos] = useState([]);
  const [idModelo, setIdModelo] = useState("");
  const [metodoPago, setMetodoPago] = useState(METODOS_PAGO[0].value);
  const [generando, setGenerando] = useState(false);

  // Tipo de cambio (Fase 7) para mostrar los totales también en dólares.
  const divisa = useTipoCambio();

  async function cargarFacturas() {
    try {
      setCargando(true);
      setFacturas(await facturasService.listar());
    } catch (error) {
      setMensaje({
        tipo: "error",
        titulo: "No se pudieron cargar las facturas",
        texto: mensajeDeError(error, "las facturas"),
      });
    } finally {
      setCargando(false);
    }
  }

  async function cargarDisenos() {
    try {
      const registros = await facturasService.listarModelosFacturables();
      // El backend ya devuelve un modelo por fila, pero se filtran los que
      // vengan sin id por si el listado llegara incompleto: una fila así se
      // mostraría como "#undefined" y, al elegirla, se mandaría un id nulo.
      setDisenos(
        (Array.isArray(registros) ? registros : []).filter(
          (d) => d && d.id_modelo !== null && d.id_modelo !== undefined
        )
      );
    } catch {
      // Si el listado no carga, el selector queda vacío y no se puede generar;
      // no merece la pena ensuciar la pantalla con otro error más.
      setDisenos([]);
    }
  }

  useEffect(() => {
    cargarFacturas();
    cargarDisenos();
  }, []);

  async function verDetalle(factura) {
    setCargandoDetalle(true);
    try {
      // El listado no trae el desglose por material: hay que pedirlo.
      setDetalle(await facturasService.obtener(factura.id_factura));
    } catch (error) {
      setMensaje({
        tipo: "error",
        titulo: "No se pudo abrir la factura",
        texto: mensajeDeError(error, "la factura"),
      });
    } finally {
      setCargandoDetalle(false);
    }
  }

  async function handleGenerar() {
    // El value del <select> siempre llega como texto. Si no fuera un número,
    // el backend recibiría null y respondería "id_modelo es obligatorio", así que
    // se valida aquí en vez de dejar que la petición salga y falle.
    const modeloElegido = Number(idModelo);
    if (!Number.isInteger(modeloElegido) || modeloElegido <= 0) {
      setMensaje({
        tipo: "warning",
        titulo: "Falta elegir el diseño",
        texto: "Selecciona el modelo al que se le va a facturar.",
      });
      return;
    }

    setGenerando(true);
    setMensaje(null);
    try {
      // generar_factura ya devuelve la factura CON su detalle, así que no
      // hace falta volver a pedirla después de crearla.
      const creada = await facturasService.generar(modeloElegido, metodoPago);
      setMensaje({
        tipo: "success",
        titulo: "Factura generada",
        texto: `Se creó la factura #${creada.id_factura} por ${pesos(creada.valor_total)}.`,
      });
      setIdModelo("");
      await cargarFacturas();
      setDetalle(creada);
    } catch (error) {
      // El backend responde 400 con un motivo concreto: el caso normal es
      // que el modelo todavía no tenga materiales asociados.
      const texto = error?.response?.data?.mensaje || mensajeDeError(error, "la factura");
      setMensaje({ tipo: "error", titulo: "No se pudo generar la factura", texto });
    } finally {
      setGenerando(false);
    }
  }

  // Descarga el PDF de una factura concreta. Sirve tanto desde el botón "PDF"
  // de cada fila como desde el panel lateral, para no duplicar la misma
  // llamada HTTP en dos sitios distintos.
  async function descargarPdfDe(factura) {
    if (!factura) return;
    setDescargando(true);
    try {
      const blob = await facturasService.descargarPdf(factura.id_factura);
      guardarBlob(blob, `factura_${factura.id_factura}.pdf`);
    } catch (error) {
      setMensaje({
        tipo: "error",
        titulo: "No se pudo descargar el PDF",
        texto: mensajeDeError(error, "el reporte"),
      });
    } finally {
      setDescargando(false);
    }
  }

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return facturas;
    return facturas.filter((f) =>
      [f.id_factura, f.cliente, f.nombre_modelo, f.estado_pago, f.metodo_pago].some((valor) =>
        String(valor || "").toLowerCase().includes(texto)
      )
    );
  }, [facturas, busqueda]);

  const pendientes = facturas.filter((f) => f.estado_pago === "Pendiente").length;
  const totalFacturado = facturas.reduce((suma, f) => suma + Number(f.valor_total || 0), 0);

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <h1>Facturas</h1>
      <p style={{ color: "var(--tx-sec)", marginBottom: 20 }}>
        Se generan a partir de los materiales asociados a cada diseño, usando el costo que
        quedó congelado al asociarlos.
      </p>

      <div className="stats-grid">
        <StatCard icono="🧾" etiqueta="Facturas emitidas" valor={facturas.length} />
        <StatCard
          icono="💰"
          etiqueta="Valor facturado"
          valor={pesos(totalFacturado)}
          detalle={aDolares(totalFacturado, divisa?.usd_por_cop) || undefined}
        />
        <StatCard
          icono="⏳"
          etiqueta="Pendientes de pago"
          valor={pendientes}
          tono={pendientes > 0 ? "aviso" : "exito"}
        />
      </div>

      {mensaje && (
        <Alert tipo={mensaje.tipo} titulo={mensaje.titulo} mensaje={mensaje.texto} />
      )}

      <div className="layout-panel">
        <div>
          <Card className="mb-md">
            <h3>Generar factura</h3>
            <p style={{ color: "var(--tx-muted)", fontSize: 13, marginBottom: 14 }}>
              Solo se pueden facturar diseños que ya tengan materiales asociados; si no los
              tienen, el backend lo avisa y no genera nada.
            </p>

            <div className="grid-2">
              <FormField
                label="Diseño a facturar"
                as="select"
                value={idModelo}
                onChange={(e) => setIdModelo(e.target.value)}
                opciones={disenos.map((d) => ({
                  // El value va como texto porque lo que llega del <select> siempre
                  // es un string; Number() en handleGenerar lo devuelve a entero.
                  value: String(d.id_modelo),
                  label:
                    `#${d.id_modelo} — ${d.nombre_modelo} — ${d.cliente}` +
                    ` · ${d.num_materiales} material(es) · ${pesos(d.total_estimado)}`,
                }))}
                hint={
                  disenos.length === 0
                    ? "Ningún diseño tiene materiales asociados todavía. Asócialos desde el detalle del diseño para poder facturarlo."
                    : undefined
                }
              />
              <FormField
                label="Método de pago"
                as="select"
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                opciones={METODOS_PAGO}
              />
            </div>

            <Button variante="primary" onClick={handleGenerar} disabled={generando || !idModelo}>
              {generando ? "Generando factura…" : "Generar factura"}
            </Button>
          </Card>

          <Card className="mb-md">
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por número, cliente, modelo o método de pago…"
                aria-label="Buscar facturas"
                style={estiloBuscador}
              />
              <span style={{ fontSize: 12, color: "var(--tx-muted)" }}>
                {facturas.length} factura(s) en total
                {filtradas.length !== facturas.length && ` · mostrando ${filtradas.length}`}
              </span>
            </div>
          </Card>

          {cargando ? (
            <Card>
              <Spinner texto="Cargando facturas…" />
            </Card>
          ) : (
            <DataTable
              columnas={COLUMNAS}
              datos={filtradas}
              tituloVacio={busqueda ? "Ninguna factura coincide" : "Aún no hay facturas"}
              mensajeVacio={
                busqueda
                  ? "Prueba con otro cliente, modelo o método de pago."
                  : "Genera la primera factura desde el formulario de arriba."
              }
              renderAcciones={(factura) => (
                <div style={{ display: "flex", gap: 6 }}>
                  <Button tamano="sm" variante="secondary" onClick={() => verDetalle(factura)}>
                    Ver detalle
                  </Button>
                  <Button tamano="sm" variante="primary" onClick={() => descargarPdfDe(factura)}>
                    PDF
                  </Button>
                </div>
              )}
            />
          )}
        </div>

        {/* El panel de detalle va aparte en su propio componente. */}
        <div>
          <Card>
            <PanelFactura
              detalle={detalle}
              cargando={cargandoDetalle}
              descargando={descargando}
              onDescargar={() => descargarPdfDe(detalle)}
              tasa={divisa?.usd_por_cop}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}


