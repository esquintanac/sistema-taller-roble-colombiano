// src/components/tutorial/TutorialStepCard.jsx
// Muestra un paso individual del tutorial (RNF)
// El campo "pantalla" es opcional: si existe, indica dónde encontrar la
// acción descrita (ruta o recorrido desde el panel), para que el usuario
// no tenga que adivinar en qué parte del sistema vive cada cosa.

export default function TutorialStepCard({ paso }) {
    return (
       <div style={{ border: "2px solid var(--border)", borderLeft: "4px solid var(--primary)", borderRadius: 12, padding: 22 }}>
        <div style={{ width: 54, height: 54, borderRadius: 12, background: "var(--primary-lt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 14 }}>
            {paso.icono}
        </div>
        <h2 style={{ fontSize: 18, marginBottom: 6 }}>{paso.titulo}</h2>
        {paso.pantalla && (
            <p style={{ fontSize: 12, color: "var(--tx-muted)", margin: "0 0 8px" }}>
                <strong style={{ color: "var(--marron-cla)" }}>Pantalla:</strong> {paso.pantalla}
            </p>
        )}
        <p style={{ fontSize: 13, color: "var(--tx-sec)", lineHeight: 1.7 }}>{paso.descripcion}</p>
        <div style={{ background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, marginTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--marron-cla)", marginBottom: 4 }}>Consejo</p>
            <p style={{ fontSize: 13, color: "var(--tx-sec)" }}>{paso.consejo}</p>
        </div>
       </div> 
    );
}