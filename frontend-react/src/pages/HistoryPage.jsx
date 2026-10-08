// src/pages/HistoryPage.jsx
// Historial de diseños (RF8, HU-03): listado de SOLO LECTURA con todos
// los modelos registrados por los carpinteros. Consume el endpoint real
// GET /api/historial/ (rol Administrador), que devuelve cada registro
// ya enriquecido con JOIN (nombre del carpintero, del cliente y medidas).
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../components/ui/DataTable";
import StatusBadge from "../components/ui/StatusBadge";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";
import historialService, { mapearRegistro } from "../services/historialService";
import { mensajeDeError } from "../utils/descargas";
import Spinner from "../components/ui/Spinner";
import StatCard from "../components/ui/StatCard";

const COLUMNAS = [
  { key: "id", label: "ID" },
  { key: "creadoPor", label: "Creado por" },
  { key: "tipo", label: "Tipo" },
  { key: "medidas", label: "Medidas (Al×An×L cm)" },
  { key: "cliente", label: "Cliente" },
  { key: "fecha", label: "Fecha" },
  { key: "estado", label: "Estado", render: (f) => <StatusBadge estado={f.estado} /> },
];

const FILTROS = ["Todos", "Nuevo", "Revisado"];

// Estilo compartido por el buscador y los botones de filtro.
const estiloInput = {
  height: 44,
  padding: "0 14px",
  fontSize: 14,
  background: "var(--surface)",
  border: "1.5px solid var(--border)",
  borderRadius: "var(--r-md)",
  width: "100%",
};

export default function HistoryPage() {
  const navigate = useNavigate();
  const [registros, setRegistros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("Todos");

  async function cargarHistorial() {
    setCargando(true);
    setError("");
    try {
      const datos = await historialService.listar();
      setRegistros(datos.map(mapearRegistro));
    } catch (e) {
      setError(mensajeDeError(e, "el historial"));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarHistorial();
    // Se recarga solo al montar la pantalla: el historial no depende de
    // otros parámetros de la ruta.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // El backend devuelve el historial completo (sin paginación), así que
  // la búsqueda y el filtro por estado se resuelven en el cliente.
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return registros.filter((registro) => {
      const coincideEstado = filtro === "Todos" || registro.estado === filtro;
      const coincideTexto =
        texto === "" ||
        [registro.id, registro.creadoPor, registro.cliente, registro.tipo, registro.medidas].some(
          (valor) => String(valor).toLowerCase().includes(texto)
        );
      return coincideEstado && coincideTexto;
    });
  }, [registros, busqueda, filtro]);

  const pendientes = registros.filter((registro) => registro.estado !== "Revisado").length;
  const revisados = registros.length - pendientes;

  return (
    <div className="container" style={{ paddingTop: 30, paddingBottom: 40 }}>
      <h1>Historial de diseños</h1>
      <p style={{ color: "var(--tx-sec)", marginBottom: 18 }}>
        Solo lectura — no se pueden modificar los diseños
      </p>

      {cargando ? (
        <div className="card">
          <Spinner texto="Cargando historial…" />
        </div>
      ) : error ? (
        <div className="card">
          <Alert tipo="error" titulo="No se pudo cargar el historial" mensaje={error} />
          <Button variante="secondary" onClick={cargarHistorial}>
            Reintentar
          </Button>
        </div>
      ) : (
        <>
          {/* Indicadores del historial. Salen de la lista ya cargada: sin
              llamadas extra. */}
          <div className="stats-grid">
            <StatCard icono="🗂️" etiqueta="Diseños totales" valor={registros.length} />
            <StatCard icono="⏳" etiqueta="Pendientes de revisión" valor={pendientes} tono="aviso" />
            <StatCard icono="✅" etiqueta="Revisados" valor={revisados} tono="exito" />
            <StatCard
              icono="🔎"
              etiqueta="Mostrando"
              valor={filtrados.length}
              detalle={
                filtrados.length !== registros.length
                  ? "con la búsqueda o el filtro actual"
                  : "sin filtros aplicados"
              }
            />
          </div>

          <div className="card" style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por ID, carpintero, cliente, tipo o medidas…"
                aria-label="Buscar en el historial"
                style={{ ...estiloInput, flex: "1 1 260px" }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                {FILTROS.map((opcion) => (
                  <Button
                    key={opcion}
                    tamano="sm"
                    variante={filtro === opcion ? "primary" : "secondary"}
                    onClick={() => setFiltro(opcion)}
                  >
                    {opcion}
                  </Button>
                ))}
              </div>
            </div>
            <p style={{ fontSize: 12, color: "var(--tx-muted)", marginTop: 10 }}>
              {registros.length} diseño(s) en total · {pendientes} pendiente(s) de revisión
              {filtrados.length !== registros.length && ` · mostrando ${filtrados.length}`}
            </p>
          </div>

          <div className="card">
            <DataTable
              columnas={COLUMNAS}
              datos={filtrados}
              tituloVacio="No hay diseños que mostrar"
              mensajeVacio="Prueba con otra búsqueda o cambia el filtro de estado."
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
        </>
      )}
    </div>
  );
}