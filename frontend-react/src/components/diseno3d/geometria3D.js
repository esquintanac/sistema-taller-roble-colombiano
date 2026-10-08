// src/components/diseno3d/geometria3D.js
// Convierte las piezas 2D que calcula el backend
// (CalculadoraService.calcular_piezas) en cajas 3D posicionadas, usando
// las medidas generales del modelo para saber dónde va cada una dentro
// de la estructura del mueble.
//
// Además de dibujar, describe CÓMO se abre cada puerta a partir de
// modelo.tipo_puerta, y añade los cajones, que son solo representación
// visual (ver construirCajones al final del archivo).

const ESCALA = 1 / 50; // 50 cm reales = 1 unidad de la escena 3D

// Acabados que ofrece el formulario. El campo "color" del modelo trae
// blanco, negro, roble o nogal. Si ninguno coincide se usa el marrón de
// siempre, para que un valor inesperado nunca deje el mueble sin pintar.
const COLORES_ACABADO = {
  blanco: "#EDE7DC",
  negro: "#2E2A28",
  roble: "#BF7B3F",
  nogal: "#7A4A17",
};
const COLOR_ESTRUCTURA_POR_DEFECTO = "#BF7B3F";
const COLOR_PUERTA_POR_DEFECTO = "#A65233";

// Radianes que gira una puerta abatible al abrirse: algo más de 90°,
// para que se vea con claridad que queda abierta y no solo perpendicular.
const APERTURA_ABATIBLE = 1.9;

