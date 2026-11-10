import React, { createContext, useContext, useState, useEffect } from 'react';
import offlineDb from '../db/offlineDb';
import { reportsApi } from '../api/reportsApi';

const OfflineContext = createContext(null);

export const OfflineProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const updatePendingCount = async () => {
    try {
      const count = await offlineDb.reportes_pendientes.where('synced').equals(0).count();
      setPendingCount(count);
    } catch (e) {
      console.warn('Error leyendo Dexie:', e);
    }
  };

  useEffect(() => {
    updatePendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      triggerAutoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const triggerAutoSync = async () => {
    const pendings = await offlineDb.reportes_pendientes.where('synced').equals(0).toArray();
    if (pendings.length === 0) return;

    setIsSyncing(true);
    try {
      // Formatear lote según espera /api/v1/reportes/sincronizar-offline/
      const payload = pendings.map((p) => ({
        id: p.id,
        tipo_evento: p.tipo_evento,
        nivel_gravedad: p.nivel_gravedad,
        descripcion: p.descripcion,
        nombre_informante: p.nombre_informante,
        lat: p.lat,
        lon: p.lon || p.lng,
        lng: p.lng || p.lon,
        precision_gps_metros: p.precision_gps_metros || 10,
        fecha_incidente: p.fecha_incidente,
      }));

      await reportsApi.syncOfflineBatch(payload);

      // Marcar como sincronizados o borrar
      await offlineDb.reportes_pendientes.where('synced').equals(0).delete();
      await updatePendingCount();
    } catch (err) {
      console.warn('Fallo en sincronización automática en lote:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveReportOffline = async (reportData) => {
    const id = crypto.randomUUID();
    await offlineDb.reportes_pendientes.add({
      ...reportData,
      id,
      synced: 0,
      fecha_incidente: new Date().toISOString(),
    });
    await updatePendingCount();
    if (navigator.onLine) {
      triggerAutoSync();
    }
  };

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        pendingCount,
        isSyncing,
        saveReportOffline,
        syncNow: triggerAutoSync,
        updatePendingCount,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);

