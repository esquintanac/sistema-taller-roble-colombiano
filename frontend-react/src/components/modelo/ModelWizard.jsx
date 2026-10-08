// src/components/modelo/ModelWizard.jsx
// Orquestador que controla el sub-paso activo, centraliza el estado
// del formulario y valida los campos obligatorios antes de avanzar
// de sub-paso (RF2).

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../ui/Stepper";
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
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    async function cargarClientes() {
      try {
        const datosClientes = await clientesService.listar();
        if (activo) setClientes(Array.isArray(datosClientes) ? datosClientes : []);
      } catch {
        if (activo) {
          setErrorClientes(
            "No se pudieron cargar los clientes. Verifica que el servidor esté disponible."
          );
        }
      } finally {
        if (activo) setCargandoClientes(false);
      }
    }
    cargarClientes();
    return () => {
      activo = false;
    };
  }, []);

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

  function irA1C() {
    const obligatorios = ["compartimentos", "entrepanos"];
    if (datos.llevaCajones) obligatorios.push("numCajones");
    if (datos.llevaBarra) obligatorios.push("alturaBarra");
    if (validarCampos(obligatorios)) setSubPaso("1C");
  }

  function handleRegistrar() {
    const obligatorios = ["idCliente"];
    // El zócalo es opcional como concepto, pero si el usuario lo activa
    // debe indicar su altura: el backend guarda altura_zocalo = 0 cuando
    // no se usa, así que un "sí" sin medida dejaría el dato incompleto.
    if (datos.llevaZocalo) obligatorios.push("alturaZocalo");
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
    </div>
  );
}