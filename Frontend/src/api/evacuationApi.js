import apiClient from './client';

export const evacuationApi = {
  getAlbergues: async () => {
    const res = await apiClient.get('/evacuacion/albergues/');
    return res.data?.results || res.data;
  },
  getAlbergueCercano: async (lat, lng) => {
    const res = await apiClient.get('/evacuacion/albergue-cercano/', {
      params: { lat, lng },
    });
    return res.data;
  },
  updateAlbergue: async (id, data) => {
    const res = await apiClient.patch(`/evacuacion/albergues/${id}/`, data);
    return res.data;
  },
  createAlbergue: async (data) => {
    const res = await apiClient.post('/evacuacion/albergues/', data);
    return res.data;
  },
  deleteAlbergue: async (id) => {
    const res = await apiClient.delete(`/evacuacion/albergues/${id}/`);
    return res.data;
  },
  getVias: async () => {
    const res = await apiClient.get('/evacuacion/vias/');
    return res.data?.results || res.data;
  },
};
