// src/services/api.js
// Instancia central de axios apuntando al backend Django.
// Todos los servicios del proyecto reutilizan esta configuracion base.

import axios from "axios";

const api = axios.create({
    baseURL: "https://127.0.0.1:800/api",
    headers: { "Content-Type": "application/json" },
});

export default api;