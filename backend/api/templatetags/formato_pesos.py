"""
Filtros de plantilla para dar formato monetario en los PDF.
Ruta: backend/api/templatetags/formato_pesos.py
"""

from decimal import Decimal, ROUND_HALF_UP

from django import template

register = template.Library()


@register.filter
def pesos(valor):
    """Formatea un valor como pesos colombianos ENTEROS.

    En la practica colombiana no se manejan centavos: el PDF debe mostrar
    "$371.450", nunca "$371450.00". El redondeo es al peso mas cercano
    (ROUND_HALF_UP). Solo cambia la PRESENTACION: el calculo que se guarda
    en la base de datos conserva su precision.

    Ejemplos: 371450.00 -> "$371.450" · 17276.74 -> "$17.277"
    """
    if valor in (None, ""):
        return "$0"
    try:
        entero = int(
            Decimal(str(valor)).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
        )
    except (ValueError, TypeError, ArithmeticError):
        # Si llega algo que no es numerico, se muestra tal cual en vez de
        # romper la generacion del PDF completo.
        return str(valor)
    return f"${entero:,}".replace(",", ".")
