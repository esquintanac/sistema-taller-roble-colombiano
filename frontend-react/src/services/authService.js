// src/services/authService.js
// Conecta los formularios de login/registro/recuperación con los endpoints
// JWT del backend Django (/api/auth/...).
//
// Nota de seguridad (RNF): el código de 6 dígitos lo genera, lo envía por
// correo y lo valida el BACKEND (VerificacionService). Este módulo nunca
// inventa códigos y, de hecho, ningún token JWT vive en el navegador hasta
// que el backend confirma el código. La sesión "pendiente" solo guarda el
// id de la verificación y datos de pantalla (destino enmascarado, tiempos).
import api from "./api";
import { CLAVES_SESION } from "./clavesSesion";

const CLAVES = {
  // Las tres claves del token viven en clavesSesion.js porque api.js también
  // las necesita (para adjuntar el token y para el refresh). authService
  // importa api.js, así que api.js no puede importar authService: compartir
  // un módulo aparte evita esa dependencia circular.
  ...CLAVES_SESION,
  // Sesión a medio autenticar: credenciales probadas (o formulario de
  // registro validado) a la espera de confirmar el código. NO contiene
  // tokens: solo el id de la verificación y datos para pintar la pantalla.
  pendiente: "trc_pendiente",
};

// Marca de "la sesión se cerró sola" (por inactividad o porque el token
// dejó de ser válido). Vive en sessionStorage, NO en localStorage: es un
// estado de la pestaña actual y no debe sobrevivir a cerrarla.
//
// Para qué sirve: cuando la sesión se cae, `usuario` pasa a null y las
// rutas protegidas redirigen. Con esta marca, ProtectedRoute sabe que el
// destino correcto es /sesion-expirada (explicando al usuario por qué salió
// del sistema) en vez de /login. Sin ella, la app mandaba a /login y la
// pantalla de sesión expirada nunca se veía.
const CLAVE_SESION_EXPIRADA = "trc_sesion_expirada";

