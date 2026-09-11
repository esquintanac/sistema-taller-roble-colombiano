"""
Servicio de Historial: reglas de negocio para consultar y
actualizar el estado de revisión.
Ruta: backend/api/services/historial_service.py
"""

from src.dao.historial_dao import HistorialDAO


class HistorialService:
    dao = HistorialDAO()

    ESTADOS_VALIDOS = ["Nuevo", "Revisado"]

    @classmethod
    def listar(cls):
        return cls.dao.consultar_historial()

    @classmethod
    def obtener(cls, id_historial):
        return cls.dao.consultar_historial_por_id(id_historial)

    @classmethod
    def marcar_como_revisado(cls, id_historial):
        """Cambia el estado de un registro a 'Revisado' (RF9)."""
        existente = cls.dao.consultar_historial_por_id(id_historial)
        if existente is None:
            return None

        cls.dao.actualizar_estado_revision(id_historial, "Revisado")
        return cls.dao.consultar_historial_por_id(id_historial)