// src/components/layout/ProtectedRoute.jsx
// Envuelve rutas que requieren sesion activa y, opcionalmente, un rol
// especifico. Redirige el login si no hay sesion, o muestra un aviso
// de acceso restringido si el rol no coincide (RF8).

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, rolRequerido }) {
    const { usuario } = useAuth();

    if (!usuario) {
        return <Navigate to="/login" replace />;
    }

    if (rolRequerido && usuario.rol !== rolRequerido) {
        return (
            <div className="container" style={{ padding: "40px 0" }}>
                <div className="alert alert-error">
                    <strong>Acceso Restringido.</strong> No tienes permiso para ver esta pantalla.
                </div>
            </div>
        );
    }

    return children;
}