// src/pages/RecuperarContrasenaPage.jsx
// Paso 1 de la recuperación de contraseña: el usuario escribe su correo y
// el backend envía un enlace de un solo uso (vence en 30 minutos).
// Por seguridad, el backend responde SIEMPRE el mismo mensaje exista o no
// la cuenta, así que esta pantalla también se ve igual en ambos casos.
import { useState } from "react";
import { Link } from "react-router-dom";
import authService from "../services/authService";
import FormField from "../components/ui/FormField";
import Button from "../components/ui/Button";
import Alert from "../components/ui/Alert";

const PATRON_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function RecuperarContrasenaPage() {
  const [correo, setCorreo] = useState("");
  const [errorCorreo, setErrorCorreo] = useState("");
  const [errorGlobal, setErrorGlobal] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [enlaceDemo, setEnlaceDemo] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorGlobal("");
    setErrorCorreo("");

    const correoLimpio = correo.trim();
    if (!correoLimpio) {
      setErrorCorreo("Este campo es obligatorio.");
      return;
    }
    if (!PATRON_CORREO.test(correoLimpio)) {
      setErrorCorreo("El correo electrónico no tiene un formato válido.");
      return;
    }

    setCargando(true);
    try {
      const data = await authService.solicitarRecuperacion(correoLimpio);
      setEnlaceDemo(data.enlace_demo || "");
      setEnviado(true);
    } catch (error) {
      setErrorGlobal(
        error?.response?.data?.mensaje ||
          "No fue posible procesar la solicitud. Inténtalo de nuevo."
      );
    } finally {
      setCargando(false);
    }
  }

  // El backend devuelve la URL completa (http://localhost:5173/restablecer/…);
  // para navegar dentro de React solo se conserva la ruta.
  const rutaEnlaceDemo = enlaceDemo.replace(/^https?:\/\/[^/]+/, "");

  return (
    <div className="container-sm" style={{ maxWidth: 480, margin: "60px auto" }}>
      <h1>Recuperar contraseña</h1>
      <div className="card">
        {enviado ? (
          <>
            <Alert
              tipo="success"
              titulo="Solicitud recibida"
              mensaje="Si existe una cuenta asociada a ese correo, recibirás un mensaje con el enlace para restablecer tu contraseña. El enlace vence en 30 minutos y solo sirve una vez."
            />

            {enlaceDemo && (
              <>
                <Alert
                  tipo="info"
                  titulo="Modo demostración"
                  mensaje="El servidor de correo solo imprime los mensajes en su terminal. Puedes abrir el enlace directamente desde aquí:"
                />
                <Link className="btn btn-primary btn-full" to={rutaEnlaceDemo}>
                  Abrir enlace de recuperación
                </Link>
              </>
            )}

            <Link className="btn btn-secondary btn-full" to="/login">
              Volver a iniciar sesión
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <p style={{ color: "var(--tx-sec)", marginBottom: 16 }}>
              Escribe el correo con el que te registraste y te enviaremos un
              enlace para elegir una contraseña nueva.
            </p>

            {errorGlobal && <Alert tipo="error" mensaje={errorGlobal} />}

            <FormField
              label="Correo electrónico"
              name="correo"
              tipo="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              error={errorCorreo}
              requerido
              placeholder="tucorreo@ejemplo.com"
            />

            <Link to="/login" className="auth-forgot">
              Volver a iniciar sesión
            </Link>

            <Button tipo="submit" variante="primary" tamano="lg" fullWidth>
              {cargando ? "Enviando…" : "Enviar enlace"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}