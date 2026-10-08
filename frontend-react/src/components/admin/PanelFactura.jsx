// src/components/admin/PanelFactura.jsx
// Panel lateral con el detalle de una factura: encabezado, materiales
// facturados y total.
//
// Va en su propio archivo (y no dentro de FacturasPage) porque es un bloque
// grande con su propio estado de carga; así cada archivo sigue siendo
// legible y se puede reutilizar en otra pantalla.

import Button from "../ui/Button";
import Spinner from "../ui/Spinner";
import { formatearFecha } from "../../services/historialService";
import { aDolares, numero, pesos } from "../../utils/descargas";

const estiloFilaDato = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  padding: "7px 0",
  borderBottom: "1px solid var(--border)",
  fontSize: 13,
};

export default function PanelFactura({ detalle, cargando, descargando, onDescargar, tasa }) {
  // Todavía no se ha elegido ninguna factura.
  if (!detalle && !cargando) {
    return (
      <>
        <h3>Detalle de la factura</h3>
        <p style={{ color: "var(--tx-muted)", fontSize: 13 }}>
          Pulsa "Ver detalle" en una fila para ver los materiales facturados y el total
          desglosado.
        </p>
      </>
    );
  }

  if (cargando) return <Spinner texto="Cargando factura…" />;
  if (!detalle) return null;

  const equivalente = aDolares(detalle.valor_total, tasa);

  return (
    <>
      <h3>Factura #{detalle.id_factura}</h3>
      <span
        className={`badge ${
          detalle.estado_pago === "Pendiente" ? "badge-pendiente" : "badge-pagada"
        }`}
      >
        {detalle.estado_pago}
      </span>

      <div style={{ marginTop: 12 }}>
        <div style={estiloFilaDato}>
          <span>Cliente</span>
          <strong>{detalle.cliente}</strong>
        </div>
        <div style={estiloFilaDato}>
          <span>Modelo</span>
          <strong>{detalle.nombre_modelo}</strong>
        </div>
        <div style={estiloFilaDato}>
          <span>Fecha</span>
          <strong>{formatearFecha(detalle.fecha_pago)}</strong>
        </div>
        <div style={estiloFilaDato}>
          <span>Método</span>
          <strong>{detalle.metodo_pago}</strong>
        </div>
      </div>

      <h4 style={{ margin: "16px 0 8px", fontSize: 14 }}>Materiales facturados</h4>

      {detalle.detalle?.length ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {detalle.detalle.map((linea) => (
            <li
              key={linea.id_detalle}
              style={{ fontSize: 13, padding: "7px 0", borderBottom: "1px solid var(--border)" }}
            >
              <strong>{linea.nombre_material}</strong>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--tx-sec)",
                  marginTop: 2,
                }}
              >
                <span>
                  {numero(linea.cantidad)} × {pesos(linea.precio_unitario)}
                </span>
                <strong>{pesos(linea.subtotal)}</strong>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: 13, color: "var(--tx-muted)" }}>
          Esta factura se generó sin líneas de material.
        </p>
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          paddingTop: 12,
          marginTop: 6,
          borderTop: "2px solid var(--border-dk)",
        }}
      >
        <strong>Total</strong>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--info)" }}>
            {pesos(detalle.valor_total)}
          </div>
          {equivalente && (
            <div style={{ fontSize: 12, color: "var(--tx-muted)" }}>{equivalente}</div>
          )}
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <Button variante="primary" fullWidth disabled={descargando} onClick={onDescargar}>
          {descargando ? "Generando…" : "⬇ Descargar PDF"}
        </Button>
      </div>
    </>
  );
}