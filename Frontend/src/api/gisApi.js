import apiClient from './client';

export const gisApi = {
  getZonasRiesgo: async () => {
    const res = await apiClient.get('/gis/zonas-riesgo/');
    return res.data?.results || res.data;
  },
  getRedHidricaVial: async () => {
    const res = await apiClient.get('/gis/red-hidrica-vial/');
    return res.data?.results || res.data;
  },
  getInfraestructuras: async () => {
    const res = await apiClient.get('/gis/infraestructuras/');
    return res.data?.results || res.data;
  },
  updateInfraestructura: async (id, data) => {
    const res = await apiClient.patch(`/gis/infraestructuras/${id}/`, data);
    return res.data;
  },
  createInfraestructura: async (data) => {
    const res = await apiClient.post('/gis/infraestructuras/', data);
    return res.data;
  },
  deleteInfraestructura: async (id) => {
    const res = await apiClient.delete(`/gis/infraestructuras/${id}/`);
    return res.data;
  },
};
