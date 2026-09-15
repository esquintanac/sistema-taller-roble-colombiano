"""
Servicio de generacion de PDF con WeasyPrint.
Ruta: backend/api/services/pdf_service.py
"""

from django.template.loader import render_to_string
from weasyprint import HTML

class PDFService:

    @staticmethod
    def generar_reporte_carpintero(modelo_dict, piezas, melanina) -> bytes:
        """Genera el PDF del reporte de construcción (RF5, HU-02)."""
        html_renderizado = render_to_string("pdf/reporte_carpintero.html", {
            "modelo": modelo_dict, "piezas": piezas, "melanina": melanina,
        })
        return HTML(string=html_renderizado).write_pdf()

    @staticmethod
    def generar_reporte_admin(factura_dict) -> bytes:
        """Genera el PDF del reporte de costos (RF10, HU-04)."""
        html_renderizado = render_to_string("pdf/reporte_admin.html", {
            "factura": factura_dict,
        })
        return HTML(string=html_renderizado).write_pdf()