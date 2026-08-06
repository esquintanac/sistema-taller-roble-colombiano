// src/components/ui/Stepper.jsx
// Barra de progreso de 4 pasos: Datos -> Validar -> Diseño 3D -> Reporte
// Usado en las 4 pantallas del flujo del carpintero (RF2 a RF5).

const PASOS = ["Datos", "Validar", "Diseño 3D", "Reporte"];

export default function Stepper({ pasoActual }) {
    return (
        <nav className="stepper" aria-label="Progreso del modelo">
            {PASOS.map((etiqueta, i) => {
                const numero = i + 1;
                const estado = numero < pasoActual ? "done" : numero === pasoActual ? "active": "";
                return (
                    <div key={etiqueta} style={{ display: "flex", alignItems: "center", flex: numero < PASOS.length ? 1 : "none" }}>
                        <div className={'step ${estado}'} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div className="step-num">{estado === "done" ? "✓": numero}</div>
                            <span style={{ fontSize: 13 }}>{etiqueta}</span>
                        </div>
                        {numero < PASOS.length && (
                            <div className={'step-line ${numero < pasoActual ? "done": ""}'}></div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}