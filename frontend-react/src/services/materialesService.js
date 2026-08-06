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

const materialesService = {
    listar: async () => {
        const respuesta = await api.get("/materiales/");
        return respuesta.data;
    },

    obtenerPorId: async (id) => {
        const respuesta = await api.get("/materiales/${id}/");
        return respuesta.data;
    },

    crear: async (material) => {
        const respuesta = await api.post("/materiales/", material);
        return respuesta.data;
    },

    actualizar: async (id, material) => {
        const respuesta = await api.put("/materiales/${id}/", material);
        return respuesta.data;
    },

    eliminar: async (id) => {
        const respuesta = await api.delete("/materiales/${id}/")
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