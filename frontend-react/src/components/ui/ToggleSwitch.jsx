// src/components/ui/ToggleSwitch.jsx
// Interruptor on/off para campos condicionales del formulario de modelo
// (¿lleva cajones?, ¿lleva puertas?, etc. --- RF2).

export default function ToggleSwitch({ checked, onChange, label }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span className="form-label" style={{ margin: 0 }}>{label}</span>
            <label className="toggle">
            <input type="checkbox" checked={checked} onChange={onChange} />
            <span className="toggle-track"></span>
            </label>
            <span style={{ fontSize: 13, color: checked ? "var(--marron-cla)" : "var(--tx-muted)" }}>
                {checked ? "Si" : "No"}
            </span>
        </div>
    );
}