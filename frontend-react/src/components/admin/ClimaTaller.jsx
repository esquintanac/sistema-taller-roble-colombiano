// src/components/admin/ClimaTaller.jsx
// Tarjeta con el clima de la zona del taller y qué hacer con el material
// según la humedad (Fase 7).
//
// Si el servicio externo no responde, el componente no dibuja NADA: es
// información de apoyo y no puede romper la pantalla ni dejar un hueco raro.

import { useClima } from "../../hooks/useDatosExternos";

// Color del borde según qué tan conveniente sea la humedad para guardar
// melamina: verde cuando es la ideal, ámbar cuando conviene corregir algo y
// rojo cuando hay riesgo real para el material.
const TONOS = {
  seca: "aviso",
  adecuada: "exito",
  alta: "aviso",
  "muy alta": "error",
};

export default function ClimaTaller() {
  const clima = useClima();

  // Sin dato no hay tarjeta (pantalla sin internet, servicio caído...).
  if (!clima) return null;

  const tono = TONOS[clima.nivel] || "info";

  return (
    <div className={`clima-tarjeta clima-${tono}`}>
      <div className="clima-cabecera">
        <span className="clima-icono" aria-hidden="true">
          💧
        </span>
        <div>
          <div className="clima-titulo">Humedad del taller</div>
          <div className="clima-ubicacion">{clima.ubicacion}</div>
        </div>
        <div className="clima-valores">
          <strong>{clima.humedad}%</strong>
          {clima.temperatura != null && <span>{clima.temperatura} °C</span>}
        </div>
      </div>

      <p className="clima-recomendacion">
        <strong className="clima-nivel">{clima.nivel}</strong> — {clima.recomendacion}
      </p>
    </div>
  );
}