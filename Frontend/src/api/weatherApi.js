import apiClient from './client';

export const weatherApi = {
  getClimaActual: async (canton = 'Esmeraldas') => {
    const res = await apiClient.get('/clima/actual/', { params: { canton } });
    return res.data;
  },
  getCapasConfig: async () => {
    const res = await apiClient.get('/clima/capas/');
    return res.data;
  },
  getCantones: async () => {
    const res = await apiClient.get('/clima/cantones/');
    return res.data;
  },
};

