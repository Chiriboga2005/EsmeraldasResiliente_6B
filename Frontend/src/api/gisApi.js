import apiClient from './client';

export const gisApi = {
  getZonasRiesgo: async () => {
    const res = await apiClient.get('/gis/zonas-riesgo/');
    return res.data;
  },
  getRedHidricaVial: async () => {
    const res = await apiClient.get('/gis/red-hidrica-vial/');
    return res.data;
  },
  getInfraestructuras: async () => {
    const res = await apiClient.get('/gis/infraestructuras/');
    return res.data;
  },
};
