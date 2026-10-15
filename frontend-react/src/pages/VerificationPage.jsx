// src/pages/VerificationPage.jsx
// Pantalla del segundo factor de autenticación (RNF de seguridad).
// Solo es accesible cuando el usuario ya validó usuario/contraseña y
// su sesión quedó pendiente de confirmar el código de 6 dígitos que el
// backend envió a su correo.
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import VerificationCodeForm from "../components/auth/VerificationCodeForm";

export default function VerificationPage() {
    const { usuario, usuarioPendiente } = useAuth();

    // Credenciales validadas esperando el código: mientras exista la
    // pendiente, ESTA es la pantalla que toca. Si aquí se mirara primero
    // `usuario`, una sesión anterior guardada en el navegador (localStorage
    // lo comparten todas las pestañas del mismo navegador) redirigiría al
    // panel del usuario viejo sin llegar a pedir el código del login nuevo.
    // (iniciarVerificacion() ya retira esa sesión previa al navegar hasta
    // aquí, pero este orden deja la página a prueba de cualquier resto.)
    if (usuarioPendiente) {
        return (
            <div className="container-sm" style={{ maxWidth: 420, margin: "80px auto" }}>
                <div className="card">
                    <h1 style={{ fontSize: 22 }}>Verificación de seguridad</h1>
                    <VerificationCodeForm />
                </div>
            </div>
        );
    }

    // Sesión YA activa: la verificación se completó y hay que estar en el
    // panel. Al confirmar el código, confirmarSesion() deja
    // usuarioPendiente -> null y usuario -> con su rol, y en el mismo
    // evento se llama navigate("/inicio"), así que en este render ya no
    // queda pendiente. Si la pantalla cayera entonces al caso "sin nada",
    // <Navigate to="/login" /> navegaría EN EL RENDER y se llevaría al
    // usuario al login aun cuando la navegación al panel ya estuviera en
    // curso. Por eso el caso "ya verificado" se resuelve antes que el final.
    if (usuario) return <Navigate to="/inicio" replace />;

    // Sin credenciales validadas y sin sesión: al login.
    return <Navigate to="/login" replace />;
}