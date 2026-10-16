// src/services/materialesService.js
// Servicio que conecta el módulo de Materiales con el backend Django
// a través de axios, cubriendo las 4 operaciones CRUD ya construidas
// y probadas en las evidencias de backend anteriores.
//
// IMPORTANTE: estos endpoints requieren que el backend exponga una
// API REST en JSON (Django REST Framework) en lugar de las vistas
// con templates HTML usadas en evidencias anteriores. Ver nota al
// final de este archivo.

import api from "./api";

// Opciones cerradas para el formulario de materiales. El tipo y la unidad
// no son texto libre porque el sistema los usa como reglas: las láminas del
// panel de administración se filtran con el tipo "tablero" (ver
// AdminDesignDetailPage), y el costo se interpreta según la unidad (metro,
// caja, unidad…). Los values repiten los valores que ya existen en la base
// (Tablero, Ferreteria, Herraje, Lamina…) para que los materiales
// registrados antes de esta restricción sigan coincidiendo.
export const TIPOS_MATERIAL = [
  { value: "Tablero", label: "Tablero (láminas y paneles)" },
  { value: "Herraje", label: "Herraje (bisagras, correderas, manijas)" },
  { value: "Ferreteria", label: "Ferretería (tornillos y fijaciones)" },
  { value: "Adhesivo", label: "Adhesivo y selladores" },
  { value: "Pintura y barniz", label: "Pintura y barniz" },
  { value: "Madera", label: "Madera" },
  { value: "Herramienta", label: "Herramienta" },
  { value: "Servicio", label: "Servicio externo" },
  { value: "Otro", label: "Otro" },
];

export const UNIDADES_MEDIDA = [
  { value: "Unidad", label: "Unidad" },
  { value: "Par", label: "Par" },
  { value: "Juego", label: "Juego" },
  { value: "Caja", label: "Caja" },
  { value: "Metro", label: "Metro" },
  { value: "Metro lineal", label: "Metro lineal" },
  { value: "Metro cuadrado", label: "Metro cuadrado" },
  { value: "Lamina", label: "Lámina" },
  { value: "Rollo", label: "Rollo" },
  { value: "Kilogramo", label: "Kilogramo" },
  { value: "Litro", label: "Litro" },
];

// Límites de escritura del formulario de materiales. Precios y stock son
// PESOS ENTEROS: los decimales casi no se usan en Colombia en estas cifras,
// así que los tres campos numéricos solo aceptan dígitos y cortan la
// escritura al llegar al tope (el mismo efecto que maxLength en el nombre).
// Todos los topes quedan por debajo de las columnas reales de MySQL
// (decimal(10,2) admite hasta 99.999.999,99); el backend los repite en
// MaterialService para que nadie salte la regla llamando a la API directo.
export const LIMITES_MATERIAL = {
  nombre: 60, // entre 40 y 100: se eligió 60 (los nombres actuales no pasan de 24)
  costoMaximo: 9999999, // 7 dígitos
  stockMaximo: 999999, // 6 dígitos
  stockMinimoMaximo: 99999, // 5 dígitos
};

// Dígitos de la parte entera de cada tope, derivados del tope mismo
// (9999999 -> 7, 999999 -> 6, 99999 -> 5): recortar a esa cantidad de
// dígitos garantiza que el valor nunca supere el tope numérico, porque los
// tres topes son todos 9 (10^n - 1). maxLength del input corta primero;
// este recorte es la red de seguridad para pegados o valores programáticos.
const DIGITOS_ENTEROS = {
  costo_unitario: String(Math.trunc(LIMITES_MATERIAL.costoMaximo)).length,
  stock: String(Math.trunc(LIMITES_MATERIAL.stockMaximo)).length,
  stock_minimo: String(Math.trunc(LIMITES_MATERIAL.stockMinimoMaximo)).length,
};

/**
 * Filtra lo que se escribe en un campo numérico.
 *
 * @param {string} nombreCampo name del input; los que no son numéricos
 *                             (nombre, selects) pasan tal cual.
 * @param {string} valor       valor crudo del evento onChange.
 * @returns {string|null}      valor a guardar recortado a los dígitos del
 *                             tope; null si no es un entero válido
 *                             ("1500.5", "-", "1e5", letras), lo que hace
 *                             que el campo conserve el valor anterior.
 */
export function limitarNumero(nombreCampo, valor) {
  const digitos = DIGITOS_ENTEROS[nombreCampo];
  if (digitos === undefined) return valor;
  if (valor === "") return "";
  if (!/^\d+$/.test(valor)) return null;
  return valor.length > digitos ? valor.slice(0, digitos) : valor;
}

const materialesService = {
    listar: async () => {
        const respuesta = await api.get("/materiales/");
        return respuesta.data;
    },

    obtenerPorId: async (id) => {
        const respuesta = await api.get(`/materiales/${id}/`);
        return respuesta.data;
    },

    crear: async (material) => {
        const respuesta = await api.post("/materiales/", material);
        return respuesta.data;
    },

    actualizar: async (id, material) => {
        const respuesta = await api.put(`/materiales/${id}/`, material);
        return respuesta.data;
    },

    eliminar: async (id) => {
        const respuesta = await api.delete(`/materiales/${id}/`);
        return respuesta.data;
    },
};

export default materialesService;

/*
  NOTA PARA EL BACKEND (Django):
  1. pip install djangorestframework
  2. Crear serializers.py con MaterialSerializer
  3. Agregar rutas /api/materiales/ usando MaterialDAO dentro de
     una vista basada en APIView o ViewSet de DRF.
  4. Instalar django-cors-headers para permitir que React (5173)
     consuma la API de Django (8000).
*/