// src/hooks/useCurrentUser.js
import { useState, useEffect } from 'react';
import { usersAPI } from '../services/api.js';

/**
 * Hook personalizado para obtener y cachear la información del usuario actual
 * @returns {Object} { user, loading, error, refetch }
 */
export const useCurrentUser = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await usersAPI.getProfile();

      if (response.success && response.user) {
        setUser(response.user);
      } else {
        setError('No se pudo obtener la información del usuario');
      }
    } catch (err) {
      console.error('Error al obtener el perfil del usuario:', err);
      setError(err.response?.data?.error || 'Error al cargar el perfil');

      // Si el token es inválido o expiró, limpiar el localStorage
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  return {
    user,
    loading,
    error,
    refetch: fetchUser
  };
};

export default useCurrentUser;
