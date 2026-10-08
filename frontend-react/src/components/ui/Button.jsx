// src/components/ui/Button.jsx
// Botón reutilizable con variantes de estilo, usado en todas las pantallas.

export default function Button({
  variante = "primary",
  tamano = "",
  fullWidth = false,
  tipo = "button",
  onClick,
  disabled = false,
  ref,
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
    // La ref se reenvía al <button> real. En React 19 "ref" llega como una
    // prop normal, así que basta con recibirla y pasarla; sin esto, quien
    // necesite enfocar el botón (el aviso de sesión, por ejemplo) recibiría
    // una ref siempre vacía.
    <button ref={ref} type={tipo} className={clases} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}