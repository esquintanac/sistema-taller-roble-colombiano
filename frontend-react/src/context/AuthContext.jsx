// src/context/AuthContext.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authService from "../services/authService";
// refrescarSesion se usa al pulsar "Extender sesión": además de reiniciar el
// plazo de inactividad, conviene que el JWT se renueve en ese momento.
import { refrescarSesion } from "../services/api";

const AuthContext = createContext(null);

// RNF (cierre de sesión por inactividad): si el usuario deja de interactuar
// con el sistema durante 30 minutos, la sesión se cierra sola y se lleva a
// la pantalla /sesion-expirada. Se usa el mismo valor que la vigencia del
// access token del backend (SIMPLE_JWT.ACCESS_TOKEN_LIFETIME = 30 min en
// config/settings.py) para que ambos límites hablen del mismo tiempo.
//
// Para probar el flujo sin esperar media hora no hay que editar este
// archivo: basta crear un .env.local (en milisegundos) y reiniciar Vite.
//   VITE_INACTIVIDAD_MS=15000
// Se declara local (sin export) porque solo lo usa este archivo: exportarlo
// hacía que el linter marcara un segundo aviso de "only-export-components".
const TIEMPO_INACTIVIDAD_MS =
  Number(import.meta.env.VITE_INACTIVIDAD_MS) || 30 * 60 * 1000;

// Cuánto antes del cierre se avisa al usuario. Se toma el menor entre 5
// minutos y el 20 % del temporizador: con los 30 min reales da exactamente
// los 5 minutos buscados, pero al probar con VITE_INACTIVIDAD_MS=20000 el
// aviso aparece a los 4 segundos y se puede ver el flujo completo sin
// esperar media hora.
const TIEMPO_AVISO_MS = Math.min(5 * 60 * 1000, TIEMPO_INACTIVIDAD_MS * 0.2);

// Interacciones que cuentan como "el usuario sigue trabajando".
const EVENTOS_ACTIVIDAD = [
  "mousemove",
  "mousedown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
];

