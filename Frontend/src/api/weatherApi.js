import apiClient from './client';

const weatherCache = new Map();
const CACHE_TTL_MS = 60 * 1000; // 1 minuto de caché para respuesta ultra-rápida

export const weatherApi = {
  getClimaActual: async (params = 'esmeraldas') => {
    let query = {};
    let cacheKey = '';

    if (typeof params === 'string') {
      query = { canton: params };
      cacheKey = `canton_${params.toLowerCase()}`;
    } else if (params && typeof params === 'object') {
      query = params;
      cacheKey = params.canton 
        ? `canton_${params.canton.toLowerCase()}` 
        : `coord_${params.lat?.toFixed(2)}_${params.lon?.toFixed(2)}`;
    }

    const cached = weatherCache.get(cacheKey);
    const now = Date.now();
    if (cached && (now - cached.timestamp < CACHE_TTL_MS)) {
      return cached.data;
    }

    const res = await apiClient.get('/clima/actual/', { params: query });
    weatherCache.set(cacheKey, { timestamp: now, data: res.data });
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
export default weatherApi;
