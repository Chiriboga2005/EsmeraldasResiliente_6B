import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OfflineProvider } from './context/OfflineContext';
import { MainLayout } from './components/layout/MainLayout';
import { CrisisRoomPage } from './pages/dashboard/CrisisRoomPage';
import { CitizenReportPage } from './pages/reports/CitizenReportPage';
import { SheltersPage } from './pages/evacuation/SheltersPage';
import { HumanitarianPage } from './pages/humanitarian/HumanitarianPage';
import { LoginPage } from './pages/auth/LoginPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OfflineProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<CrisisRoomPage />} />
              <Route path="reportes" element={<CitizenReportPage />} />
              <Route path="albergues" element={<SheltersPage />} />
              <Route path="humanitaria" element={<HumanitarianPage />} />
              <Route path="login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </OfflineProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
