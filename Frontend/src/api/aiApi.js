import apiClient from './client';

export const aiApi = {
  consultar: async (pregunta) => {
    const res = await apiClient.post('/ia/consultar/', { pregunta });
    return res.data;
  },
  getHistorial: async () => {
    const res = await apiClient.get('/ia/historial/');
    return res.data;
  },
  borrarHistorial: async () => {
    const res = await apiClient.delete('/ia/historial/');
    return res.data;
  },
  getResumenHistorico: async () => {
    const res = await apiClient.get('/ia/resumen-historico/');
    return res.data;
  },
  getSectoresRecurrentes: async () => {
    const res = await apiClient.get('/ia/sectores-recurrentes/');
    return res.data;
  },
  getTendencias: async () => {
    const res = await apiClient.get('/ia/tendencias/');
    return res.data;
  },
  getPatronesGeoTemporales: async () => {
    const res = await apiClient.get('/ia/patrones-geotemporales/');
    return res.data;
  },
  simularEscenario: async (params = {}) => {
    const res = await apiClient.get('/ia/simular-escenario/', { params });
    return res.data;
  },
  clasificarIncidente: async (datos) => {
    const res = await apiClient.post('/ia/clasificar-incidente/', datos);
    return res.data;
  },
};

export default aiApi;

