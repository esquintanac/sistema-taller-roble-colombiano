// _test_limites.mjs — prueba rápida (node _test_limites.mjs) de las reglas
// de límite del asistente de modelos: los rangos de negocio y la regla
// "barra/zócalo < alto del mueble". Se ejecuta desde frontend-react/.
// Cubre también el caso en que un campo con interruptor apagado NO debe
// validarse (si se validara, un valor residual en un campo invisible
// bloquearía el registro sin que el usuario pueda corregirlo).
import assert from "node:assert";

const { validarRangos, LIMITES_RANGO } = await import("./src/components/modelo/limitesModelo.js");

const CAMPOS = Object.keys(LIMITES_RANGO);
const base = {
  alto: "200", ancho: "100", largo: "60",
  numCajones: "3", alturaBarra: "150", alturaZocalo: "10",
  llevaCajones: true, llevaBarra: true, llevaZocalo: true,
};

// ---- un modelo válido no produce errores ----
assert.deepStrictEqual(validarRangos(base, CAMPOS), {}, "modelo válido sin errores");

// ---- rangos de las medidas ----
assert.ok(validarRangos({ ...base, alto: "9" }, CAMPOS).alto, "alto por debajo del mínimo");
assert.ok(validarRangos({ ...base, alto: "301" }, CAMPOS).alto, "alto por encima del máximo");
assert.ok(validarRangos({ ...base, ancho: "9" }, CAMPOS).ancho, "ancho por debajo del mínimo");
assert.ok(validarRangos({ ...base, ancho: "501" }, CAMPOS).ancho, "ancho por encima del máximo");
assert.ok(validarRangos({ ...base, largo: "9" }, CAMPOS).largo, "largo por debajo del mínimo");
assert.ok(validarRangos({ ...base, largo: "121" }, CAMPOS).largo, "largo por encima del máximo");

// ---- rangos de barra, zócalo y cajones ----
assert.ok(validarRangos({ ...base, alturaBarra: "29" }, CAMPOS).alturaBarra, "barra por debajo de 30");
assert.ok(validarRangos({ ...base, alturaBarra: "301" }, CAMPOS).alturaBarra, "barra por encima de 300");
assert.ok(validarRangos({ ...base, alturaZocalo: "0.5" }, CAMPOS).alturaZocalo, "zócalo por debajo de 1");
assert.ok(validarRangos({ ...base, alturaZocalo: "31" }, CAMPOS).alturaZocalo, "zócalo por encima de 30");
assert.ok(validarRangos({ ...base, numCajones: "0" }, CAMPOS).numCajones, "cajones por debajo de 1");
assert.ok(validarRangos({ ...base, numCajones: "11" }, CAMPOS).numCajones, "cajones por encima de 10");

// ---- los valores límite exactos SÍ se aceptan ----
assert.ok(!validarRangos({ ...base, alturaBarra: "30" }, CAMPOS).alturaBarra, "barra 30 válida");
assert.ok(!validarRangos({ ...base, alturaZocalo: "1" }, CAMPOS).alturaZocalo, "zócalo 1 válido");
assert.ok(!validarRangos({ ...base, alturaZocalo: "30" }, CAMPOS).alturaZocalo, "zócalo 30 válido");
assert.ok(!validarRangos({ ...base, numCajones: "1" }, CAMPOS).numCajones, "1 cajón válido");
assert.ok(!validarRangos({ ...base, numCajones: "10" }, CAMPOS).numCajones, "10 cajones válidos");

// El máximo de la barra (300) choca con la regla "barra < alto" (alto máx.
// 300): una barra de 300 nunca cabe, así que el error que debe reportar es
// el de la regla cruzada, no el de rango.
const barra300 = validarRangos({ ...base, alto: "300", alturaBarra: "300" }, CAMPOS);
assert.ok(
  barra300.alturaBarra?.includes("menor que el alto"),
  "barra 300 falla por la regla cruzada, no por el rango"
);
// Con el alto máximo (300), la barra más alta que sí cabe es 299.
assert.ok(
  !validarRangos({ ...base, alto: "300", alturaBarra: "299" }, CAMPOS).alturaBarra,
  "barra 299 con alto 300 es válida"
);

// ---- regla entre campos: barra y zócalo deben caber en el alto ----
const barraAlTope = validarRangos({ ...base, alturaBarra: "200" }, CAMPOS);
assert.ok(barraAlTope.alturaBarra, "barra igual al alto es error");
const zocaloAlTope = validarRangos({ ...base, alturaZocalo: "200" }, CAMPOS);
assert.ok(zocaloAlTope.alturaZocalo, "zócalo mayor que el alto es error");

// ---- un interruptor apagado NO se valida (campo oculto) ----
const barraApagada = validarRangos(
  { ...base, llevaBarra: false, alturaBarra: "5" },
  CAMPOS
);
assert.strictEqual(barraApagada.alturaBarra, undefined, "barra apagada no se valida");
const zocaloApagado = validarRangos(
  { ...base, llevaZocalo: false, alturaZocalo: "0.2" },
  CAMPOS
);
assert.strictEqual(zocaloApagado.alturaZocalo, undefined, "zócalo apagado no se valida");
const cajonesApagados = validarRangos(
  { ...base, llevaCajones: false, numCajones: "0" },
  CAMPOS
);
assert.strictEqual(cajonesApagados.numCajones, undefined, "cajones apagados no se validan");

// ---- los campos vacíos se ignoran (los cubre la validación de obligatorios) ----
assert.deepStrictEqual(
  validarRangos({ ...base, alturaBarra: "" }, CAMPOS),
  {},
  "campo vacío no genera error de rango"
);

// ---- valores no numéricos ----
assert.ok(validarRangos({ ...base, alto: "abc" }, CAMPOS).alto, "alto no numérico");

console.log("OK: validarRangos pasa todos los casos");