// Aclara un color mezclándolo con blanco. Los cajones se pintan con una
// versión aclarada del acabado, para que se distingan del mueble sin
// necesidad de inventar un color nuevo.
function aclarar(hex, factor = 0.22) {
  const numero = parseInt(String(hex).replace("#", ""), 16);
  if (Number.isNaN(numero)) return hex;
  const canales = [(numero >> 16) & 255, (numero >> 8) & 255, numero & 255];
  const aclarados = canales.map((c) => Math.round(c + (255 - c) * factor));
  return `#${aclarados.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

export function construirGeometria3D(piezas, modelo) {
  const alto = Number(modelo.alto || 0) * ESCALA;
  const ancho = Number(modelo.ancho || 0) * ESCALA;
  const largo = Number(modelo.largo || 0) * ESCALA;
  const grosor = (Number(modelo.grosor || 18) / 10) * ESCALA; // mm -> cm -> escena

  const acabado = COLORES_ACABADO[String(modelo.color || "").toLowerCase()];
  // Con acabado elegido, las puertas van del mismo color que el mueble,
  // que es como se construye de verdad. Sin acabado se conserva el marrón
  // original para no alterar la apariencia de los modelos existentes.
  const colorEstructura = acabado || COLOR_ESTRUCTURA_POR_DEFECTO;
  const colorPuerta = acabado || COLOR_PUERTA_POR_DEFECTO;

  const totalEntrepanos = piezas.filter((p) => p.nombre.includes("Entrepaño")).length;
  const totalPuertas = piezas.filter((p) => p.nombre.includes("Puerta")).length;
  // Los divisores los emite ya el backend; el total solo hace falta para
  // saber en qué punto del ancho va cada uno.
  const totalCompartimientos = Math.max(1, Number(modelo.compartimientos || 1));
  const tipoPuerta = String(modelo.tipo_puerta || "corrediza").toLowerCase();

  let indiceEntrepano = 0;
  let indicePuerta = 0;
  let indiceDivisor = 0;

  const cajas = piezas.map((pieza, i) => {
    const nombre = pieza.nombre || "";
    const anchoReal = Number(pieza.ancho || 0) * ESCALA;
    const altoReal = Number(pieza.alto || 0) * ESCALA;

    if (nombre.includes("Panel lateral izquierdo")) {
      return caja(i, [grosor, alto, anchoReal], [-ancho / 2 + grosor / 2, 0, 0], colorEstructura);
    }
    if (nombre.includes("Panel lateral derecho")) {
      return caja(i, [grosor, alto, anchoReal], [ancho / 2 - grosor / 2, 0, 0], colorEstructura);
    }
    if (nombre.includes("Base inferior")) {
      return caja(i, [ancho, grosor, altoReal], [0, -alto / 2 + grosor / 2, 0], colorEstructura);
    }
    if (nombre.includes("Techo")) {
      return caja(i, [ancho, grosor, altoReal], [0, alto / 2 - grosor / 2, 0], colorEstructura);
    }
    if (nombre.includes("Entrepaño")) {
      indiceEntrepano += 1;
      const espacioUtil = alto - grosor * 2;
      const y = -alto / 2 + grosor + (espacioUtil * indiceEntrepano) / (totalEntrepanos + 1);
      return caja(i, [anchoReal, grosor, altoReal], [0, y, 0], colorEstructura);
    }
    // Divisor vertical: pieza real que emite el backend. Se reparte por el
    // ancho del hueco interior con el mismo criterio que los entrepaños usan
    // para la altura.
    if (nombre.includes("Divisor vertical")) {
      indiceDivisor += 1;
      const espacioUtil = ancho - grosor * 2;
      const x = -ancho / 2 + grosor + (espacioUtil * indiceDivisor) / totalCompartimientos;
      return caja(
        i,
        [grosor, alto - grosor * 2, largo - grosor],
        [x, 0, 0],
        colorEstructura,
        { tipo: "divisor" }
      );
    }
    if (nombre.includes("Puerta")) {
      indicePuerta += 1;
      const anchoPuerta = ancho / totalPuertas;
      const x = -ancho / 2 + anchoPuerta * (indicePuerta - 0.5);
      const zFrente = largo / 2 - grosor / 2;
      const medida = anchoPuerta - 0.02;
      const posicion = [x, 0, zFrente];

      // ABATIBLE: gira sobre su canto exterior, que es la bisagra. La mitad
      // izquierda abre hacia la izquierda y la derecha hacia la derecha; si
      // el número es impar, la puerta central cuelga de la bisagra izquierda,
      // para que quede junto al resto y no suelta en medio.
      const sentido = indicePuerta <= Math.ceil(totalPuertas / 2) ? -1 : 1;

      // CORREDIZA (movimiento real de riel): la puerta NO se va hacia afuera
      // del mueble —antes quedaba flotando en el aire pegada a un costado—.
      // Se desliza hacia un lado ENCIMA de su vecina, sin salirse jamás del
      // ancho del mueble, como en un mueble con rieles de verdad. Para poder
      // cruzarse con la vecina, al abrir cada puerta "sube" primero al riel
      // de afuera: avanza en +z (hacia el observador) y enseguida corre en x.
      // Cerradas siguen todas en el mismo plano (la fachada no cambia);
      // abiertas nunca ocupan el mismo sitio: los pares suben 1 grosor y los
      // impares 2, de modo que hay riel para cada pareja de puertas.
      const zona = indicePuerta - 1; // índice 0-based de la puerta
      const via = grosor * (zona % 2 === 0 ? 1 : 2);

      // Hacia dónde corre: las impares se aparcan sobre su vecina izquierda
      // y las pares sobre la derecha. La última puerta de un mueble impar es
      // par y no tiene vecina a la derecha, así que también va a la izquierda.
      // Con una sola puerta no hay vecina donde aparcarse: se abre media
      // anchura, lo único que cabe dentro del mueble.
      let recorrido = anchoPuerta;
      if (totalPuertas === 1) {
        recorrido = -anchoPuerta * 0.5;
      } else if (zona % 2 === 1 || zona === totalPuertas - 1) {
        recorrido = -anchoPuerta;
      }

      const apertura =
        tipoPuerta === "abatible"
          ? {
              modo: "abatible",
              bisagra: [x + (sentido * medida) / 2, 0, zFrente],
              angulo: sentido * APERTURA_ABATIBLE,
            }
          : {
              modo: "corrediza",
              zona,
              recorrido,
              via,
              // Zona en la que queda aparcada al abrir. Sirve para detectar
              // en el visor si dos puertas del mismo riel chocan (ver
              // calcularPuertasBloqueadas).
              zonaObjetivo: zona + (recorrido > 0 ? 1 : -1),
              // El botón "Abrir puertas" abre solo las de zona impar: al
              // apilarse sobre su vecina izquierda descubren el hueco. Abrir
              // todas a la vez las cruzaría entre sí y el mueble quedaría
              // tapado otra vez, como si no se hubiera abierto nada.
              abreConBoton: zona % 2 === 1 || totalPuertas === 1,
            };

      return caja(i, [medida, altoReal, grosor], posicion, colorPuerta, {
        tipo: "puerta",
        apertura,
      });
    }
    if (nombre.includes("Fondo trasero")) {
      return caja(i, [ancho, alto, grosor], [0, 0, -largo / 2 + grosor / 2], colorEstructura);
    }

    // Pieza no reconocida por el patrón de nombre: se dibuja igual,
    // para que ninguna pieza calculada quede sin representar.
    return caja(i, [anchoReal, altoReal, grosor], [0, 0, largo / 2], colorEstructura);
  });

  return [
    ...cajas,
    ...construirCajones(modelo, ancho, alto, largo, grosor, totalEntrepanos, colorEstructura),
  ];
}

/**
 * Cajones: REPRESENTACIÓN VISUAL SIMPLIFICADA.
 *
 * Cada cajón se dibuja como una sola caja sólida, únicamente para marcar
 * "aquí va un cajón". NO son piezas de corte: el backend todavía no calcula
 * las piezas internas de un cajón (lados, fondo, rieles), así que no salen
 * ni en "Piezas a cortar" ni en el reporte de construcción en PDF.
 *
 * MEJORA PENDIENTE: desglosar cada cajón en sus piezas reales y sumarlas
 * dentro de calcular_piezas(), de modo que también entren en el reporte y
 * en el cálculo de la lámina de melanina.
 *
 * Se apilan en el primer compartimento —el hueco por debajo del primer
 * entrepaño— para que no se atraviesen con las baldas.
 */
function construirCajones(modelo, ancho, alto, largo, grosor, totalEntrepanos, color) {
  const cantidad = Math.max(0, Math.min(12, Math.floor(Number(modelo.cajones || 0))));
  if (!cantidad) return [];

  const espacioUtil = alto - grosor * 2;
  const altoCompartimento = espacioUtil / (totalEntrepanos + 1);
  // Se descuenta el grosor del entrepaño para que el cajón de arriba quede
  // justo debajo de la balda y no la atraviese.
  const altoCajon = Math.max((altoCompartimento - grosor) / cantidad, 0.02);
  const anchoCajon = ancho - grosor * 2 - 0.02;
  const fondoCajon = largo - grosor * 2 - 0.04;

  return Array.from({ length: cantidad }, (_, i) => {
    const y = -alto / 2 + grosor + altoCajon * (i + 0.5);
    return {
      id: `cajon-${i + 1}`,
      dimensiones: [anchoCajon, altoCajon - 0.01, fondoCajon],
      posicion: [0, y, 0],
      color: aclarar(color),
      tipo: "cajon",
      visual: true, // no es una pieza de corte (ver nota de la función)
    };
  });
}

function caja(id, dimensiones, posicion, color, extra = {}) {
  return { id, dimensiones, posicion, color, tipo: "estructura", visual: false, ...extra };
}

/**
 * Resuelve los choques entre puertas corredizas del MISMO riel.
 *
 * Regla física: en un riel una puerta no puede pasar por encima de otra del
 * mismo riel, así que dos puertas no pueden aparcarse en la misma zona. En
 * la práctica solo ocurre con las puertas pares cuando el total de puertas
 * es impar (por ejemplo, con 3 puertas: la primera y la última querrían ir
 * a la zona del medio). Gana la que se abrió PRIMERO —la que ya está en la
 * pista— y la otra se queda quieta, igual que en un mueble real, donde se
 * detiene contra la puerta que ya ocupa la zona.
 *
 * `abiertas` es el mapa id -> orden de apertura (0 = cerrada) que mantiene
 * Viewer3D. Devuelve { idPuerta: true } con las que no deben moverse.
 */
export function calcularPuertasBloqueadas(puertas, abiertas) {
  const bloqueadas = {};
  const porZonaObjetivo = {};

  puertas.forEach((p) => {
    if (!abiertas[p.id] || p.apertura?.modo !== "corrediza") return;
    const zona = p.apertura.zonaObjetivo;
    (porZonaObjetivo[zona] = porZonaObjetivo[zona] || []).push(p);
  });

  Object.values(porZonaObjetivo).forEach((grupo) => {
    if (grupo.length < 2) return;
    // Menor orden de apertura = la que llegó primero = la dueña de la zona.
    const ganadora = grupo.reduce((a, b) =>
      abiertas[a.id] <= abiertas[b.id] ? a : b
    );
    grupo.forEach((p) => {
      if (p !== ganadora) bloqueadas[p.id] = true;
    });
  });

  return bloqueadas;
}