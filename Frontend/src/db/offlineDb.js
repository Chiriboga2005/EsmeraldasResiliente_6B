import Dexie from 'dexie';

export const offlineDb = new Dexie('EsmeraldasResilienteOfflineDB');

offlineDb.version(1).stores({
  reportes_pendientes: '++local_id, id, tipo_evento, nivel_gravedad, fecha_incidente, synced',
  censo_pendiente: '++local_id, codigo_censo, jefe_familia_cedula, fecha_censo, synced',
});

export default offlineDb;
