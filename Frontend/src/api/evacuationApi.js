import apiClient from './client';

export const evacuationApi = {
  getAlbergues: async () => {
    const res = await apiClient.get('/evacuacion/albergues/');
    return res.data;
  },
  getAlbergueCercano: async (lat, lng) => {
    const res = await apiClient.get('/evacuacion/albergue-cercano/', {
      params: { lat, lng },
    });
    return res.data;
  },
  getVias: async () => {
    const res = await apiClient.get('/evacuacion/vias/');
    return res.data;
  },
};
