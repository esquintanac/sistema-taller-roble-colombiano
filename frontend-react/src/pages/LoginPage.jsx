import { Link } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";

export default function LoginPage() {
    return (
        <div className="container-sm" style={{ maxWidth: 420, margin: "80px auto" }}>
            <h1>Iniciar Sesión</h1>
            <p style={{ color: "var(--tx-sec)", marginBottom: 20 }}>
                Ingresa tus credenciales para continuar
            </p>
            <div className="card">
                <LoginForm />
            </div>
            <p style={{ textAlign: "center", marginTop: 14 }}>
                ¿No tienes cuenta? <Link to="/registro">Registrate aqui</Link>
            </p>
        </div>
    );
}