// src/components/ui/Button.jsx
// Botón reutilizable con variantes de estilo, usado en todas las pantallas.

export default function Button({
  variante = "primary",
  tamano = "",
  fullWidth = false,
  tipo = "button",
  onClick,
  disabled = false,
  children,
}) {
  const clases = [
    "btn",
    `btn-${variante}`,
    tamano && `btn-${tamano}`,
    fullWidth && "btn-full",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={tipo} className={clases} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}