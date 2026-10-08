// src/services/api.js
// Instancia central de axios apuntando al backend Django.
// Todos los servicios del proyecto reutilizan esta configuracion base.

import axios from "axios";
import { CLAVES_SESION } from "./clavesSesion";

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
        const token = localStorage.getItem(CLAVES_SESION.token);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ---------- Renovacion automatica del token (refresh) ----------
//
// El access token vive 30 minutos (SIMPLE_JWT en backend/config/settings.py)
// y el refresh, 1 dia. Cuando el access vence, en lugar de expulsar al
// usuario se canjea el refresh por un access nuevo y se reintenta la peticion
// original. Asi, trabajar 35 minutos seguidos ya no cuesta el modelo que se
// estaba creando en ese momento.

/**
 * Canjea el refresh token por un access nuevo.
 * Devuelve el access nuevo, o null si no se pudo renovar (no hay refresh
 * guardado, o el backend lo rechazo porque ya vencio su dia de vigencia).
 */
export async function refrescarSesion() {
    const refresh = localStorage.getItem(CLAVES_SESION.refresh);
    if (!refresh) return null;

    try {
        const { data } = await api.post("/auth/refresh/", { refresh });
        if (!data?.access) return null;
        localStorage.setItem(CLAVES_SESION.token, data.access);
        return data.access;
    } catch {
        // Se devuelve null en vez de propagar el error: quien decide que
        // hacer cuando NO se puede renovar es el interceptor, no esta funcion.
        return null;
    }
}

// Concurrencia: es normal que varias peticiones fallen con 401 a la vez (el
// detalle del administrador, por ejemplo, pide diseno, materiales y facturas
// en paralelo). Con esta guarda se hace UN solo canje y las demas esperan ese
// mismo resultado. Sin ella se lanzarian varios refresh a la vez y, con
// rotacion de tokens activada, cada uno invalidaria al anterior.
let refrescoEnCurso = null;

function refrescarCompartido() {
    if (!refrescoEnCurso) {
        refrescoEnCurso = refrescarSesion().finally(() => {
            refrescoEnCurso = null;
        });
    }
    return refrescoEnCurso;
}

// Descarta la sesion guardada. Se centraliza aqui, y no en authService, para
// que el interceptor no dependa de ese modulo (que a su vez importa este).
function olvidarSesion() {
    localStorage.removeItem(CLAVES_SESION.token);
    localStorage.removeItem(CLAVES_SESION.refresh);
    localStorage.removeItem(CLAVES_SESION.usuario);
}

// Interceptor de respuesta: ante un 401 intenta renovar el token y reintentar
// la peticion original. Solo si eso no es posible cierra la sesion y avisa al
// AuthContext con el evento "sesion-expirada", que lleva al usuario a
// /sesion-expirada.
api.interceptors.response.use(
    (respuesta) => respuesta,
    async (error) => {
        const config = error.config;

        // Sin configuracion no hay peticion que reintentar (por ejemplo un
        // fallo de red antes de que la solicitud llegue a formarse).
        if (!config) return Promise.reject(error);

        const url = config.url || "";

        // El login y el propio refresh quedan fuera del reintento: un 401 ahi
        // significa de verdad que las credenciales (o el refresh) ya no
        // sirven. Procesar el refresh seria ademas un bucle infinito, porque
        // intentaria renovar justo lo que acaba de fallar.
        const esLogin = url.includes("/auth/login/");
        const esRefresh = url.includes("/auth/refresh/");
        if (esLogin || esRefresh) return Promise.reject(error);

        const esErrorDeToken = error.response?.status === 401;

        // Primer 401: se intenta renovar y reintentar UNA sola vez (la marca
        // _reintentado evita un bucle si el token nuevo tampoco sirviera).
        if (esErrorDeToken && !config._reintentado) {
            config._reintentado = true;
            const accessNuevo = await refrescarCompartido();

            if (accessNuevo) {
                config.headers = config.headers ?? {};
                config.headers.Authorization = `Bearer ${accessNuevo}`;
                return api(config);
            }
        }

        // Si se llega aqui es que no se pudo renovar, o que el reintento
        // tambien fallo: la sesion ya no se puede recuperar.
        if (esErrorDeToken) {
            olvidarSesion();
            window.dispatchEvent(new Event("sesion-expirada"));
        }

        return Promise.reject(error);
    }
);

export default api;
