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
    setDatos({ ...datos, [name]: value });
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

  function irA1B() {
    const obligatorios = ["alto", "ancho", "largo", "grosor"];
    if (validarCampos(obligatorios)) setSubPaso("1B");
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
    if (validarCampos(obligatorios)) setSubPaso("1C");
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