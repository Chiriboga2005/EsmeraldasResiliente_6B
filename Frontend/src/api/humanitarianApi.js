import apiClient from './client';

export const humanitarianApi = {
  getCensoFamilias: async () => {
    const res = await apiClient.get('/humanitaria/censo-familias/');
    return res.data?.results || res.data;
  },
  crearCensoFamilia: async (familiaData) => {
    const res = await apiClient.post('/humanitaria/censo-familias/', familiaData);
    return res.data;
  },
  
  // Bodegas de Acopio CRUD
  getBodegas: async () => {
    const res = await apiClient.get('/humanitaria/bodegas/');
    return res.data?.results || res.data;
  },
  crearBodega: async (bodegaData) => {
    const res = await apiClient.post('/humanitaria/bodegas/', bodegaData);
    return res.data;
  },
  actualizarBodega: async (id, bodegaData) => {
    const res = await apiClient.patch(`/humanitaria/bodegas/${id}/`, bodegaData);
    return res.data;
  },
  eliminarBodega: async (id) => {
    const res = await apiClient.delete(`/humanitaria/bodegas/${id}/`);
    return res.data;
  },

  // Suministros y Kits CRUD
  getSuministros: async () => {
    const res = await apiClient.get('/humanitaria/suministros/');
    return res.data?.results || res.data;
  },
  crearSuministro: async (suministroData) => {
    const res = await apiClient.post('/humanitaria/suministros/', suministroData);
    return res.data;
  },
  actualizarSuministro: async (id, suministroData) => {
    const res = await apiClient.patch(`/humanitaria/suministros/${id}/`, suministroData);
    return res.data;
  },
  eliminarSuministro: async (id) => {
    const res = await apiClient.delete(`/humanitaria/suministros/${id}/`);
    return res.data;
  },

  getInventario: async () => {
    const res = await apiClient.get('/humanitaria/inventario/');
    return res.data?.results || res.data;
  },
};
