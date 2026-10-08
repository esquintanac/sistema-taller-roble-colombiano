// src/components/ui/StatCard.jsx
// Tarjeta de indicador. Resume un dato que la pantalla ya tiene calculado
// (un conteo de una lista, el costo de un diseño) para que no haya que
// leer los números uno por uno.
//
// NO hace peticiones: recibe valores ya resueltos. Así se puede usar en
// cualquier pantalla sin(add) llamadas extra ni estados de carga propios.

export default function StatCard({ icono, etiqueta, valor, detalle, tono = "neutro" }) {
  return (
    <div className={`stat-card stat-card-${tono}`}>
      {icono && (
        <span className="stat-card-icono" aria-hidden="true">
          {icono}
        </span>
      )}
      <div className="stat-card-cuerpo">
        <div className="stat-card-valor">{valor}</div>
        <div className="stat-card-etiqueta">{etiqueta}</div>
        {detalle && <div className="stat-card-detalle">{detalle}</div>}
      </div>
    </div>
  );
}