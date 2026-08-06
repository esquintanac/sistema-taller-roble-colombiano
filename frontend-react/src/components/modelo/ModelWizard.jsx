// src/components/modelo/ModelWizard.jsx
// Orquestador que controla el sub-paso activo, centraliza el estado
// del formulario y valida los campos obligatorios antes de avanzar
// de sub-paso (RF2).

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Stepper from "../ui/Stepper";
import DimensionsStep from "./DimensionsStep";
import DistributionStep from "./DistributionStep";
import FinishesStep from "./FinishesStep";

const DATOS_INICIALES = {
  tipoModelo: "Closet", alto: "", ancho: "", largo: "", grosor: "",
  compartimentos: "", entrepanos: "",
  llevaCajones: false, numCajones: "",
  llevaBarra: false, alturaBarra: "",
  llevaPuertas: true, tipoPuerta: "abatible", numPuertas: "2",
  nombreCliente: "", observaciones: "",
};

export default function ModelWizard() {
  const [subPaso, setSubPaso] = useState("1A");
  const [datos, setDatos] = useState(DATOS_INICIALES);
  const [errores, setErrores] = useState({});
  const navigate = useNavigate();

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
    const obligatorios = ["nombreCliente"];
    if (!validarCampos(obligatorios)) return;

    sessionStorage.setItem("trc_modelo", JSON.stringify(datos));
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
          />
        )}
      </div>
    </div>
  );
}