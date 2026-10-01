// src/components/diseno3d/Viewer3D.jsx
// Visor 3D real del modelo, construido con React Three Fiber a partir
// de las piezas y medidas que calcula el backend
// (GET /api/modelos/<id>/diseno/). Escena minimalista: solo el objeto
// y la luz mínima necesaria para verlo, sin piso, cuadrícula ni fondo
// decorativo que afecte el rendimiento.

import { useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Edges } from "@react-three/drei";
import { construirGeometria3D } from "./geometria3D";

function Pieza({ dimensiones, posicion, color }) {
  return (
    <mesh position={posicion}>
      <boxGeometry args={dimensiones} />
      <meshStandardMaterial color={color} />
      <Edges color="#142624" />
    </mesh>
  );
}

// Campo visual vertical de la cámara. Se declara una vez porque lo usan
// dos sitios (el Canvas y el cálculo del encuadre) y deben coincidir:
// si el fov del encuadre no fuera el real, el mueble quedaría cortado.
const FOV_GRADOS = 45;

// Dirección de vista en tres cuartos, normalizada. Es el vector unitario
// de (4, 3, 5), así que conserva el mismo ángulo desde el que se veía el
// mueble antes, pero permite mover la cámara a la distancia que haga
// falta sin cambiar la perspectiva.
const DIRECCION_VISTA = [4 / Math.sqrt(50), 3 / Math.sqrt(50), 5 / Math.sqrt(50)];

// Encuadre automático: calcula a qué distancia debe situarse la cámara
// para que ESTE mueble se vea completo, y con qué límites de zoom.
//
// Antes la distancia era fija (≈7 unidades) y minDistance = 1.5. Como en
// geometria3D.js la ESCALA es 1/50, un mueble pequeño ocupa ~0.8
// unidades: se veía como un punto en el centro y el botón Zoom + se
// bloqueaba en 1.5, es decir, ANTES de poder acercarse lo suficiente
// para distinguirlo. Derivar el encuadre del tamaño real de las piezas
// hace que un mueble grande y uno pequeño se vean igual de bien.
function calcularEncuadre(cajas) {
  // Sin piezas no hay nada que encuadrar: encuadre genérico.
  if (cajas.length === 0) {
    return { distancia: 7, minDistance: 1, maxDistance: 18 };
  }

  // Caja envolvente del mueble: en cada eje se toma la mayor distancia
  // desde el origen hasta el borde de una pieza (posición ± mitad de su
  // tamaño), tomando el valor absoluto porque hay piezas a ambos lados.
  let ex = 0;
  let ey = 0;
  let ez = 0;
  cajas.forEach((c) => {
    const [dx, dy, dz] = c.dimensiones;
    const [px, py, pz] = c.posicion;
    ex = Math.max(ex, Math.abs(px) + dx / 2);
    ey = Math.max(ey, Math.abs(py) + dy / 2);
    ez = Math.max(ez, Math.abs(pz) + dz / 2);
  });

  // Radio de la esfera que contiene el mueble (media diagonal).
  const radio = Math.sqrt(ex * ex + ey * ey + ez * ez);

  // Distancia mínima a la que esa esfera entra completa en el campo
  // visual vertical, con un 15% de aire para que no toque los bordes.
  const medioFov = ((FOV_GRADOS * Math.PI) / 180) / 2;
  const distancia = (radio / Math.sin(medioFov)) * 1.15;

  return {
    distancia,
    // Los topes del zoom van en proporción al mueble, no en números
    // fijos: así se puede inspeccionar de cerca uno pequeño y el tope
    // inferior no lo impide, sin atravesar uno grande.
    minDistance: Math.max(0.15, radio * 0.45),
    maxDistance: distancia * 2.5,
  };
}

