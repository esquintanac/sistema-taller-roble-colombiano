// src/components/ui/SelectableCard.jsx
// Tarjeta clicable reutilizada tanto para tipo de modelo (RF2) como
// para selección de rol en el registro (RF1).

export default function SelectableCard({ icono, nombre, seleccionado, onClick }) {
  return (
    <div
      className={`sel-card ${seleccionado ? "active" : ""}`}
      onClick={onClick}
      role="radio"
      aria-checked={seleccionado}
      tabIndex={0}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
    >
      <div style={{ fontSize: 24, marginBottom: 4 }}>{icono}</div>
      <div style={{ fontWeight: 700, fontSize: 13 }}>{nombre}</div>
    </div>
  );
}