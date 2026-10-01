// src/pages/VerificationPage.jsx
// Pantalla del segundo factor de autenticación (RNF de seguridad).
// Solo es accesible cuando el usuario ya validó usuario/contraseña y
// su sesión quedó pendiente de confirmar el código enviado por SMS.
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VerificationCodeForm from "../components/auth/VerificationCodeForm";

export default function VerificationPage() {
    const { usuario, usuarioPendiente } = useAuth();

    // Sesión YA activa: la verificación se completó y hay que estar en el
    // panel. Esta comprobación va PRIMERO a propósito.
    //
    // Al confirmar el código, confirmarSesion() deja usuario=null ->
    // usuario con su rol y usuarioPendiente -> null, y en el mismo
    // evento se llama navigate("/inicio"). Si esta pantalla solo mirara
    // usuarioPendiente, durante ese render devolvería
    // <Navigate to="/login" />, que navega EN EL RENDER y se llevaría al
    // usuario al login aun cuando la navegación al panel ya estuviera en
    // curso. Por eso el caso "ya verificado" se resuelve antes.
    if (usuario) return <Navigate to="/inicio" replace />;

    // Sin credenciales validadas no hay nada que verificar: al login.
    if (!usuarioPendiente) return <Navigate to="/login" replace />;

    return (
        <div className="container-sm" style={{ maxWidth: 420, margin: "80px auto" }}>
            <div className="card">
                <h1 style={{ fontSize: 22 }}>Verificación de seguridad</h1>
                <VerificationCodeForm />
            </div>
        </div>
    );
}