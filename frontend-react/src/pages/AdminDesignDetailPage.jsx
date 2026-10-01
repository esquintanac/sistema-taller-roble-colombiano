// src/pages/AdminDesignDetailPage.jsx
// Detalle de un diseño para el administrador (RF8/RF9/RF10, HU-04).
// El administrador consulta el diseño y puede marcarlo como revisado o
// asociarle la melanina; no modifica las medidas ni los datos del
// carpintero.
//
// El costo se resuelve en CASCADA, del dato más autoritativo al menos:
//   1) Factura ya generada    -> valor_total + estado_pago + metodo_pago
//   2) Materiales asociados   -> Σ costo_utilizado (congelado, sin facturar)
//   3) Sin costo todavía      -> el administrador elige la lámina y el
//                                BACKEND calcula la cantidad con su propia
//                                CalculadoraService (aquí no se estima a mano)
//
// Endpoints consumidos:
//   GET  /api/historial/<id_historial>/         -> registro enriquecido
//   GET  /api/modelos/<id_modelo>/              -> características
//   GET  /api/modelos/<id_modelo>/diseno/       -> piezas + melanina
//   GET  /api/modelos/<id_modelo>/materiales/   -> materiales asociados
//   POST /api/modelos/<id_modelo>/materiales/melanina/ -> asocia melanina
//   GET  /api/facturas/  y  /api/facturas/<id>/ -> factura del modelo
//   GET  /api/materiales/                       -> catálogo para elegir lámina
//   PUT  /api/historial/<id_historial>/revisar/ -> marcar revisado (RF9)

import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import StatusBadge from "../components/ui/StatusBadge";
import historialService, { formatearFecha, mapearRegistro } from "../services/historialService";
import modelosService from "../services/modelosService";
import materialesService from "../services/materialesService";
import facturasService, { facturaDeModelo } from "../services/facturasService";
// guardarBlob se comparte con ReportPage para no tener dos copias de la
// misma descarga de PDF.
import { guardarBlob } from "../utils/descargas";
import Viewer3D from "../components/diseno3d/Viewer3D";

// Traduce el error de axios a un mensaje entendible para el usuario.
function mensajeDeError(error) {
  const estado = error?.response?.status;
  if (estado === 401) return "Tu sesión expiró. Vuelve a iniciar sesión.";
  if (estado === 403) return "No tienes permiso para consultar este diseño.";
  if (estado === 404) return "No se encontró el diseño solicitado.";
  return "No se pudo conectar con el servidor. Verifica que el backend esté corriendo.";
}

// Formato de pesos colombianos: 85000 -> $85.000
const pesos = (valor) => `$${Number(valor || 0).toLocaleString("es-CO")}`;

// Medidas con un decimal como máximo: 118.42 -> 118,4
const numero = (valor) =>
  Number(valor || 0).toLocaleString("es-CO", { maximumFractionDigits: 1 });

// Color del badge de estado de pago: verde si ya está pagada, ámbar si no.
function colorEstadoPago(estado) {
  const pagada = String(estado || "").toLowerCase().startsWith("pag");
  return pagada
    ? { background: "var(--success-bg)", color: "var(--success)" }
    : { background: "var(--warning-bg)", color: "var(--warning)" };
}

// Estilos compartidos por las filas de resumen.
const filaDato = {
  display: "flex",
  justifyContent: "space-between",
  padding: "7px 0",
  borderBottom: "1px solid var(--border)",
};
const filaTotal = {
  display: "flex",
  justifyContent: "space-between",
  paddingTop: 10,
  marginTop: 4,
  borderTop: "2px solid var(--border-dk)",
};

