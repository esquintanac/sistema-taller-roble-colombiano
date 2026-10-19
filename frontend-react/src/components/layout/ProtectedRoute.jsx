// src/components/layout/ProtectedRoute.jsx
// Envuelve rutas que requieren sesion activa y, opcionalmente, un rol
// especifico. Redirige al login si no hay sesion; si el rol no coincide
// (RF8) redirige al panel de inicio: es una decision de ruta, no el
// resultado de una accion, asi que no se abre una ventana emergente.

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
        // Acceso restringido: no es un resultado de operación sino una
        // decisión de rol, así que se vuelve al panel de inicio sin
        // interrumpir con una ventana emergente.
        return <Navigate to="/inicio" replace />;
    }

    return children;
}