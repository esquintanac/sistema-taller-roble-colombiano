// src/services/api.js
// Instancia central de axios apuntando al backend Django.
// Todos los servicios del proyecto reutilizan esta configuracion base.

import axios from "axios";

const api = axios.create({
    // Backend Django en desarrollo: http por defecto en el puerto 8000,
    // y la API montada bajo el prefijo /api (ver backend/config/urls.py).
    baseURL: "http://127.0.0.1:8000/api",
    headers: { "Content-Type": "application/json" },
});

// Interceptor de solicitud: adjunta el token JWT guardado tras el
// login para que los endpoints protegidos (@requiere_autenticacion)
// acepten la peticion. El backend espera "Authorization: Bearer <token>".
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("trc_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Interceptor de respuesta: si el backend responde 401 (token ausente,
// vencido o invalido), limpia la sesion guardada y avisa al AuthContext
// disparando el evento "sesion-expirada". Evita que el usuario quede
// atrapado en pantallas con datos que ya no puede consultar.
api.interceptors.response.use(
    (respuesta) => respuesta,
    (error) => {
        const esLogin = error.config?.url?.includes("/auth/login/");

        if (error.response && error.response.status === 401 && !esLogin) {
            localStorage.removeItem("trc_token");
            localStorage.removeItem("trc_refresh");
            localStorage.removeItem("trc_usuario");
            window.dispatchEvent(new Event("sesion-expirada"));
        }
        return Promise.reject(error);
    }
);

export default api;
