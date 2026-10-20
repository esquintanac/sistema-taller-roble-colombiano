// src/components/modelo/ModelWizard.jsx
// Orquestador que controla el sub-paso activo, centraliza el estado
// del formulario y valida los campos obligatorios antes de avanzar
// de sub-paso (RF2).

import { useCallback, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../ui/Stepper";
import Modal from "../ui/Modal";
import DimensionsStep from "./DimensionsStep";
import DistributionStep from "./DistributionStep";
import FinishesStep from "./FinishesStep";
import clientesService, { etiquetaCliente } from "../../services/clientesService";
import { soloDigitos, limitarDecimal } from "../../utils/numeros";
import { LIMITES_RANGO, MAX_OBSERVACIONES, validarRangos as validarRangosCampos } from "./limitesModelo";

const DATOS_INICIALES = {
  tipoModelo: "Closet", alto: "", ancho: "", largo: "", grosor: "",
  compartimentos: "", entrepanos: "",
  llevaCajones: false, numCajones: "",
  llevaBarra: false, alturaBarra: "",
  llevaPuertas: true, tipoPuerta: "abatible", numPuertas: "2",
  color: "",
  llevaZocalo: false, alturaZocalo: "",
  llevaFondo: true, materialFondo: "MDF 3mm",
  idCliente: "", observaciones: "",
};

// Regla única de campos condicionales: si el interruptor está activo, estos
// campos son obligatorios para avanzar; si está apagado se ignoran (el backend
// recibe 0 / "" y no genera la pieza asociada). Quien no quiera el elemento
// debe desactivar el interruptor para poder continuar.
const CAMPOS_POR_TOGGLE = {
  llevaCajones: ["numCajones"],
  llevaBarra: ["alturaBarra"],
  llevaPuertas: ["tipoPuerta", "numPuertas"],
  llevaZocalo: ["alturaZocalo"],
  llevaFondo: ["materialFondo"],
};

export default function ModelWizard() {
  const [subPaso, setSubPaso] = useState("1A");
  // Si el usuario vuelve desde la validación ("No, corregir datos"), se
  // recuperan los valores ya ingresados en lugar de empezar de cero.
  const [datos, setDatos] = useState(() => {
    const guardado = sessionStorage.getItem("trc_modelo");
    if (!guardado) return DATOS_INICIALES;
    try {
      const previos = JSON.parse(guardado);
      // Solo se restauran claves que existan en el formulario;
      // clienteEtiqueta, por ejemplo, es solo para el resumen.
      const camposValidos = Object.fromEntries(
        Object.entries(previos).filter(([clave]) => clave in DATOS_INICIALES)
      );
      return { ...DATOS_INICIALES, ...camposValidos };
    } catch {
      return DATOS_INICIALES;
    }
  });
  const [errores, setErrores] = useState({});
  // Clientes disponibles para asociar al modelo. Se consultan al backend
  // porque el modelo exige un id_cliente existente (RF2).
  const [clientes, setClientes] = useState([]);
  const [cargandoClientes, setCargandoClientes] = useState(true);
  const [errorClientes, setErrorClientes] = useState("");
  // Visibilidad del modal de error de carga: el mensaje se conserva aunque
  // se cierre la ventana, para que el hint del select siga avisando.
  const [modalClientes, setModalClientes] = useState(false);
  const navigate = useNavigate();

  // Se extrae en useCallback para reutilizarlo tanto al montar como desde
  // el botón "Reintentar" del modal. (En React 18/19 un setState tras
  // desmontar es inocuo, así que ya no hace falta el guard "activo".)
  const cargarClientes = useCallback(async () => {
    setCargandoClientes(true);
    setErrorClientes("");
    setModalClientes(false);
    try {
      const datosClientes = await clientesService.listar();
      setClientes(Array.isArray(datosClientes) ? datosClientes : []);
    } catch {
      setErrorClientes(
        "No se pudieron cargar los clientes. Verifica que el servidor esté disponible."
      );
      setModalClientes(true);
    } finally {
      setCargandoClientes(false);
    }
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  function handleChange(e) {
    const { name, value } = e.target;

    // Límite de dígitos en vivo: maxLength no aplica a campos tipo number,
    // así que los numéricos son texto con inputMode y se filtran aquí
    // (mismo patrón que Materiales). Las medidas aceptan un decimal porque
    // 1 cm con un decimal = 1 mm, la precisión real de corte del taller.
    let valor = value;
    if (name === "numCajones") {
      valor = soloDigitos(value).slice(0, 2);
    } else if (["alto", "ancho", "largo", "alturaBarra", "alturaZocalo"].includes(name)) {
      valor = limitarDecimal(value, 3, 1);
    } else if (name === "observaciones") {
      valor = value.slice(0, MAX_OBSERVACIONES);
    }

    setDatos({ ...datos, [name]: valor });
    // Al corregir un campo, se limpia su error inmediatamente
    if (errores[name]) {
      setErrores({ ...errores, [name]: undefined });
    }
  }

  function handleToggle(campo) {
    setDatos({ ...datos, [campo]: !datos[campo] });
    // Al cambiar un toggle se limpian los errores de sus campos asociados:
    // si el interruptor se apaga, el campo queda oculto y deja de ser
    // obligatorio; si se vuelve a encender, el error se emitirá de nuevo
    // al pulsar el botón. Así nunca queda el mensaje de un campo invisible.
    const asociados = CAMPOS_POR_TOGGLE[campo] || [];
    if (asociados.some((c) => errores[c])) {
      const limpios = { ...errores };
      asociados.forEach((c) => delete limpios[c]);
      setErrores(limpios);
    }
  }

  // Valida un conjunto de campos obligatorios; retorna true si todos están completos
  function validarCampos(camposObligatorios) {
    const nuevosErrores = {};
    camposObligatorios.forEach((campo) => {
      const valor = datos[campo];
      if (valor === "" || valor === null || valor === undefined) {
        nuevosErrores[campo] = "Este campo es obligatorio";
      }
    });
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  // Valida los campos numéricos indicados contra sus rangos de negocio y
  // las reglas entre campos (barra/zócalo deben caber dentro del alto del
  // mueble). Los vacíos no se tocan aquí: ya los cubre validarCampos como
  // obligatorios cuando el interruptor correspondiente está activo.
  // La lógica vive en limitesModelo.js: es una única regla, compartida con
  // sus pruebas en node, y no se duplica aquí.
  function validarRangos(campos) {
    const nuevosErrores = validarRangosCampos(datos, campos);
    if (Object.keys(nuevosErrores).length === 0) return true;
    setErrores((prev) => ({ ...prev, ...nuevosErrores }));
    return false;
  }

  function irA1B() {
    const obligatorios = ["alto", "ancho", "largo", "grosor"];
    if (!validarCampos(obligatorios)) return;
    // Mínimos reales del taller: medidas muy pequeñas dejarían entrepaños
    // con medidas negativas (ancho - 2×grosor) en el cálculo del backend.
    if (!validarRangos(["alto", "ancho", "largo"])) return;
    setSubPaso("1B");
  }

  // Campos obligatorios de los toggles indicados, solo si están activados.
  function camposDeToggles(toggles) {
    return toggles.flatMap((toggle) => (datos[toggle] ? CAMPOS_POR_TOGGLE[toggle] : []));
  }

  function irA1C() {
    const obligatorios = [
      "compartimentos",
      "entrepanos",
      ...camposDeToggles(["llevaCajones", "llevaBarra"]),
    ];
    if (!validarCampos(obligatorios)) return;
    // Rangos de cajones/barra y la regla barra < alto: ambos valores ya se
    // conocen en este punto (el alto se validó en el paso 1A).
    if (!validarRangos(["numCajones", "alturaBarra"])) return;
    setSubPaso("1C");
  }

  function handleRegistrar() {
    // idCliente siempre es obligatorio. Además, cada elemento activo con su
    // interruptor exige sus datos:
    //  - puertas → tipo y número (sin esta regla se registraba un modelo "con
    //    puertas" con campos vacíos y el payload llegaba con puertas = 0);
    //  - fondo trasero → material (sin él la CalculadoraService no genera la
    //    pieza "Fondo trasero");
    //  - zócalo → altura, cajones → cantidad, barra → altura (mismo criterio).
    // Quien no quiera el elemento debe apagar su interruptor para registrar.
    const obligatorios = [
      "idCliente",
      ...camposDeToggles([
        "llevaPuertas",
        "llevaZocalo",
        "llevaFondo",
        "llevaCajones",
        "llevaBarra",
      ]),
    ];
    if (!validarCampos(obligatorios)) return;
    // Revalida todos los rangos y las reglas entre campos: el usuario pudo
    // retroceder y cambiar una medida después de haberla validado al avanzar
    // (p. ej. bajar el alto sin ajustar la altura de la barra).
    if (!validarRangos(Object.keys(LIMITES_RANGO))) return;

    // Se guarda también el nombre legible del cliente para que el resumen
    // de validación lo muestre sin volver a consultar el backend.
    const clienteElegido = clientes.find(
      (cliente) => String(cliente.id_cliente) === String(datos.idCliente)
    );

    sessionStorage.setItem(
      "trc_modelo",
      JSON.stringify({
        ...datos,
        clienteEtiqueta: clienteElegido ? etiquetaCliente(clienteElegido) : datos.idCliente,
      })
    );
    navigate("/validar-datos");
  }

  return (
    <div className="container" style={{ maxWidth: 800, paddingTop: 30, paddingBottom: 40 }}>
      <Stepper pasoActual={1} />

      <div className="card">
        {subPaso === "1A" && (
          <DimensionsStep
            datos={datos}
            errores={errores}
            onChange={handleChange}
            onTipoChange={(tipo) => setDatos({ ...datos, tipoModelo: tipo })}
            onSiguiente={irA1B}
          />
        )}
        {subPaso === "1B" && (
          <DistributionStep
            datos={datos}
            errores={errores}
            onChange={handleChange}
            onToggle={handleToggle}
            onSiguiente={irA1C}
            onAtras={() => setSubPaso("1A")}
          />
        )}
        {subPaso === "1C" && (
          <FinishesStep
            datos={datos}
            errores={errores}
            onChange={handleChange}
            onToggle={handleToggle}
            onRegistrar={handleRegistrar}
            onAtras={() => setSubPaso("1B")}
            clientes={clientes}
            cargandoClientes={cargandoClientes}
            errorClientes={errorClientes}
          />
        )}
      </div>

      {/* Falló la carga del catálogo de clientes: ventana emergente con
          reintentar/cerrar. El formulario de abajo sigue usable si se
          cierra (el hint del select avisa que la carga falló). */}
      {modalClientes && (
        <Modal
          tipo="error"
          titulo="No se pudieron cargar los clientes"
          mensaje={errorClientes}
          textoAceptar="Reintentar"
          textoCancelar="Cerrar"
          onAceptar={cargarClientes}
          onCancelar={() => setModalClientes(false)}
        />
      )}
    </div>
  );
}