// src/services/authService.js
// Conecta los formularios de login/registro con los endpoints JWT
// del backend Django (/api/auth/login/ y /api/auth/registro/).
import api from "./api";

const CLAVES = {
  token: "trc_token",
  refresh: "trc_refresh",
  usuario: "trc_usuario",
  // Sesion a medio autenticar: el usuario ya probó sus credenciales
  // pero todavia no confirma el codigo SMS (segundo factor, RNF).
  pendiente: "trc_pendiente",
};

// Vigencia del codigo SMS simulado: 5 minutos, igual que el prototipo HTML
export const VIGENCIA_CODIGO_SEGUNDOS = 300;

// Genera el codigo de 6 digitos que simula el envio por SMS.
// En produccion este valor lo generaria el backend y nunca viajaria
// al navegador; aqui se guarda localmente solo con fines academicos.
function generarCodigoDemo() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

const authService = {
  // POST /api/auth/login/ -> valida credenciales y deja la sesion
  // PENDIENTE de verificacion por SMS. La sesion real recien se activa
  // cuando el usuario confirma el codigo (confirmarSesion()).
  login: async (usuario, contrasena) => {
    const { data } = await api.post("/auth/login/", { usuario, contrasena });
    authService.guardarPendiente(data.tokens, data.usuario);
    return data;
  },

  // POST /api/auth/registro/ -> normaliza los nombres de campos que
  // espera el backend (apellido, rol_usuario).
  registrar: async (formulario) => {
    const payload = {
      nombre: formulario.nombre,
      apellido: formulario.apellidos,
      correo: formulario.correo,
      telefono: formulario.telefono,
      usuario: formulario.usuario,
      contrasena: formulario.contrasena,
      rol_usuario: formulario.rol,
    };
    const { data } = await api.post("/auth/registro/", payload);
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

  // ---------- Verificacion en dos pasos (RNF: seguridad) ----------

  // Guarda la sesion a medio autenticar junto con el codigo SMS
  // simulado y su hora de expiracion (5 minutos).
  guardarPendiente: (tokens, usuario) => {
    const pendiente = {
      tokens,
      usuario,
      codigo: generarCodigoDemo(),
      expiraEn: Date.now() + VIGENCIA_CODIGO_SEGUNDOS * 1000,
    };
    localStorage.setItem(CLAVES.pendiente, JSON.stringify(pendiente));
    return pendiente;
  },

  // Devuelve la sesion pendiente. Si el codigo ya vencio, la descarta
  // y retorna null para forzar un nuevo inicio de sesion.
  sesionPendiente: () => {
    const guardado = localStorage.getItem(CLAVES.pendiente);
    if (!guardado) return null;
    try {
      const pendiente = JSON.parse(guardado);
      if (!pendiente.expiraEn || Date.now() > pendiente.expiraEn) {
        authService.descartarPendiente();
        return null;
      }
      return pendiente;
    } catch {
      authService.descartarPendiente();
      return null;
    }
  },

  // Compara el codigo ingresado con el enviado "por SMS".
  // Devuelve true solo si coincide y aun esta vigente.
  verificarCodigo: (codigoIngresado) => {
    const pendiente = authService.sesionPendiente();
    if (!pendiente) return false;
    return String(codigoIngresado).trim() === String(pendiente.codigo);
  },

  // Reenvia el codigo: genera uno nuevo y reinicia el temporizador.
  reenviarCodigo: () => {
    const pendiente = authService.sesionPendiente();
    if (!pendiente) return null;
    return authService.guardarPendiente(pendiente.tokens, pendiente.usuario);
  },

  // Promueve la sesion pendiente a sesion activa. Se llama unicamente
  // despues de verificar el codigo correctamente.
  confirmarSesion: () => {
    const pendiente = authService.sesionPendiente();
    if (!pendiente) return null;
    authService.guardarSesion(pendiente.tokens, pendiente.usuario);
    authService.descartarPendiente();
    return pendiente.usuario;
  },

  descartarPendiente: () => localStorage.removeItem(CLAVES.pendiente),

  limpiarSesion: () => {
    Object.values(CLAVES).forEach((k) => localStorage.removeItem(k));
  },

  estaAutenticado: () => Boolean(localStorage.getItem(CLAVES.token)),

  usuarioGuardado: () => {
    const guardado = localStorage.getItem(CLAVES.usuario);
    return guardado ? JSON.parse(guardado) : null;
  },
};

export default authService;