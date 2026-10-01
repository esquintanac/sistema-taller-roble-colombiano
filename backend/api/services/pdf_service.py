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

    @staticmethod
    def generar_reporte_materiales(modelo_dict, materiales) -> bytes:
        """
        Genera el PDF de materiales y costos de un modelo (RF5).

        Los materiales vienen de modelo_material, así que traen el
        costo_utilizado que quedó CONGELADO al asociarlos: el reporte
        refleja el costo real del mueble, no el precio actual del
        inventario.
        """
        # El total se suma aquí y no en la plantilla: en el HTML sería
        # una suma fila por fila que no puede formatearse como moneda.
        total = sum(float(m.get("costo_utilizado") or 0) for m in materiales)

        html_renderizado = render_to_string("pdf/reporte_materiales.html", {
            "modelo": modelo_dict,
            "materiales": materiales,
            "total": total,
        })
        return HTML(string=html_renderizado).write_pdf()