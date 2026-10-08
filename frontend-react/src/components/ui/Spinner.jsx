// src/components/ui/Spinner.jsx
// Indicador de carga. Antes cada pantalla escribía su propio "Cargando..."
// suelto, lo que dejaba pantallas a medio cargar con un texto plano sin
// ninguna señal visual de que algo está produciendo.

export default function Spinner({ texto = "Cargando…", className = "" }) {
  return (
    // role="status" hace que un lector de pantalla anuncie el texto al
    // aparecer, en vez de dejarlo como contenido silencioso.
    <div className={`loading ${className}`.trim()} role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{texto}</span>
    </div>
  );
}