import apiClient from './client';

export const humanitarianApi = {
  getCensoFamilias: async () => {
    const res = await apiClient.get('/humanitaria/censo-familias/');
    return res.data;
  },
  crearCensoFamilia: async (familiaData) => {
    const res = await apiClient.post('/humanitaria/censo-familias/', familiaData);
    return res.data;
  },
  getSuministros: async () => {
    const res = await apiClient.get('/humanitaria/suministros/');
    return res.data;
  },
  getInventario: async () => {
    const res = await apiClient.get('/humanitaria/inventario/');
    return res.data;
  },
};

