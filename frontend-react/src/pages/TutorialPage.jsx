// src/pages/TutorialPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import TutorialProgressBar from "../components/tutorial/TutorialProgressBar";
import TutorialStepCard from "../components/tutorial/TutorialStepCard";
import Button from "../components/ui/Button";

// Guía del Carpintero: el flujo completo de un mueble, desde iniciar
// sesión hasta descargar los reportes. Cada paso describe la pantalla
// REAL a la que lleva la acción; si el flujo cambia, actualizar este
// arreglo (el orden del arreglo es el orden que muestra la barra de
// progreso).
const PASOS = [
  {
    icono: "🔑",
    titulo: "Iniciar sesión con doble verificación",
    pantalla: "Login → Verificación de seguridad",
    descripcion:
      "Entra con tu usuario y contraseña. En la pantalla siguiente te piden un código de 6 dígitos, válido por 5 minutos, que llega a tu correo registrado: recién cuando lo confirmas se abre el Panel del Taller. Tienes 5 intentos antes de que el código quede bloqueado y puedes pedir un reenvío cada minuto.",
    consejo:
      "¿Olvidaste la contraseña? En el login usa «¿Olvidaste tu contraseña?»: recibirás un enlace por correo para crear una nueva, que sirve una sola vez y vence a los 30 minutos.",
  },
  {
    icono: "📋",
    titulo: "Registrar los datos del modelo",
    pantalla: "Panel del taller → Nuevo modelo",
    descripcion:
      "El asistente tiene tres pantallas: «Dimensiones generales» (tipo de modelo y medidas en centímetros, incluido el grosor de la melamina), «Distribución interna» (compartimentos, entrepaños, cajones y barra) y «Acabados y extras» (tipo y número de puertas, color, zócalo, fondo, cliente y observaciones). Con estos datos el sistema calculará las piezas a cortar y la melanina necesaria.",
    consejo:
      "Ten a la mano las medidas del cliente antes de empezar. El campo Cliente es obligatorio: los clientes los registra el administrador y aparecen en el desplegable de Acabados.",
  },
  {
    icono: "🔍",
    titulo: "Validar y confirmar",
    pantalla: "Panel del taller → Validar datos",
    descripcion:
      "Verás el resumen de todo lo que registraste. El flujo completo se recorre con la barra de progreso: Datos → Validar → Diseño 3D → Reporte. Al pulsar «Sí, generar diseño 3D» el modelo se guarda en el sistema, queda en el historial del taller y se habilitan las pantallas de Diseño 3D y Reporte.",
    consejo:
      "Es la última oportunidad para corregir: si algo no cuadra, usa «Paso anterior». Una vez confirmado, el modelo queda en solo lectura; para cambiarlo habría que registrarlo de nuevo.",
  },
  {
    icono: "🧊",
    titulo: "Explorar el diseño 3D",
    pantalla: "Panel del taller → Diseño 3D",
    descripcion:
      "Arrastra el mouse para girar el mueble, usa la rueda o los botones «Zoom +» y «Zoom −» para acercarte y «Girar» para verlo en automático. Haz clic en una puerta —o en el botón «Abrir puertas»— para ver el interior: las abatibles giran sobre sus bisagras y las corredizas se deslizan sobre su riel sin salirse del mueble. El color del modelo es el de la melamina que elegiste.",
    consejo:
      "Abre las puertas y comprueba que el interior coincide con lo que pidió el cliente: barra, entrepaños y cajones en su lugar, y medidas proporcionadas.",
  },
  {
    icono: "📄",
    titulo: "Descargar los reportes en PDF",
    pantalla: "Panel del taller → Reporte PDF",
    descripcion:
      "Son dos documentos con destinos distintos: el Reporte de construcción lista las piezas a cortar con sus medidas y la melanina necesaria (es el documento del taller), y el Reporte de materiales y costos muestra el desglose de materiales con precio y total (es el documento para cotizar).",
    consejo:
      "Si el reporte de costos dice que el modelo aún no tiene materiales, es esperado: los asocia el administrador. El reporte de construcción siempre está disponible.",
  },
  {
    icono: "💧",
    titulo: "Tu panel de trabajo",
    pantalla: "Panel del taller (/inicio)",
    descripcion:
      "El panel reúne los accesos directos del flujo y la tarjeta «Humedad del taller», que muestra la humedad de la zona y qué hacer con la melamina según el nivel: verde (ideal), ámbar (conviene corregir algo) o rojo (riesgo para el material).",
    consejo:
      "Con humedad alta no dejes las láminas al aire: se hinchan y pueden aparecer manchas. Y si dejas el computador solo, el sistema te avisará 5 minutos antes de cerrar tu sesión: pulsa «Extender sesión» las veces que necesites.",
  },
];

export default function TutorialPage() {
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
        En seis pasos aprenderás a llevar un mueble desde la primera medida hasta sus
        reportes en PDF. Puedes volver a ver esta guía en cualquier momento con el
        botón «Repetir tutorial» del encabezado.
      </p>

      <TutorialProgressBar pasoActual={paso} totalPasos={PASOS.length} />
      <TutorialStepCard paso={PASOS[paso - 1]} />

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24 }}>
        <Button variante="secondary" disabled={paso === 1} onClick={() => setPaso(paso - 1)}>
          Paso anterior
        </Button>
        <Button
          variante="primary"
          onClick={() => (paso < PASOS.length ? setPaso(paso + 1) : navigate("/inicio"))}
        >
          {paso < PASOS.length ? "Siguiente paso" : "Ir al panel del taller"}
        </Button>
      </div>
    </div>
  );
}