export default function Viewer3D({ piezas = [], modelo = {}, etiqueta = "Vista 3D del modelo", altura = 320 }) {
  const controlesRef = useRef();
  const [girando, setGirando] = useState(false);

  const cajas = construirGeometria3D(piezas, modelo);

  // Encuadre derivado del tamaño real de este mueble (ver calcularEncuadre).
  const encuadre = calcularEncuadre(cajas);
  // La cámara se separa del origen a lo largo de la dirección de vista,
  // a la distancia que necesita el mueble para verse completo.
  const posicionInicial = DIRECCION_VISTA.map((v) => v * encuadre.distancia);

  function alternarGiro() {
    setGirando((valor) => !valor);
  }

  // Zoom explícito moviendo la cámara a lo largo de la recta que la une
  // con el punto que está mirando. A propósito NO se usan
  // dollyIn/dollyOut de OrbitControls: su convención de signo cambió
  // entre versiones de three-stdlib y en la instalada quedaba invertida
  // (el botón + alejaba). Con un factor propio la intención es
  // inequívoca:
  //   factor < 1 -> la cámara se acerca  (Zoom +)
  //   factor > 1 -> la cámara se aleja   (Zoom −)
  function desplazarCamara(factor) {
    const controles = controlesRef.current;
    const camara = controles?.object;
    if (!controles || !camara) return;

    const objetivo = controles.target;
    const direccion = camara.position.clone().sub(objetivo);
    const distanciaActual = direccion.length();

    // Si la cámara quedara justo encima del objetivo no habría dirección
    // que seguir, y setLength() sobre un vector nulo daría NaN.
    if (distanciaActual === 0) return;

    // Se respetan los mismos límites que declara OrbitControls en el
    // JSX, para que el zoom no se salga del rango permitido.
    const distanciaNueva = Math.min(
      controles.maxDistance ?? Infinity,
      Math.max(controles.minDistance ?? 0, distanciaActual * factor)
    );

    direccion.setLength(distanciaNueva);
    camara.position.copy(objetivo).add(direccion);
    controles.update();
  }

  const acercar = () => desplazarCamara(1 / 1.25);
  const alejar = () => desplazarCamara(1.25);

  return (
    <div className="visor">
      {/* El título va ARRIBA y FUERA del lienzo. Antes estaba dentro, y
          como .visor-wrap reparte a sus hijos en fila, el Canvas quedaba
          compartiendo el ancho con el título y con los botones. */}
      {etiqueta && <h3 className="visor-titulo">{etiqueta}</h3>}

      <div className="visor-wrap" style={{ height: altura, minHeight: altura }}>
        <Canvas
          camera={{ position: posicionInicial, fov: FOV_GRADOS }}
          style={{ width: "100%", height: "100%", background: "#FFFFFF" }}
        >
          {/* Luces: lo mínimo necesario para que los materiales sean
              visibles. No son "objetos" del escenario, no dibujan nada
              por sí mismas y no impactan el rendimiento. */}
          <ambientLight intensity={0.7} />
          <directionalLight position={[5, 8, 5]} intensity={0.9} />

          {cajas.map((c) => (
            <Pieza key={c.id} dimensiones={c.dimensiones} posicion={c.posicion} color={c.color} />
          ))}

          <OrbitControls
            ref={controlesRef}
            autoRotate={girando}
            autoRotateSpeed={2.5}
            enablePan={false}
            minDistance={encuadre.minDistance}
            maxDistance={encuadre.maxDistance}
          />
        </Canvas>
      </div>

      {/* Controles DEBAJO del lienzo. El centrado lo hace .visor-ctrl
          con justify-content: center, así que los tres botones quedan
          alineados al eje del visor sea cual sea el ancho disponible. */}
      <div className="visor-ctrl">
        <button type="button" className="btn btn-secondary btn-sm" onClick={alternarGiro}>
          {girando ? "Detener" : "Girar"}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={acercar}>
          Zoom +
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={alejar}>
          Zoom −
        </button>
      </div>
    </div>
  );
}