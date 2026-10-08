// src/components/layout/ProtectedRoute.jsx
// Envuelve rutas que requieren sesion activa y, opcionalmente, un rol
// especifico. Redirige el login si no hay sesion, o muestra un aviso
// de acceso restringido si el rol no coincide (RF8).

import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ children, rolRequerido }) {
    const { usuario, sesionExpirada } = useAuth();

    if (!usuario) {
        // El destino depende de POR QUÉ no hay usuario:
        //  - sesionExpirada = true -> la sesión se cayó sola (inactividad o
        //    401), así que corresponde /sesion-expirada para explicarlo.
        //  - sesionExpirada = false -> simplemente no hay sesión (el usuario
        //    entró directo a la URL), así que va a /login.
        //
        // Esto es lo que faltaba: antes SIEMPRE se iba a /login. El temporizador
        // de inactividad sí navegaba a /sesion-expirada, pero esa navegación
        // es una transición de baja prioridad en React Router, mientras que
        // vaciar `usuario` es un update urgente: React aplicaba primero el
        // urgente, ProtectedRoute redirigía a /login y el usuario nunca veía
        // la pantalla de sesión expirada. Decidir aquí elimina esa carrera.
        return <Navigate to={sesionExpirada ? "/sesion-expirada" : "/login"} replace />;
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