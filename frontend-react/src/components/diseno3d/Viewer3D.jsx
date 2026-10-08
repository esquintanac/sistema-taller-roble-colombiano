// src/components/diseno3d/Viewer3D.jsx
// Visor 3D real del modelo, construido con React Three Fiber a partir
// de las piezas y medidas que calcula el backend
// (GET /api/modelos/<id>/diseno/). Escena minimalista: solo el objeto
// y la luz mínima necesaria para verlo, sin piso, cuadrícula ni fondo
// decorativo que afecte el rendimiento.
//
// Las puertas son interactivas: se abren con un clic (o con el botón
// "Abrir puertas") para poder ver el interior del mueble, que si no queda
// tapado por la madera. Los cajones son solo representación visual: el
// backend aún no calcula sus piezas internas (ver geometria3D.js).

import { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Edges } from "@react-three/drei";
import { construirGeometria3D, calcularPuertasBloqueadas } from "./geometria3D";

function Pieza({ dimensiones, posicion, color }) {
  return (
    <mesh position={posicion}>
      <boxGeometry args={dimensiones} />
      <meshStandardMaterial color={color} />
      <Edges color="#142624" />
    </mesh>
  );
}

// Puerta que se abre. Según modelo.tipo_puerta hace una cosa u otra:
// abatible -> gira sobre su canto exterior; corrediza -> "sube" al riel de
// afuera (sale en +z, hacia el observador) y corre lateralmente hasta
// aparcarse ENCIMA de la puerta vecina, sin salirse nunca del ancho del
// mueble. El movimiento va con useFrame y no con una librería de animación:
// son unas pocas líneas y así el proyecto no gana una dependencia nueva.
//
// El grupo se ancla donde tiene que pivotar: en la bisagra si gira, o en el
// centro de la pieza si se desliza, con la caja desplazada dentro. Sin eso
// una puerta abatible rotaría sobre sí misma en lugar de abrirse.
function Puerta({ caja, abierta, onAlternar }) {
  const grupo = useRef(null);
  // 0 = cerrada, 1 = abierta. Se interpola en cada fotograma hacia el
  // destino, en vez de saltar de golpe.
  const progreso = useRef(0);
  const { modo, bisagra, angulo, recorrido = 0, via = 0 } = caja.apertura;

  const ancla = modo === "abatible" ? bisagra : caja.posicion;
  const local = [
    caja.posicion[0] - ancla[0],
    caja.posicion[1] - ancla[1],
    caja.posicion[2] - ancla[2],
  ];

  useFrame((estado, delta) => {
    if (!grupo.current) return;
    // Interpolación exponencial: la puerta se abre siempre a la misma
    // velocidad visual, vaya el navegador a 30 o a 144 fotogramas.
    const factor = 1 - Math.exp(-8 * delta);
    progreso.current += ((abierta ? 1 : 0) - progreso.current) * factor;

    if (modo === "abatible") {
      grupo.current.rotation.y = progreso.current * angulo;
    } else {
      // Corrediza: el z llega casi al principio del movimiento (como si la
      // puerta saliera de su pista) y enseguida corre en x hasta aparcarse
      // sobre la vecina. Todo dentro del ancho del mueble.
      const avanceRiel = Math.min(1, progreso.current * 2.5);
      grupo.current.position.set(
        caja.posicion[0] + recorrido * progreso.current,
        caja.posicion[1],
        caja.posicion[2] + via * avanceRiel
      );
    }
  });

  return (
    <group ref={grupo} position={ancla}>
      <mesh
        position={local}
        onClick={(evento) => {
          evento.stopPropagation();
          // Si el puntero se movió mucho, lo que el usuario estaba haciendo
          // era girar el mueble, no abrir la puerta.
          if (evento.delta > 2) return;
          onAlternar();
        }}
        onPointerOver={(evento) => {
          evento.stopPropagation();
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          document.body.style.cursor = "";
        }}
      >
        <boxGeometry args={caja.dimensiones} />
        <meshStandardMaterial color={caja.color} />
        <Edges color="#142624" />
      </mesh>
    </group>
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

  // ---- Puertas ----
  // Estado por id de pieza, para poder abrir una sola sin afectar a las
  // demás. El valor NO es un booleano sino el ORDEN en el que se abrió
  // (contador; 0 = cerrada): con él se resuelve quién gana cuando dos
  // corredizas del mismo riel quieren aparcarse en la misma zona —gana la
  // que llegó primero, como en un riel real, donde una puerta no puede
  // pasar por encima de otra del mismo riel—. Los ids son estables porque
  // construirGeometria3D los numera por posición, así que el estado
  // sobrevive a los re-render.
  const [abiertas, setAbiertas] = useState({});
  const ordenAperturas = useRef(0);
  const puertas = cajas.filter((c) => c.tipo === "puerta");
  const hayPuertas = puertas.length > 0;
  const algunaAbierta = puertas.some((c) => abiertas[c.id]);
  const bloqueadas = calcularPuertasBloqueadas(puertas, abiertas);

  function alternarPuerta(id) {
    setAbiertas((previas) => {
      if (previas[id]) return { ...previas, [id]: 0 };
      ordenAperturas.current += 1;
      return { ...previas, [id]: ordenAperturas.current };
    });
  }

  function alternarTodasLasPuertas() {
    const abrir = !algunaAbierta;
    setAbiertas((previas) => {
      const siguiente = { ...previas };
      puertas.forEach((p) => {
        // Corredizas: el botón abre solo las que pueden apilarse (las de
        // zona impar, que se aparcan sobre su vecina izquierda y descubren
        // el hueco). Abrir TODAS a la vez las cruzaría entre sí y el
        // mueble quedaría tapado otra vez, como sin abrir. Las abatibles
        // sí se abren todas: cada una gira en su propia bisagra.
        const puedeAbrir =
          p.apertura?.modo !== "corrediza" || p.apertura.abreConBoton;
        if (abrir && puedeAbrir) {
          ordenAperturas.current += 1;
          siguiente[p.id] = ordenAperturas.current;
        } else {
          siguiente[p.id] = 0;
        }
      });
      return siguiente;
    });
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

          {/* Las puertas son piezas interactivas; el resto se dibuja como
              cajas fijas. */}
          {cajas.map((c) =>
            c.tipo === "puerta" ? (
              <Puerta
                key={c.id}
                caja={c}
                // Si la puerta quedó bloqueada por otra del mismo riel que
                // llegó primero a su zona, se comporta como cerrada (ver
                // calcularPuertasBloqueadas en geometria3D.js).
                abierta={Boolean(abiertas[c.id]) && !bloqueadas[c.id]}
                onAlternar={() => alternarPuerta(c.id)}
              />
            ) : (
              <Pieza key={c.id} dimensiones={c.dimensiones} posicion={c.posicion} color={c.color} />
            )
          )}

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
        {hayPuertas && (
          <button type="button" className="btn btn-primary btn-sm" onClick={alternarTodasLasPuertas}>
            {algunaAbierta ? "Cerrar puertas" : "Abrir puertas"}
          </button>
        )}
      </div>

      {hayPuertas && (
        <p className="visor-pista">Haz clic en una puerta para abrirla o cerrarla.</p>
      )}
    </div>
  );
}