// Si la sesión se cae estando en una de estas rutas, no tiene sentido
// mandar al usuario a "sesión expirada": ahí no había una sesión que perder.
const RUTAS_PUBLICAS = ["/login", "/registro", "/verificacion", "/sesion-expirada"];

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() =>
    // La sesión solo se restaura si el token sigue siendo UTILIZABLE (existe
    // y no venció). Antes bastaba con que existiera "trc_usuario", así que
    // borrar el token desde DevTools —o dejarlo vencer y recargar— seguía
    // mostrando el sistema como si el usuario estuviera dentro, hasta que
    // fallaba la primera llamada a la API.
    authService.estadoDeSesion() === "activa" ? authService.usuarioGuardado() : null
  );
  // Usuario que ya probó sus credenciales pero aún no confirma el
  // código de verificación enviado a su correo. Mientras exista, la
  // sesión real permanece inactiva (y sin tokens en el navegador).
  const [usuarioPendiente, setUsuarioPendiente] = useState(
    () => authService.sesionPendiente()?.usuario ?? null
  );

  // Indica que la sesión se cerró sola (inactividad o token vencido), no por
  // una salida voluntaria. Es lo que permite que ProtectedRoute mande a
  // /sesion-expirada en vez de a /login. Se inicializa desde sessionStorage
  // (para que una recarga siga mostrando la explicación) y también cuando al
  // arrancar había un token vencido o ilegible.
  const [sesionExpirada, setSesionExpirada] = useState(() => {
    // El token vencido debe detectarse YA en el primer render: si se marcara
    // dentro de un useEffect, ese primer render mandaría a /login y la
    // pantalla de sesión expirada no llegaría a verse.
    const estado = authService.estadoDeSesion();
    if (estado === "vencida" || estado === "invalido") return true;
    return authService.estaSesionExpirada();
  });

  // Datos del aviso emergente de "tu sesión está por cerrarse": null cuando no
  // hay que avisar, o { expiraEn } con el instante exacto en que se cerraría.
  // Se guarda solo ese instante y no un contador, para que el proveedor (que
  // envuelve toda la aplicación) no se re-renderice cada segundo: la cuenta
  // regresiva vive dentro del propio aviso, en AvisoSesion.jsx.
  const [avisoSesion, setAvisoSesion] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // La ruta actual y el navegador se guardan en refs porque los listeners
  // y el temporizador se registran una sola vez: necesitan leer el valor
  // vigente en el momento de expirar, no el que había al montarse.
  const rutaActual = useRef(location.pathname);
  useEffect(() => {
    rutaActual.current = location.pathname;
  }, [location.pathname]);

  const navegar = useRef(navigate);
  useEffect(() => {
    navegar.current = navigate;
  }, [navigate]);

  const temporizador = useRef(null);
  // Temporizador aparte para el aviso previo: es un segundo setTimeout, no
  // comparte el del cierre, porque cada uno tiene su propio plazo.
  const temporizadorAviso = useRef(null);
  const ultimaActividad = useRef(Date.now());
  // Instante en que se cerraría la sesión si nadie interactúa. Va en una ref
  // (y no en estado) para que programar el aviso no provoque renders.
  const expiraEn = useRef(0);

  // Espejo de `avisoSesion` en una ref. El efecto necesita saber, en el
  // instante de cada interacción, si el aviso ya está en pantalla; leer el
  // estado obligaría a declarar `avisoSesion` como dependencia del efecto, y
  // eso reiniciaría los temporizadores justo cuando el aviso se abre.
  const avisoVisible = useRef(false);

  // Quien sabe reiniciar los temporizadores es el efecto de inactividad, pero
  // "Extender sesión" se dispara desde fuera (el botón del aviso). Esta ref es
  // el puente entre ambos, sin obligar a re-suscribir todos los listeners.
  const reiniciarTemporizadores = useRef(() => {});

  // Cierra la sesión y lleva a la pantalla de sesión expirada. Se usa en
  // los dos caminos posibles: el temporizador de inactividad y el evento
  // "sesion-expirada" que dispara el interceptor 401 de api.js cuando el
  // token dejó de ser válido.
  const expirarSesion = useCallback(() => {
    // Si ya estamos en una ruta pública (login, registro, verificación o la
    // propia pantalla de expiración) no había sesión que perder: no se
    // navega a ningún lado ni se marca la sesión como expirada.
    const enRutaPublica = RUTAS_PUBLICAS.includes(rutaActual.current);

    // Navegar primero cubre el caso de rutas que no pasan por ProtectedRoute.
    // Aun así, la redirección NO depende de esta llamada: en React Router la
    // navegación es una transición de baja prioridad, mientras que vaciar
    // `usuario` es un update urgente, así que React puede renderizar
    // ProtectedRoute con usuario=null antes de que la navegación se aplique.
    // Por eso la decisión real de a dónde ir la toma ProtectedRoute leyendo
    // `sesionExpirada`.
    if (!enRutaPublica) {
      navegar.current("/sesion-expirada", { replace: true });
      // La marca es lo que vuelve determinista la redirección: ProtectedRoute
      // la lee en el MISMO render en que `usuario` queda en null (ambos son
      // updates urgentes y React los agrupa), así que apunta a
      // /sesion-expirada en vez de a /login.
      authService.marcarSesionExpirada();
      setSesionExpirada(true);
    }

    authService.limpiarSesion();
    // Si el aviso estaba en pantalla, ya no tiene sentido mantenerlo.
    avisoVisible.current = false;
    setAvisoSesion(null);
    setUsuario(null);
    setUsuarioPendiente(null);
  }, []);

  // Limpia la marca de sesión expirada cuando el usuario vuelve a entrar o
  // sale por su cuenta: a partir de ahí, un acceso sin sesión ya no es un
  // "se te expiró", sino un simple "inicia sesión".
  function olvidarExpiracion() {
    authService.limpiarSesionExpirada();
    setSesionExpirada(false);
  }

  // El usuario decidió seguir conectado desde el aviso emergente.
  function extenderSesion() {
    avisoVisible.current = false;
    setAvisoSesion(null);
    ultimaActividad.current = Date.now();
    // Reinicia los dos temporizadores (aviso y cierre), con lo que el usuario
    // recupera otros 30 minutos completos. No hay límite de extensiones: la
    // decisión es suya, como en el aviso de sesión de un banco.
    reiniciarTemporizadores.current();
    // Además del plazo, se renueva el JWT en segundo plano para que la sesión
    // extendida también siga siendo válida en el backend. Es "best effort":
    // si el refresh ya venció, refrescarSesion() devuelve null sin romper
    // nada, y el interceptor se ocupará de la sesión cuando corresponda.
    refrescarSesion();
  }

  useEffect(() => {
    window.addEventListener("sesion-expirada", expirarSesion);
    return () => window.removeEventListener("sesion-expirada", expirarSesion);
  }, [expirarSesion]);

  // Limpieza de arranque: si quedó un token vencido o ilegible guardado, se
  // descarta y se deja puesta la marca de sesión expirada, para que la
  // próxima visita explique qué pasó en vez de arrancar con basura en el
  // almacenamiento. Va en un efecto y no en el initializer de useState
  // porque escribir almacenamiento durante el render no es un sitio limpio.
  useEffect(() => {
    const estado = authService.estadoDeSesion();
    if (estado === "vencida" || estado === "invalido") {
      authService.limpiarSesion();
      authService.marcarSesionExpirada();
    }
  }, []);

  // Temporizador de inactividad. Solo corre mientras hay una sesión activa:
  // al hacer logout (o al expirar) `usuario` pasa a null y el efecto se
  // limpia, con lo que no quedan timers huérfanos.
  useEffect(() => {
    if (!usuario) return undefined;

    ultimaActividad.current = Date.now();
    // Sesión nueva: cualquier aviso heredado de un login anterior sobra.
    avisoVisible.current = false;
    setAvisoSesion(null);

    function reiniciar() {
      if (temporizador.current) clearTimeout(temporizador.current);
      if (temporizadorAviso.current) clearTimeout(temporizadorAviso.current);

      expiraEn.current = Date.now() + TIEMPO_INACTIVIDAD_MS;

      // Cierre efectivo de la sesión al agotarse el plazo...
      temporizador.current = setTimeout(expirarSesion, TIEMPO_INACTIVIDAD_MS);
      // ...y aviso emergente un poco antes, para dar tiempo a reaccionar.
      temporizadorAviso.current = setTimeout(() => {
        avisoVisible.current = true;
        setAvisoSesion({ expiraEn: expiraEn.current });
      }, Math.max(0, TIEMPO_INACTIVIDAD_MS - TIEMPO_AVISO_MS));
    }

    // Se publica el reinicio hacia fuera para el botón "Extender sesión".
    reiniciarTemporizadores.current = reiniciar;

    // mousemove/scroll se disparan decenas de veces por segundo: reiniciar
    // el temporizador en cada evento sería puro desperdicio, así que solo
    // se hace si pasó más de un segundo desde el último reinicio.
    function registrarActividad() {
      // Con el aviso en pantalla manda el aviso, no la actividad: mientras
      // esté abierto las interacciones se ignoran. Así la cuenta regresiva
      // corre hasta cero y el usuario decide de verdad si extiende o no, en
      // lugar de que un movimiento involuntario del ratón lo cierre solo.
      if (avisoVisible.current) return;

      if (Date.now() - ultimaActividad.current < 1000) return;
      ultimaActividad.current = Date.now();
      reiniciar();
    }

    // Los temporizadores de las pestañas en segundo plano se ralentizan o
    // se pausan, así que al volver a la pestaña se comprueba cuánto tiempo
    // estuvo oculta. Con el aviso abierto solo se comprueba si ya venció el
    // cierre, y no se reinicia nada: hacerlo dejaría el contador en 00:00
    // para siempre sin llegar a cerrar la sesión.
    function alCambiarVisibilidad() {
      if (document.visibilityState !== "visible") return;

      if (avisoVisible.current) {
        if (Date.now() >= expiraEn.current) expirarSesion();
        return;
      }

      if (Date.now() - ultimaActividad.current >= TIEMPO_INACTIVIDAD_MS) {
        expirarSesion();
      } else {
        ultimaActividad.current = Date.now();
        reiniciar();
      }
    }

    reiniciar();
    EVENTOS_ACTIVIDAD.forEach((evento) =>
      window.addEventListener(evento, registrarActividad, { passive: true })
    );
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    return () => {
      if (temporizador.current) clearTimeout(temporizador.current);
      if (temporizadorAviso.current) clearTimeout(temporizadorAviso.current);
      // Los puentes se desactivan: sin sesión no hay temporizadores que
      // reiniciar ni aviso que pueda estar en pantalla.
      reiniciarTemporizadores.current = () => {};
      avisoVisible.current = false;
      EVENTOS_ACTIVIDAD.forEach((evento) =>
        window.removeEventListener(evento, registrarActividad)
      );
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
    };
  }, [usuario, expirarSesion]);

  function iniciarSesion(datosUsuario) {
    olvidarExpiracion();
    setUsuario(datosUsuario);
    localStorage.setItem("trc_usuario", JSON.stringify(datosUsuario));
  }

  // Salida voluntaria: se limpia la marca para que un acceso posterior sin
  // sesión se trate como "inicia sesión" y no como "se te expiró".
  function cerrarSesion() {
    authService.limpiarSesion();
    olvidarExpiracion();
    // Si el aviso estaba abierto al cerrar sesión, se retira con ella.
    avisoVisible.current = false;
    setAvisoSesion(null);
    setUsuario(null);
    setUsuarioPendiente(null);
  }

  // Se llama justo después de validar usuario/contraseña contra la API:
  // refleja en React la sesión que authService dejó pendiente de código.
  function iniciarVerificacion() {
    const pendiente = authService.sesionPendiente();
    setUsuarioPendiente(pendiente?.usuario ?? null);
    return pendiente;
  }

  // Se llama solo cuando el backend confirma el código de verificación:
  // recién ahí se piden/guardan los tokens y se activa la sesión.
  // Si el código es incorrecto, expiró o se agotaron los intentos, el
  // backend rechaza y el error se propaga (con su mensaje) al formulario.
  async function confirmarSesion(codigo) {
    const datos = await authService.confirmarCodigo(codigo);
    authService.guardarSesion(datos.tokens, datos.usuario);
    authService.descartarPendiente();
    olvidarExpiracion();
    setUsuarioPendiente(null);
    setUsuario(datos.usuario);
    return datos.usuario;
  }

  // Cancela el proceso de verificación (p. ej. volver al login).
  function cancelarVerificacion() {
    authService.descartarPendiente();
    setUsuarioPendiente(null);
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        usuarioPendiente,
        sesionExpirada,
        // Aviso emergente de sesión por cerrarse (lo consume AvisoSesion).
        avisoSesion,
        extenderSesion,
        iniciarSesion,
        cerrarSesion,
        iniciarVerificacion,
        confirmarSesion,
        cancelarVerificacion,
        estaAutenticado: Boolean(usuario),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}