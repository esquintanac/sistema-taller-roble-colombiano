// src/services/clavesSesion.js
// Claves de almacenamiento de la sesión, en un módulo propio y sin
// dependencias.
//
// Viven aquí y no dentro de authService.js por un motivo concreto: api.js
// también necesita la clave del token, y authService.js importa api.js. Si
// api.js importara authService.js se crearía una dependencia circular (cada
// uno esperando al otro al cargarse). Aislar las claves deja a los dos
// módulos independientes entre sí.

export const CLAVES_SESION = {
  token: "trc_token",
  refresh: "trc_refresh",
  usuario: "trc_usuario",
};