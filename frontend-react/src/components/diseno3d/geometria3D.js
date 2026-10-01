// src/components/diseno3d/geometria3D.js
// Convierte las piezas 2D que calcula el backend
// (CalculadoraService.calcular_piezas) en cajas 3D posicionadas,
// usando las medidas generales del modelo para saber dónde va cada
// una dentro de la estructura del mueble.

const ESCALA = 1 / 50; // 50 cm reales = 1 unidad de la escena 3D

export function construirGeometria3D(piezas, modelo) {
  const alto = Number(modelo.alto || 0) * ESCALA;
  const ancho = Number(modelo.ancho || 0) * ESCALA;
  const largo = Number(modelo.largo || 0) * ESCALA;
  const grosor = (Number(modelo.grosor || 18) / 10) * ESCALA; // mm -> cm -> escena

  const colorEstructura = "#BF7B3F";
  const colorPuerta = "#A65233";

  const totalEntrepanos = piezas.filter((p) => p.nombre.includes("Entrepaño")).length;
  const totalPuertas = piezas.filter((p) => p.nombre.includes("Puerta")).length;
  let indiceEntrepano = 0;
  let indicePuerta = 0;

  return piezas.map((pieza, i) => {
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
    if (nombre.includes("Puerta")) {
      indicePuerta += 1;
      const anchoPuerta = ancho / totalPuertas;
      const x = -ancho / 2 + anchoPuerta * (indicePuerta - 0.5);
      return caja(i, [anchoPuerta - 0.02, altoReal, grosor], [x, 0, largo / 2 - grosor / 2], colorPuerta);
    }
    if (nombre.includes("Fondo trasero")) {
      return caja(i, [ancho, alto, grosor], [0, 0, -largo / 2 + grosor / 2], colorEstructura);
    }

    // Pieza no reconocida por el patrón de nombre: se dibuja igual,
    // para que ninguna pieza calculada quede sin representar.
    return caja(i, [anchoReal, altoReal, grosor], [0, 0, largo / 2], colorEstructura);
  });
}

function caja(id, dimensiones, posicion, color) {
  return { id, dimensiones, posicion, color };
}