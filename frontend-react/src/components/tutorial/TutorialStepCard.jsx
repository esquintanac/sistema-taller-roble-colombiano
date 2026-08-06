// src/components/tutorial/TutorialStepCard.jsx
// Muestra un paso individual del tutorial (RNF)

export default function TutorialStepCard({ paso }) {
    return (
       <div style={{ border: "2px solid var(--border)", borderLeft: "4px solid var(--primary)", borderRadius: 12, padding: 22 }}>
        <div style={{ width: 54, height: 54, borderRadius: 12, background: "var(--primary-lt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, marginBottom: 14 }}>
            {paso.icono}
        </div>
        <h2 style={{ fontSize: 18, marginBottom: 10 }}>{paso.titulo}</h2>
        <p style={{ fontSize: 13, color: "var(--tx-sec)", lineHeight: 1.7 }}>{paso.descripcion}</p>
        <div style={{ background: "var(--bg-alt)", border: "1px solid var(--border)", borderRadius: 8, padding: 14, marginTop: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: "var(--marron-cla)", marginBottom: 4 }}>Consejo</p>
            <p style={{ fontSize: 13, color: "var(--tx-sec)" }}>{paso.consejo}</p>
        </div>
       </div> 
    );
}