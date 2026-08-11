"""
Middleware de validación general de solicitudes.
Ruta: backend/api/middlewares/validation_middleware.py

Un middleware se ejecuta ANTES de que la solicitud llegue al
controlador. Aquí se usa para rechazar solicitudes que no envían
JSON en el cuerpo, evitando que el error explote más adelante en
el controlador sin un mensaje claro.
"""

import json


class ValidacionJSONMiddleware:
    """Verifica que las solicitudes POST/PUT tengan un cuerpo JSON válido."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in ("POST", "PUT") and request.path.startswith("/api/"):
            if request.body:
                try:
                    json.loads(request.body)
                except json.JSONDecodeError:
                    from django.http import JsonResponse
                    return JsonResponse(
                        {"exito": False, "mensaje": "El cuerpo de la solicitud debe ser JSON válido."},
                        status=400,
                    )
        return self.get_response(request)