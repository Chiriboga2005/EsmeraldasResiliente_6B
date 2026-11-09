import apiClient from './client';

export const reportsApi = {
  getReportes: async () => {
    const res = await apiClient.get('/reportes/');
    return res.data?.results || res.data;
  },
  getReportesTabla: async (params = {}) => {
    const res = await apiClient.get('/reportes/tabla/', { params });
    return res.data?.results || res.data;
  },
  getKPIs: async () => {
    const res = await apiClient.get('/reportes/kpis/');
    return res.data;
  },
  actualizarEstadoReporte: async (id, data) => {
    const res = await apiClient.patch(`/reportes/${id}/`, data);
    return res.data;
  },
  eliminarReporte: async (id) => {
    const res = await apiClient.delete(`/reportes/${id}/`);
    return res.data;
  },
  crearReporte: async (reporteData) => {
    const isFormData = reporteData instanceof FormData;
    const res = await apiClient.post('/reportes/crear/', reporteData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : undefined,
    });
    return res.data;
  },
  syncOfflineBatch: async (reportes) => {
    const res = await apiClient.post('/reportes/sincronizar-offline/', { reportes });
    return res.data;
  },
};
