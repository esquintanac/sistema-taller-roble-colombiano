// src/components/ui/FormField.jsx
// Agrupa label + input/select/textarea + mensaje de error.
// Es un componente controlado: recibe value y onChange del padre.

export default function FormField ({
    label,
    tipo = "text",
    name,
    value,
    onChange,
    error,
    requerido = false,
    hint,
    placeholder,
    as = "input", // "input" | "select" | "textarea"
    opciones = [], // usado cuando as === "select"
}) {
    const claseInput = 'form-control ${error ? "is-error" : ""}';

    return (
        <div className="form-group">
            <label className="form-label" htmlFor={name}>
                {label} {requerido && <span style={{ color: "var(--error)" }}>*</span>}
            </label>

            { as === "select" && (
                <select id={name} name={name} className={claseInput} value={value} onChange={onChange}>
                    <option value="">Selecciona una opción</option>
                    {opciones.map((op) =>(
                        <option key={op.value} value={op.value}>
                            {op.label}
                        </option>
                    ))}
                </select>
            )}

            { as === "textarea" && (
                <textarea
                id={name}
                name={name}
                className={claseInput}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                rows={4}
                />
            )}

            { as === "input" && (
                <input
                id={name}
                name={name}
                type={tipo}
                className={claseInput}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                />
            )}

            {hint && !error && <span className="field-hint">{hint}</span>}
            {error && <span className="field-error">{error}</span>}
        </div>
    );
}