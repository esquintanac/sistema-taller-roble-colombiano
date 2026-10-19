// _test_formato.mjs — prueba rápida (node _test_formato.mjs) del formato de
// miles mientras se escribe en el formulario de materiales. Se ejecuta desde
// frontend-react/ y borra su archivo temporal al terminar.
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import assert from "node:assert";

const { soloDigitos, formatearMiles } = await import("./src/utils/numeros.js");

// ---- utilidades puras ----
assert.strictEqual(soloDigitos("1.234"), "1234");
assert.strictEqual(soloDigitos(""), "");
assert.strictEqual(soloDigitos(null), "");
assert.strictEqual(soloDigitos("a1-b2"), "12");
assert.strictEqual(formatearMiles("9999999"), "9.999.999");
assert.strictEqual(formatearMiles("999999"), "999.999");
assert.strictEqual(formatearMiles("99999"), "99.999");
assert.strictEqual(formatearMiles("85000"), "85.000");
assert.strictEqual(formatearMiles("123456"), "123.456");
assert.strictEqual(formatearMiles("1234"), "1.234");
assert.strictEqual(formatearMiles("123"), "123");
assert.strictEqual(formatearMiles("0"), "0");
assert.strictEqual(formatearMiles(""), "");
assert.strictEqual(formatearMiles("1.234"), "1.234"); // re-formateo idempotente

// ---- limitarNumero REAL (solo se mockea el import de axios) ----
let fuente = readFileSync("./src/services/materialesService.js", "utf8");
fuente = fuente.replace('import api from "./api";', "const api = {};");
// Node ESM exige la extensión explícita (Vite la resuelve solo):
fuente = fuente.replace('from "../utils/numeros"', 'from "../utils/numeros.js"');
const rutaTmp = "./src/services/_materialesService.tmp.mjs";
writeFileSync(rutaTmp, fuente, "utf8");
let limitarNumero;
try {
    const mod = await import("./src/services/_materialesService.tmp.mjs");
    limitarNumero = mod.limitarNumero;
} finally {
    unlinkSync(rutaTmp);
}

const casos = [
    // tope de 7 dígitos: 8 dígitos se recortan a 9.999.999
    ["costo_unitario", "9999999", "9.999.999"],
    ["costo_unitario", "99999999", "9.999.999"],
    // tope de 6 dígitos
    ["stock", "123456", "123.456"],
    ["stock", "1234567", "123.456"],
    // tope de 5 dígitos
    ["stock_minimo", "99999", "99.999"],
    // vacío y basura
    ["stock", "", ""],
    ["stock", "abc", null],
    // lo que ya viene formateado se re-procesa igual (se escribe sobre ello)
    ["stock", "1.234", "1.234"],
    // un punto decimal tecleado se descarta: solo se conservan dígitos
    ["costo_unitario", "1500.5", "15.005"],
    // campos no numéricos pasan tal cual
    ["nombre_material", "Lámina 18mm", "Lámina 18mm"],
];
for (const [campo, entrada, esperado] of casos) {
    assert.strictEqual(
        limitarNumero(campo, entrada),
        esperado,
        `limitarNumero(${campo}, ${JSON.stringify(entrada)})`
    );
}

// secuencia de tecleo típica: 1 -> 12 -> 123 -> 1.234 -> 12.345 -> 123.456
let estado = "";
for (const crudo of ["1", "12", "123", "1234", "12345", "123456"]) {
    estado = limitarNumero("stock", crudo);
}
assert.strictEqual(estado, "123.456");

console.log("OK: soloDigitos, formatearMiles y limitarNumero pasan todos los casos");
