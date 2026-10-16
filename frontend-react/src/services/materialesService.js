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

// Límites acordados por el negocio, todos por debajo del tamaño real de las
// columnas de MySQL (decimal(10,2) admite hasta 99.999.999,99, así que
// ninguna restricción choca con la base). El backend los repite en
// MaterialService para que nadie salte la regla llamando a la API directo.
export const LIMITES_MATERIAL = {
  nombre: 60, // entre 40 y 100: se eligió 60 (los nombres actuales no pasan de 24)
  costoMaximo: 9999999.99, // 7 dígitos + 2 decimales
  stockMaximo: 999999.99, // 6 dígitos
  stockMinimoMaximo: 9999.99, // 5 dígitos
};

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