// Decodifica el payload de un JWT SIN verificar la firma. La firma la valida
// el backend en cada petición; aquí solo se lee la fecha de expiración para
// no mostrar el sistema como "con sesión" cuando el token ya no sirve.
// Se decodifica a mano para no añadir una librería solo por esto.
function leerPayloadJwt(token) {
  try {
    const partes = String(token).split(".");
    if (partes.length !== 3) return null;

    // El payload viaja en base64url; atob() espera base64 estándar.
    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");

    // atob() devuelve bytes sueltos, así que se rearman como porcentajes y
    // se pasa por decodeURIComponent para que los acentos y la ñ de las
    // claims (por ejemplo el nombre) se lean bien.
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((caracter) => `%${caracter.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join("")
    );

    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Normaliza los nombres de los campos del formulario (apellidos, rol) a
// los que espera el backend (apellido, rol_usuario).
function payloadRegistro(formulario) {
  return {
    nombre: formulario.nombre,
    apellido: formulario.apellidos,
    correo: formulario.correo,
    telefono: formulario.telefono,
    usuario: formulario.usuario,
    contrasena: formulario.contrasena,
    rol_usuario: formulario.rol,
  };
}

const authService = {
  // POST /api/auth/login/ -> valida credenciales y deja la sesión PENDIENTE
  // de verificación: el backend envía el código al correo y NO entrega
  // tokens. La sesión real recién se activa con confirmarCodigo().
  login: async (usuario, contrasena) => {
    const { data } = await api.post("/auth/login/", { usuario, contrasena });
    authService.guardarPendiente(data.verificacion, data.usuario, data.codigo_demo);
    return data;
  },

  // ---------- Registro en dos pasos (RF1 + verificación del correo) ----------

  // POST /api/auth/registro/solicitar/ -> paso 1: valida los datos del
  // formulario (incluida la unicidad) y hace enviar el código de 6 dígitos
  // al correo informado. Si el backend responde 400,
  // error.response.data.errores trae la lista de problemas.
  solicitarRegistro: async (formulario) => {
    const { data } = await api.post(
      "/auth/registro/solicitar/",
      payloadRegistro(formulario)
    );
    return data;
  },

  // POST /api/auth/registro/ -> paso 2: crea el usuario únicamente con el
  // código correcto y consumido. Sin id_verificacion + codigo el backend
  // responde 400: ya no existe registro sin verificación.
  registrar: async (formulario, idVerificacion, codigo) => {
    const payload = {
      ...payloadRegistro(formulario),
      id_verificacion: idVerificacion,
      codigo,
    };
    const { data } = await api.post("/auth/registro/", payload);
    return data;
  },

  // ---------- Recuperación de contraseña ----------

  // POST /api/auth/contrasena/olvidada/ -> pide el enlace de recuperación.
  // El backend responde SIEMPRE lo mismo (no revela si el correo existe).
  // En desarrollo (DEBUG) la respuesta trae además "enlace_demo" con el
  // enlace listo, para probar el flujo sin abrir la terminal del servidor.
  solicitarRecuperacion: async (correo) => {
    const { data } = await api.post("/auth/contrasena/olvidada/", { correo });
    return data;
  },

  // GET /api/auth/contrasena/validar-token/?token=... -> confirma si el
  // enlace de la URL sigue vigente antes de mostrar el formulario.
  validarTokenRecuperacion: async (token) => {
    const { data } = await api.get("/auth/contrasena/validar-token/", {
      params: { token },
    });
    return data;
  },

  // POST /api/auth/contrasena/restablecer/ -> canjea el token de un solo
  // uso por la contraseña nueva. Si el backend responde 400,
  // error.response.data.mensaje explica qué falló (expirado, usado, etc.).
  restablecerContrasena: async (token, contrasena) => {
    const { data } = await api.post("/auth/contrasena/restablecer/", {
      token,
      contrasena,
    });
    return data;
  },

  // GET /api/auth/perfil/ -> valida el token vigente
  perfil: async () => {
    const { data } = await api.get("/auth/perfil/");
    return data;
  },

  guardarSesion: (tokens, usuario) => {
    if (tokens?.access) localStorage.setItem(CLAVES.token, tokens.access);
    if (tokens?.refresh) localStorage.setItem(CLAVES.refresh, tokens.refresh);
    if (usuario) localStorage.setItem(CLAVES.usuario, JSON.stringify(usuario));
  },

  // ---------- Verificación en dos pasos (RNF: seguridad) ----------

  // Guarda la sesión a medio autenticar. NO se guarda ningún token: la
  // verificación vive en el backend (id + expiración + intentos) y los
  // JWT recién llegan al confirmar el código.
  guardarPendiente: (verificacion, usuario, codigoDemo) => {
    const pendiente = {
      idVerificacion: verificacion.id_verificacion,
      destino: verificacion.destino_enmascarado,
      expiraEn: verificacion.expira_en_ms,
      // Instante (epoch ms) a partir del cual el backend aceptará un
      // reenvío: el cooldown de 60 s lo manda el motor del servidor.
      reenviarDisponibleEn:
        Date.now() + (verificacion.reenviar_disponibles_en || 0) * 1000,
      // Solo en desarrollo (DEBUG): el código que el backend envió, para
      // poder probar sin leer la terminal. En producción no existe.
      codigoDemo: codigoDemo || "",
      usuario,
    };
    localStorage.setItem(CLAVES.pendiente, JSON.stringify(pendiente));
    return pendiente;
  },

  // Devuelve la sesión pendiente. Se descarta si no hay id de verificación
  // (p. ej. una pendiente de una versión anterior que guardaba tokens).
  // La expiración NO se recorta aquí: el backend es quien la valida, y
  // dejar el id permite ofrecer "Reenviar código" cuando el plazo venció.
  sesionPendiente: () => {
    const guardado = localStorage.getItem(CLAVES.pendiente);
    if (!guardado) return null;
    try {
      const pendiente = JSON.parse(guardado);
      if (!pendiente?.idVerificacion) {
        authService.descartarPendiente();
        return null;
      }
      return pendiente;
    } catch {
      authService.descartarPendiente();
      return null;
    }
  },

  // POST /api/auth/verificacion/confirmar/ -> valida el código CONTRA EL
  // BACKEND. Devuelve { usuario, tokens } si es correcto; si no, rechaza
  // con error.response.data.mensaje (código incorrecto, expirado o con
  // los intentos agotados).
  confirmarCodigo: async (codigo, idVerificacion) => {
    const id = idVerificacion ?? authService.sesionPendiente()?.idVerificacion;
    if (!id) {
      throw new Error("La sesión de verificación se perdió. Vuelve a iniciar sesión.");
    }
    const { data } = await api.post("/auth/verificacion/confirmar/", {
      id_verificacion: id,
      codigo,
    });
    return data;
  },

  // POST /api/auth/verificacion/reenviar/ -> pide un código nuevo al
  // backend. El cooldown (60 s) lo decide el servidor: si aún no venció,
  // la respuesta trae reenviar_disponibles_en > 0 y NO se envió otro
  // correo. `nombre` solo lo usa el flujo de registro (la cuenta aún no
  // existe y el motor no sabe cómo saludar en el correo).
  reenviarCodigo: async (idVerificacion, nombre) => {
    const id = idVerificacion ?? authService.sesionPendiente()?.idVerificacion;
    if (!id) return null;
    const { data } = await api.post("/auth/verificacion/reenviar/", {
      id_verificacion: id,
      nombre,
    });
    // En el flujo de login la pendiente vive aquí: se refresca con los
    // tiempos nuevos (el id se mantiene estable entre reenvíos).
    const pendiente = authService.sesionPendiente();
    if (pendiente) {
      authService.guardarPendiente(data.verificacion, pendiente.usuario, data.codigo_demo);
    }
    return data;
  },

  descartarPendiente: () => localStorage.removeItem(CLAVES.pendiente),

  limpiarSesion: () => {
    Object.values(CLAVES).forEach((k) => localStorage.removeItem(k));
  },

  // ---------- Estado de la sesión guardada ----------

  // Responde si la sesión almacenada se puede usar. No basta con que exista
  // un token: puede estar vencido (30 min) o ilegible, y en ese caso el
  // sistema no debe mostrarse como "con sesión" solo porque quede el usuario
  // guardado en localStorage.
  //   "activa"   -> hay token y sigue vigente
  //   "vencida"  -> hay token pero ya expiró
  //   "invalido" -> hay token pero no se puede leer
  //   "ausente"  -> no hay token guardado
  estadoDeSesion: () => {
    const token = localStorage.getItem(CLAVES.token);
    if (!token) return "ausente";

    const payload = leerPayloadJwt(token);
    if (!payload) return "invalido";

    // SimpleJWT siempre incluye "exp" (segundos epoch, en UTC).
    if (payload.exp && Date.now() >= payload.exp * 1000) return "vencida";

    return "activa";
  },

  // ---------- Marca de sesión expirada ----------
  // Se centraliza aquí, igual que el resto de claves de sesión, para que la
  // aplicación no acceda a sessionStorage desde varios sitios con la misma
  // cadena repetida.

  marcarSesionExpirada: () => sessionStorage.setItem(CLAVE_SESION_EXPIRADA, "1"),

  limpiarSesionExpirada: () => sessionStorage.removeItem(CLAVE_SESION_EXPIRADA),

  estaSesionExpirada: () => sessionStorage.getItem(CLAVE_SESION_EXPIRADA) === "1",

  estaAutenticado: () => Boolean(localStorage.getItem(CLAVES.token)),

  usuarioGuardado: () => {
    const guardado = localStorage.getItem(CLAVES.usuario);
    return guardado ? JSON.parse(guardado) : null;
  },
};

export default authService;