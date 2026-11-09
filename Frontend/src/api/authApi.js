import apiClient from './client';

export const authApi = {
  login: async (credentials) => {
    // Acepta username o telefono con password
    const response = await apiClient.post('/auth/login/', credentials);
    return response.data;
  },
  registro: async (userData) => {
    const response = await apiClient.post('/auth/registro/', userData);
    return response.data;
  },
  getPerfil: async () => {
    const response = await apiClient.get('/auth/perfil/');
    return response.data;
  },
};

