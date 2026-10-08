// src/pages/AdminTutorialPage.jsx
// Tutorial exclusivo para el rol Administrador. Al finalizar, redirige
// al panel /inicio (no al formulario del carpintero, que no le corresponde).
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TutorialProgressBar from "../components/tutorial/TutorialProgressBar";
import TutorialStepCard from "../components/tutorial/TutorialStepCard";
import Button from "../components/ui/Button";

// Guía del Administrador: sus herramientas en el orden en que las usa
// (supervisar → costos → inventario → clientes → facturas). Cada paso
// describe la pantalla REAL a la que lleva la acción; si el flujo
// cambia, actualizar este arreglo.
const PASOS_ADMIN = [
  {
    icono: "🏠",
    titulo: "Tu panel de control",
    pantalla: "Panel del taller (/inicio)",
    descripcion:
      "El panel es tu punto de partida: desde ahí llegas al historial de diseños, a materiales, a clientes, a facturas y a este tutorial. También verás la tarjeta «Humedad del taller», con la recomendación de la zona para guardar la melamina: verde (ideal), ámbar (conviene corregir algo) o rojo (riesgo para el material).",
    consejo:
      "Vuelve a esta guía cuando quieras con el botón «Repetir tutorial», en la esquina superior del encabezado.",
  },
  {
    icono: "📂",
    titulo: "Historial de diseños (solo lectura)",
    pantalla: "Panel → Historial de diseños",
    descripcion:
      "Listado con todos los modelos registrados por los carpinteros: quién lo creó, tipo, medidas, cliente, fecha y estado (Nuevo o Revisado). Puedes buscar por cualquier dato y filtrar por estado. Aquí no se editan diseños: esta es la consulta oficial de lo que el taller ha producido.",
    consejo:
      "Empieza por los de estado «Nuevo»: son los que todavía no has revisado.",
  },
  {
    icono: "📐",
    titulo: "Detalle, visor 3D y costo",
    pantalla: "Historial → Abrir un diseño",
    descripcion:
      "Dentro de cada diseño ves las características, el mueble en 3D (con sus puertas abribles), las piezas a cortar y el costo en pesos con su equivalente en dólares al tipo de cambio del día. Puedes marcar el registro como «Revisado» y, si el diseño aún no tiene costo, elegir una lámina del inventario para que el sistema calcule la melanina necesaria y su precio.",
    consejo:
      "Asocia la lámina antes de facturar: los diseños sin materiales no aparecen en el generador de facturas.",
  },
  {
    icono: "📦",
    titulo: "Materiales e inventario",
    pantalla: "Panel → Materiales",
    descripcion:
      "Administra las láminas y materiales del taller con su precio. Encima de la lista aparece la humedad del taller —condiciona cómo se guardan las láminas— y una nota con el tipo de cambio del día.",
    consejo:
      "Mantén los precios al día: al asociar un material a un diseño, su costo se congela con el precio de ese momento y no cambia aunque luego actualices el inventario.",
  },
  {
    icono: "👥",
    titulo: "Clientes",
    pantalla: "Panel → Clientes",
    descripcion:
      "Registra a los clientes del taller con sus datos de contacto y adminístralos desde la tabla. Estos clientes son los que el carpintero elegirá en el formulario al crear un modelo y los que aparecerán en sus reportes.",
    consejo:
      "El teléfono es obligatorio y es con lo que el taller localiza al cliente: verifica que esté bien escrito antes de guardar.",
  },
  {
    icono: "🧾",
    titulo: "Facturas",
    pantalla: "Panel → Facturas",
    descripcion:
      "Genera la factura de un diseño que ya tenga materiales asociados: elige el diseño y el método de pago, revisa el desglose y el total —en pesos y en dólares— y guarda. Desde la tabla consultas cada factura, su estado de pago y descargas su PDF.",
    consejo:
      "Si un diseño no aparece en el selector es porque todavía no tiene materiales: asocialos desde su detalle (paso «Detalle, visor 3D y costo») y vuelve a intentarlo.",
  },
  {
    icono: "🔐",
    titulo: "Tu sesión, protegida",
    pantalla: "Login → Verificación de seguridad",
    descripcion:
      "El acceso combina usuario y contraseña con el código de 6 dígitos que llega a tu correo, válido por 5 minutos. Si pasas 30 minutos sin actividad, el sistema cierra la sesión por seguridad; 5 minutos antes aparece un aviso con cuenta regresiva para que puedas continuar.",
    consejo:
      "En el aviso pulsa «Extender sesión» las veces que necesites. Si olvidaste la contraseña, usa «¿Olvidaste tu contraseña?» en el login: recibirás un enlace por correo, de un solo uso y válido por 30 minutos.",
  },
];

export default function AdminTutorialPage() {
  const [paso, setPaso] = useState(1);
  const navigate = useNavigate();
  const { usuario } = useAuth();

  return (
    <div className="container" style={{ maxWidth: 680, paddingTop: 30, paddingBottom: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <h1 style={{ margin: 0 }}>Bienvenido, {usuario?.nombre || "usuario"}</h1>
        <Button variante="secondary" tamano="sm" onClick={() => navigate("/inicio")}>
          Saltar tutorial
        </Button>
      </div>

      <p style={{ color: "var(--tx-sec)", marginBottom: 20 }}>
        En siete pasos conocerás tus herramientas cómo revisar los diseños, calcular
        costos y administrar inventario, clientes y facturas. Puedes volver a ver esta
        guía en cualquier momento con el botón «Repetir tutorial» del encabezado.
      </p>

      <TutorialProgressBar pasoActual={paso} totalPasos={PASOS_ADMIN.length} />
      <TutorialStepCard paso={PASOS_ADMIN[paso - 1]} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Button variante="secondary" disabled={paso === 1} onClick={() => setPaso(paso - 1)}>
          Paso anterior
        </Button>
        <Button
          variante="primary"
          onClick={() => (paso < PASOS_ADMIN.length ? setPaso(paso + 1) : navigate("/inicio"))}
        >
          {paso < PASOS_ADMIN.length ? "Siguiente paso" : "Ir al panel del taller"}
        </Button>
      </div>
    </div>
  );
}