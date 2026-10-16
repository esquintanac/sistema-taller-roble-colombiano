// src/components/ui/FormField.jsx
// Agrupa label + input/select/textarea + mensaje de error.
// Es un componente controlado: recibe value y onChange del padre.
// Los campos tipo "password" añaden un botón de ojo: al hacer clic alterna
// entre ocultar (type="password") y mostrar (type="text") lo que escribe el
// usuario. La visibilidad es estado local; el valor sigue controlado por el
// padre y nunca sale del formulario.

import { useState } from "react";

// Iconos en línea (el proyecto no usa librería de íconos): ojo abierto y
// ojo tachado, trazos estilo Feather sobre stroke="currentColor".
const ICONO_OJO = (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);

const ICONO_OJO_TAPADO = (
    <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
        <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

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
    maxLength,
    // Teclado numérico en móvil sin cambiar el tipo de campo: los campos
    // numéricos de Materiales son texto con este atributo para que maxLength
    // (que solo aplica a text) corte la escritura como en cualquier otro.
    inputMode,
    // Límites numéricos opcionales (solo se usan con tipo="number"): el
    // backend también valida, pero guiar desde el input evita un viaje al
    // servidor que terminaría en error.
    min,
    max,
    paso,
    as = "input", // "input" | "select" | "textarea"
    opciones = [], // usado cuando as === "select"
}) {
    const claseInput = `form-control ${error ? "is-error" : ""}`;
    // Visibilidad de la contraseña: solo aplica a as="input" + tipo="password".
    const esPassword = as === "input" && tipo === "password";
    const [mostrarContrasena, setMostrarContrasena] = useState(false);
    const tipoEfectivo = esPassword && mostrarContrasena ? "text" : tipo;

    const inputComun = (
        <input
            id={name}
            name={name}
            type={tipoEfectivo}
            className={claseInput}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            maxLength={maxLength}
            inputMode={inputMode}
            min={min}
            max={max}
            step={paso}
        />
    );

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

            {/* Campo de contraseña: input + botón de ojo dentro de un
                contenedor relativo (el CSS .campo-password posiciona el
                botón a la derecha y reserva el espacio con padding). */}
            { as === "input" && esPassword && (
                <div className="campo-password">
                    {inputComun}
                    <button
                        type="button"
                        className="campo-ojo"
                        onClick={() => setMostrarContrasena((v) => !v)}
                        aria-label={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                        aria-pressed={mostrarContrasena}
                        title={mostrarContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                        {mostrarContrasena ? ICONO_OJO_TAPADO : ICONO_OJO}
                    </button>
                </div>
            )}

            { as === "input" && !esPassword && inputComun}

            {hint && !error && <span className="field-hint">{hint}</span>}
            {error && <span className="field-error">{error}</span>}
        </div>
    );
}