export default function AdminDesignDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [registro, setRegistro] = useState(null);
  const [modelo, setModelo] = useState(null);
  const [diseno, setDiseno] = useState(null);
  // Fuente 1: factura del modelo. Es el dato más autoritativo porque
  // además del total trae estado_pago y metodo_pago.
  const [factura, setFactura] = useState(null);
  const [facturasDelModelo, setFacturasDelModelo] = useState(0);
  // Fuente 2: materiales asociados (modelo_material): costo real que
  // todavía no pasó por facturación.
  const [materialesModelo, setMaterialesModelo] = useState([]);
  // Fuente 3: todavía no hay costo real. En vez de estimarlo en el
  // navegador, el administrador elige qué lámina usar y el backend
  // calcula la cantidad con su propia CalculadoraService.
  const [laminasDisponibles, setLaminasDisponibles] = useState([]);
  const [laminaElegida, setLaminaElegida] = useState("");
  const [asociando, setAsociando] = useState(false);
  const [melaninaCalculada, setMelaninaCalculada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(null);
  const [marcando, setMarcando] = useState(false);
  const [descargandoFactura, setDescargandoFactura] = useState(false);

  const cargarDetalle = useCallback(async () => {
    setCargando(true);
    setError("");
    setAviso(null);
    // Se limpian las fuentes de costo: al navegar entre diseños el
    // componente no se remonta, así que no deben quedar datos previos.
    setFactura(null);
    setFacturasDelModelo(0);
    setMaterialesModelo([]);
    setLaminasDisponibles([]);
    setLaminaElegida("");
    setMelaninaCalculada(null);
    try {
      const crudo = await historialService.obtener(id);
      const registroMapeado = mapearRegistro(crudo);
      setRegistro(registroMapeado);

      // El modelo y su cálculo son independientes: se piden en paralelo
      // para no encadenar dos esperas de red.
      const [datosModelo, datosDiseno] = await Promise.all([
        modelosService.obtener(registroMapeado.idModelo),
        modelosService.calcularDiseno(registroMapeado.idModelo),
      ]);
      setModelo(datosModelo);
      setDiseno(datosDiseno);

      // ---- Resolución del costo, en orden de autoridad ----
      const [respuestaFacturas, respuestaMateriales] = await Promise.allSettled([
        facturasService.listar(),
        modelosService.materialesDelModelo(registroMapeado.idModelo),
      ]);

      // Fuente 2: materiales asociados al modelo (modelo_material).
      const materialesAsociados =
        respuestaMateriales.status === "fulfilled" && Array.isArray(respuestaMateriales.value)
          ? respuestaMateriales.value
          : [];
      setMaterialesModelo(materialesAsociados);

      // Fuente 1: factura del modelo, si ya se generó alguna.
      let facturaEncontrada = null;
      if (respuestaFacturas.status === "fulfilled") {
        const { factura: encontrada, total } = facturaDeModelo(
          respuestaFacturas.value,
          registroMapeado.idModelo
        );
        setFacturasDelModelo(total);
        facturaEncontrada = encontrada;
        if (encontrada) {
          // El desglose por material solo viene en el endpoint individual.
          try {
            setFactura(await facturasService.obtener(encontrada.id_factura));
          } catch {
            setFactura(encontrada);
          }
        }
      }

      // Solo cuando no hay costo real se ofrece asociar la melanina. Se
      // listan las láminas del inventario para que el administrador elija
      // una explícitamente: antes se tomaba "la primera de tipo Tablero",
      // es decir, un costo que nadie había decidido.
      if (!facturaEncontrada && materialesAsociados.length === 0) {
        try {
          const materiales = await materialesService.listar();
          setLaminasDisponibles(
            (Array.isArray(materiales) ? materiales : []).filter(
              (m) => String(m.tipo_material || "").toLowerCase() === "tablero"
            )
          );
        } catch {
          setLaminasDisponibles([]);
        }
      }
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarDetalle();
  }, [cargarDetalle]);

  // RF9: cambia el estado del registro de "Nuevo" a "Revisado".
  async function marcarRevisado() {
    setMarcando(true);
    setAviso(null);
    try {
      const actualizado = await historialService.marcarRevisado(id);
      setRegistro(mapearRegistro(actualizado));
      setAviso({
        tipo: "success",
        titulo: "Diseño revisado",
        mensaje: "El registro quedó marcado como Revisado (RF9).",
      });
    } catch (e) {
      setAviso({ tipo: "error", titulo: "No se pudo actualizar", mensaje: mensajeDeError(e) });
    } finally {
      setMarcando(false);
    }
  }

  // RF10: reporte de CONSTRUCCIÓN del modelo (piezas a cortar).
  // Ojo: NO es la factura, que se descarga con la función de abajo.
  async function descargarPdf() {
    setAviso(null);
    try {
      const blob = await modelosService.descargarPdf(registro.idModelo);
      guardarBlob(blob, `reporte_modelo_${registro.idModelo}.pdf`);
    } catch (e) {
      setAviso({
        tipo: "error",
        titulo: "No se pudo generar el reporte",
        mensaje: mensajeDeError(e),
      });
    }
  }

  // Reporte PDF de la FACTURA (costos facturados). Solo aplica cuando
  // el modelo ya tiene factura generada.
  async function descargarPdfFactura() {
    if (!factura) return;
    setDescargandoFactura(true);
    setAviso(null);
    try {
      const blob = await facturasService.descargarPdf(factura.id_factura);
      guardarBlob(blob, `factura_${factura.id_factura}.pdf`);
    } catch (e) {
      setAviso({
        tipo: "error",
        titulo: "No se pudo descargar la factura",
        mensaje: mensajeDeError(e),
      });
    } finally {
      setDescargandoFactura(false);
    }
  }

  // Asocia la melanina al modelo. La cantidad NO se calcula en el
  // navegador: se le pide al backend que la calcule con su
  // CalculadoraService y la registre congelando el costo unitario del
  // material, para que el costo deje de ser un estimado.
  async function asociarMelanina() {
    if (!laminaElegida) {
      setAviso({
        tipo: "error",
        titulo: "Falta elegir la lámina",
        mensaje: "Selecciona qué lámina de melanina se va a usar en el mueble.",
      });
      return;
    }
    setAsociando(true);
    setAviso(null);
    try {
      const respuesta = await modelosService.asociarMelanina(
        registro.idModelo,
        Number(laminaElegida)
      );
      setMelaninaCalculada(respuesta.melanina_calculada || null);
      // Se recargan los materiales asociados para que la cascada pase
      // sola de "sin costo" a "materiales" con el valor real.
      const actualizados = await modelosService.materialesDelModelo(registro.idModelo);
      setMaterialesModelo(Array.isArray(actualizados) ? actualizados : []);
      setAviso({
        tipo: "success",
        titulo: "Melanina asociada",
        mensaje:
          "El sistema calculó la cantidad necesaria y quedó registrada como material del modelo.",
      });
    } catch (e) {
      const detalle = e?.response?.data?.errores?.[0];
      setAviso({
        tipo: "error",
        titulo: "No se pudo asociar la melanina",
        mensaje: detalle || mensajeDeError(e),
      });
    } finally {
      setAsociando(false);
    }
  }

  if (cargando) {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <div className="card">
          <p style={{ color: "var(--tx-sec)" }}>Cargando diseño…</p>
        </div>
      </div>
    );
  }

  if (error || !registro) {
    return (
      <div className="container" style={{ paddingTop: 30 }}>
        <div className="card">
          <Alert
            tipo="error"
            titulo="No se pudo cargar el diseño"
            mensaje={error || "El registro no existe."}
          />
          <div style={{ display: "flex", gap: 10 }}>
            <Button variante="secondary" onClick={() => navigate("/historial")}>
              ← Volver al historial
            </Button>
            <Button variante="primary" onClick={cargarDetalle}>
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const piezas = diseno?.piezas ?? [];
  const melanina = diseno?.melanina ?? null;
  // Las láminas se compran completas, por eso se redondea hacia arriba.
  const laminasAComprar = melanina ? Math.ceil(melanina.laminas_necesarias) : 0;
  const revisado = registro.estado === "Revisado";

  // ---- Las tres fuentes de costo ----
  // 1) Factura: la más autoritativa; trae el total ya congelado más el
  //    estado y el método de pago.
  const costoFacturado = factura ? Number(factura.valor_total || 0) : null;
  // 2) Materiales asociados: costo real que aún no pasó por facturación.
  const costoMateriales = materialesModelo.reduce(
    (total, material) => total + Number(material.costo_utilizado || 0),
    0
  );
  // 3) Costo provisional: solo se calcula con la lámina que el
  //    administrador eligió explícitamente, nunca con un material supuesto.
  const laminaElegidaObj = laminasDisponibles.find(
    (m) => String(m.id_material) === String(laminaElegida)
  );
  const costoUnitarioElegido = laminaElegidaObj
    ? Number(laminaElegidaObj.costo_unitario)
    : null;
  const costoProvisional =
    costoUnitarioElegido != null ? laminasAComprar * costoUnitarioElegido : null;

  // Decide qué panel de costos se pinta: factura > materiales > sinCosto.
  const fuenteCosto = factura
    ? "factura"
    : materialesModelo.length > 0
      ? "materiales"
      : "sinCosto";

  // Características del modelo: se omiten las que no tienen valor para
  // no mostrar filas vacías cuando el carpintero no usó esa opción.
  const caracteristicas = [
    ["Grosor de lámina", modelo?.grosor ? `${modelo.grosor} mm` : null],
    ["Compartimientos", modelo?.compartimientos || null],
    ["Entrepaños", modelo?.entrepanos_compartimientos || null],
    ["Cajones", modelo?.cajones || null],
    ["Puertas", modelo?.puertas ? `${modelo.puertas}${modelo.tipo_puerta ? ` (${modelo.tipo_puerta})` : ""}` : null],
    ["Color / acabado", modelo?.color || null],
    ["Material del fondo", modelo?.material_fondo || null],
    ["Altura del zócalo", modelo?.altura_zocalo ? `${modelo.altura_zocalo} cm` : null],
    ["Altura barra colgadora", modelo?.altura_barra_colgadora ? `${modelo.altura_barra_colgadora} cm` : null],
  ].filter(([, valor]) => valor);

  return (
    <div className="container" style={{ maxWidth: 1000, paddingTop: 30, paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Button variante="secondary" tamano="sm" onClick={() => navigate("/historial")}>
            ← Volver
          </Button>
          <h1 style={{ fontSize: 20, margin: 0 }}>
            Diseño #{registro.id} — {registro.tipo}
          </h1>
          <StatusBadge estado={registro.estado} />
        </div>
        <span className="badge" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
          Solo lectura — no modificable
        </span>
      </div>

      <p style={{ color: "var(--tx-muted)", marginBottom: 20 }}>
        Creado por {registro.creadoPor} · {registro.fecha} · Cliente: {registro.cliente}
      </p>

      {aviso && <Alert tipo={aviso.tipo} titulo={aviso.titulo} mensaje={aviso.mensaje} />}
      {registro.comentario && (
        <Alert tipo="info" titulo="Comentario del registro" mensaje={registro.comentario} />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 24 }}>
        <div>
          <div style={{ marginBottom: 20 }}>
            <Viewer3D piezas={piezas} modelo={modelo} etiqueta="Vista 3D — solo lectura" altura={280} />
          </div>

          {caracteristicas.length > 0 && (
            <>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>Características del modelo</h3>
              <div style={{ background: "var(--bg-alt)", borderRadius: 12, padding: "10px 16px", marginBottom: 20 }}>
                {caracteristicas.map(([etiqueta, valor]) => (
                  <div key={etiqueta} style={filaDato}>
                    <span style={{ color: "var(--tx-sec)" }}>{etiqueta}</span>
                    <strong>{valor}</strong>
                  </div>
                ))}
              </div>
            </>
          )}

          <h3 style={{ fontSize: 15, marginBottom: 10 }}>
            Lista de piezas ({piezas.length} en total)
          </h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Pieza</th><th>Medida (ancho × alto)</th></tr>
              </thead>
              <tbody>
                {piezas.length === 0 && (
                  <tr><td colSpan={2}>No se pudieron calcular las piezas de este modelo.</td></tr>
                )}
                {piezas.map((p, i) => (
                  <tr key={`${p.nombre}-${i}`}>
                    <td>{p.nombre}</td>
                    <td>{numero(p.ancho)} × {numero(p.alto)} cm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* ---------- Fuente 1: factura ya generada ---------- */}
          {fuenteCosto === "factura" && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 15, margin: 0 }}>Factura #{factura.id_factura}</h3>
                <span className="badge" style={colorEstadoPago(factura.estado_pago)}>
                  {factura.estado_pago}
                </span>
              </div>

              <div style={filaDato}>
                <span style={{ color: "var(--tx-sec)" }}>Fecha</span>
                <strong>{formatearFecha(factura.fecha_pago)}</strong>
              </div>
              <div style={filaDato}>
                <span style={{ color: "var(--tx-sec)" }}>Método de pago</span>
                <strong>{factura.metodo_pago || "No especificado"}</strong>
              </div>

              {factura.detalle?.length > 0 && (
                <>
                  <p style={{ fontSize: 12, color: "var(--tx-muted)", margin: "12px 0 4px" }}>
                    Materiales facturados ({factura.detalle.length})
                  </p>
                  {factura.detalle.map((linea) => (
                    <div key={linea.id_detalle} style={filaDato}>
                      <span style={{ color: "var(--tx-sec)", fontSize: 13 }}>
                        {linea.nombre_material}
                        <br />
                        <small style={{ color: "var(--tx-muted)" }}>
                          {numero(linea.cantidad)} × {pesos(linea.precio_unitario)}
                        </small>
                      </span>
                      <strong>{pesos(linea.subtotal)}</strong>
                    </div>
                  ))}
                </>
              )}

              <div style={filaTotal}>
                <span style={{ fontWeight: 700 }}>Total facturado</span>
                <strong style={{ fontSize: 18, color: "var(--info)" }}>
                  {pesos(costoFacturado)}
                </strong>
              </div>

              {facturasDelModelo > 1 && (
                <p style={{ fontSize: 11, color: "var(--tx-muted)", marginTop: 8 }}>
                  Este modelo tiene {facturasDelModelo} facturas; se muestra la más reciente.
                </p>
              )}
            </div>
          )}

          {/* ---------- Fuente 2: materiales asociados, sin facturar ---------- */}
          {fuenteCosto === "materiales" && (
            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Materiales del modelo</h3>
              <p style={{ fontSize: 12, color: "var(--tx-muted)", marginBottom: 10 }}>
                Costo real según los materiales asociados. Todavía sin factura.
              </p>

              {materialesModelo.map((material) => (
                <div key={material.id_modelo_material} style={filaDato}>
                  <span style={{ color: "var(--tx-sec)", fontSize: 13 }}>
                    {material.nombre_material}
                    <br />
                    <small style={{ color: "var(--tx-muted)" }}>
                      {numero(material.cantidad)} {material.unidad_medida || ""}
                    </small>
                  </span>
                  <strong>{pesos(material.costo_utilizado)}</strong>
                </div>
              ))}

              <div style={filaTotal}>
                <span style={{ fontWeight: 700 }}>Costo real de materiales</span>
                <strong style={{ fontSize: 18, color: "var(--info)" }}>
                  {pesos(costoMateriales)}
                </strong>
              </div>

              <p style={{ fontSize: 11, color: "var(--tx-muted)", marginTop: 8 }}>
                Este modelo aún no tiene una factura generada.
              </p>
            </div>
          )}

          {/* ---------- Fuente 3: aún sin costo real ---------- */}
          {fuenteCosto === "sinCosto" && (
            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Costo de la melanina</h3>
              <p style={{ fontSize: 12, color: "var(--tx-muted)", marginBottom: 10 }}>
                Este modelo todavía no tiene materiales registrados.
              </p>

              {/* Estos tres datos SÍ son reales: los calcula el backend. */}
              <div style={filaDato}>
                <span style={{ color: "var(--tx-sec)" }}>Área total de piezas</span>
                <strong>{melanina ? `${numero(melanina.area_total_cm2)} cm²` : "—"}</strong>
              </div>
              <div style={filaDato}>
                <span style={{ color: "var(--tx-sec)" }}>Lámina estándar</span>
                <strong>{melanina ? melanina.lamina_estandar : "—"}</strong>
              </div>
              <div style={filaDato}>
                <span style={{ color: "var(--tx-sec)" }}>Láminas necesarias</span>
                <strong>{melanina ? numero(melanina.laminas_necesarias) : "—"}</strong>
              </div>
              <div style={filaDato}>
                <span style={{ color: "var(--tx-sec)" }}>Láminas a comprar</span>
                <strong>{melanina ? laminasAComprar : "—"}</strong>
              </div>

              <div style={{ marginTop: 16 }}>
                <label
                  htmlFor="lamina"
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--tx-sec)",
                    marginBottom: 6,
                  }}
                >
                  Lámina de melanina a utilizar
                </label>

                {laminasDisponibles.length === 0 ? (
                  <Alert
                    tipo="warning"
                    mensaje="No hay láminas de tipo Tablero en el inventario. Registra una en Materiales para poder calcular el costo."
                  />
                ) : (
                  <select
                    id="lamina"
                    value={laminaElegida}
                    onChange={(e) => setLaminaElegida(e.target.value)}
                    style={{
                      width: "100%",
                      height: 44,
                      padding: "0 12px",
                      fontSize: 14,
                      background: "var(--bg-alt)",
                      border: "1.5px solid var(--border)",
                      borderRadius: "var(--r-md)",
                    }}
                  >
                    <option value="">Selecciona una lámina…</option>
                    {laminasDisponibles.map((m) => (
                      <option key={m.id_material} value={m.id_material}>
                        {m.nombre_material} — {pesos(m.costo_unitario)} / {m.unidad_medida}
                      </option>
                    ))}
                  </select>
                )}

                {costoProvisional != null && (
                  <div style={{ ...filaTotal, marginTop: 14 }}>
                    <span style={{ fontWeight: 700 }}>Costo si se asocia</span>
                    <strong style={{ fontSize: 18, color: "var(--info)" }}>
                      {pesos(costoProvisional)}
                    </strong>
                  </div>
                )}

                <div style={{ marginTop: 14 }}>
                  <Button
                    variante="primary"
                    fullWidth
                    disabled={asociando || !laminaElegida || laminasDisponibles.length === 0}
                    onClick={asociarMelanina}
                  >
                    {asociando ? "Calculando…" : "Asociar melanina calculada por el sistema"}
                  </Button>
                </div>

                <p style={{ fontSize: 11, color: "var(--tx-muted)", marginTop: 8 }}>
                  La cantidad no se calcula en el navegador: el backend la obtiene de su
                  CalculadoraService (área de las piezas ÷ área de la lámina, con 15 % de
                  desperdicio) y congela el costo unitario del material en el modelo.
                </p>
              </div>

              {melaninaCalculada && (
                <div style={{ marginTop: 12 }}>
                  <Alert
                    tipo="success"
                    titulo="Melanina registrada"
                    mensaje={`${numero(melaninaCalculada.laminas_necesarias)} láminas sobre ${melaninaCalculada.lamina_estandar}.`}
                  />
                </div>
              )}
            </div>
          )}

          {/* PDF de la FACTURA (solo cuando ya existe una) */}
          {fuenteCosto === "factura" && (
            <Button
              variante="primary"
              fullWidth
              disabled={descargandoFactura}
              onClick={descargarPdfFactura}
            >
              {descargandoFactura ? "Generando…" : "⬇ PDF de la factura"}
            </Button>
          )}

          {/* PDF del reporte de construcción (piezas a cortar) */}
          <Button variante="secondary" fullWidth onClick={descargarPdf}>
            ⬇ Reporte de construcción (PDF)
          </Button>

          {revisado ? (
            <Alert
              tipo="success"
              titulo="Ya revisado"
              mensaje="Este diseño fue marcado como Revisado por el administrador."
            />
          ) : (
            <Button variante="success" fullWidth disabled={marcando} onClick={marcarRevisado}>
              {marcando ? "Marcando…" : "✓ Marcar como revisado"}
            </Button>
          )}

          <Alert
            tipo="warning"
            titulo="Restricción de rol"
            mensaje="No tienes permiso para modificar este diseño. Solo el carpintero que lo creó puede editarlo."
          />
        </div>
      </div>
    </div>
  );
}