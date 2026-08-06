// src/components/tutorial/TutorialProgressBar.jsx
export default function TutorialProgressBar({ pasoActual, totalPasos }) {
  const porcentaje = Math.round((pasoActual / totalPasos) * 100);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <span style={{ fontSize: 13 }}>Paso <strong>{pasoActual} de {totalPasos}</strong></span>
      <div style={{ flex: 1, height: 8, background: "var(--border)", borderRadius: 999, overflow: "hidden" }}>
        <div style={{ width: `${porcentaje}%`, height: "100%", background: "var(--primary)", transition: ".4s" }}></div>
      </div>
      <span style={{ fontSize: 12, color: "var(--tx-muted)" }}>{porcentaje}%</span>
    </div>
  );
}