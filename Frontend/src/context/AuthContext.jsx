import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

// Función auxiliar para aplanar el usuario si viene en formato GeoJSON Feature
const normalizeUser = (rawUser) => {
  if (!rawUser) return null;
  if (rawUser.type === 'Feature' && rawUser.properties) {
    return {
      ...rawUser.properties,
      id: rawUser.id || rawUser.properties.id,
      geometry: rawUser.geometry,
    };
  }
  return rawUser;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('usuario');
    return saved ? normalizeUser(JSON.parse(saved)) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const perfilRaw = await authApi.getPerfil();
      const perfil = normalizeUser(perfilRaw);
      setUser(perfil);
      localStorage.setItem('usuario', JSON.stringify(perfil));
    } catch (err) {
      console.warn('No se pudo cargar perfil:', err);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }

    const handleLogoutEvent = () => logout();
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, [token]);

  const login = async (credentials) => {
    const data = await authApi.login(credentials);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    setToken(data.access);
    let rawPerfil = data.usuario || data.user;
    if (!rawPerfil) {
      rawPerfil = await authApi.getPerfil();
    }
    const perfil = normalizeUser(rawPerfil);
    setUser(perfil);
    localStorage.setItem('usuario', JSON.stringify(perfil));
    return perfil;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('usuario');
    setToken(null);
    setUser(null);
  };

  const userRol = (user?.rol || user?.properties?.rol || '').toUpperCase();
  const userUsername = (user?.username || user?.properties?.username || '').toLowerCase();
  const isAdmin = Boolean(
    user && (
      userRol === 'ADMINISTRADOR' || 
      userRol === 'ADMIN' || 
      userUsername === 'admin' || 
      user?.is_staff || 
      user?.is_superuser
    )
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin,
        loading,
        login,
        logout,
        reloadProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

