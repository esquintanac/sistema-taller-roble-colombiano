// src/components/ui/Alert.jsx
// Callout de color (error, exito, advertencia, info) reutilizado en
// login, formularios, reporte y restricciones de rol.

export default function Alert({ tipo = "info", titulo, mensaje }) {
  const iconos = { error: "⚠", success: "✓", warning: "ℹ", info: "ℹ" };

  return (
    <div className={`alert alert-${tipo}`} role="alert">
      <span>{iconos[tipo]}</span>
      <div>
        {titulo && <strong style={{ display: "block", marginBottom: 2 }}>{titulo}</strong>}
        {mensaje}
      </div>
    </div>
  );
}