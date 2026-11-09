import apiClient from './client';

export const reportsApi = {
  getReportes: async () => {
    const res = await apiClient.get('/reportes/');
    return res.data;
  },
  crearReporte: async (reporteData) => {
    // Si viene FormData (por foto), axios configura automátiamente multipart/form-data
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
