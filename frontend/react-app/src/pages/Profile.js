// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FaUser,
  FaEnvelope,
  FaCalendar,
  FaMusic,
  FaHeart,
  FaEdit,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import './Profile.css';
import { useCurrentUser } from '../hooks/useCurrentUser.js';
import { usersAPI } from '../services/api.js';

const Profile = () => {
  const { user, loading, refetch } = useCurrentUser();
  const [isEditing, setIsEditing] = useState(false);
  const [editedInfo, setEditedInfo] = useState({});
  const [stats, setStats] = useState({
    totalPlays: 0,
    favoriteSongs: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Cargar estadísticas del usuario
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const [statsResponse, favoritesResponse] = await Promise.all([
          usersAPI.getHistory({ limit: 1 }),
          usersAPI.getFavorites()
        ]);

        setStats({
          totalPlays: statsResponse.total || 0,
          favoriteSongs: favoritesResponse.count || 0
        });
      } catch (error) {
        console.error('Error al cargar estadísticas:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  // Inicializar editedInfo cuando el usuario cargue
  useEffect(() => {
    if (user) {
      setEditedInfo({
        name: user.name || '',
        country: user.country || ''
      });
    }
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedInfo({
      name: user.name || '',
      country: user.country || ''
    });
  };

  const handleSave = async () => {
    try {
      await usersAPI.updateProfile(editedInfo);
      await refetch(); // Recargar datos del usuario
      setIsEditing(false);
    } catch (error) {
      console.error('Error al actualizar el perfil:', error);
      alert('Error al actualizar el perfil. Por favor intenta de nuevo.');
    }
  };

  const handleCancel = () => {
    setEditedInfo({
      name: user.name || '',
      country: user.country || ''
    });
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setEditedInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long' });
  };

  if (loading) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-content">
          <p>No se pudo cargar la información del usuario</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="profile-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="profile-content">
        {/* Header del Perfil */}
        <motion.div
          className="profile-header"
          variants={cardVariants}
        >
          <div className="profile-avatar-large">
            <FaUser size={60} />
          </div>

          <div className="profile-header-info">
            {isEditing ? (
              <input
                type="text"
                value={editedInfo.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="profile-name-input"
              />
            ) : (
              <h1 className="profile-name">{user.name}</h1>
            )}

            <p className="profile-member-since">
              <FaCalendar /> Miembro desde {formatDate(user.createdAt)}
            </p>
          </div>

          <div className="profile-actions">
            {!isEditing ? (
              <motion.button
                className="btn-edit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEdit}
              >
                <FaEdit /> Editar perfil
              </motion.button>
            ) : (
              <div className="edit-actions">
                <motion.button
                  className="btn-save"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                >
                  <FaSave /> Guardar
                </motion.button>
                <motion.button
                  className="btn-cancel"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCancel}
                >
                  <FaTimes /> Cancelar
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Información Personal */}
        <motion.div
          className="profile-section"
          variants={cardVariants}
        >
          <h2 className="section-title">Información Personal</h2>

          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">
                <FaEnvelope /> Email
              </div>
              <div className="info-value">{user.email}</div>
            </div>

            <div className="info-item">
              <div className="info-label">
                <FaMusic /> País
              </div>
              {isEditing ? (
                <input
                  type="text"
                  value={editedInfo.country || ''}
                  onChange={(e) => handleChange('country', e.target.value)}
                  className="info-input"
                  placeholder="Ingresa tu país"
                />
              ) : (
                <div className="info-value">{user.country || 'No especificado'}</div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Estadísticas */}
        <motion.div
          className="profile-section"
          variants={cardVariants}
        >
          <h2 className="section-title">Estadísticas de Reproducción</h2>

          <div className="stats-grid">
            <motion.div
              className="stat-card"
              whileHover={{ scale: 1.05 }}
            >
              <div className="stat-icon">
                <FaMusic />
              </div>
              <div className="stat-value">
                {loadingStats ? '...' : stats.totalPlays}
              </div>
              <div className="stat-label">Canciones reproducidas</div>
            </motion.div>

            <motion.div
              className="stat-card"
              whileHover={{ scale: 1.05 }}
            >
              <div className="stat-icon">
                <FaHeart />
              </div>
              <div className="stat-value">
                {loadingStats ? '...' : stats.favoriteSongs}
              </div>
              <div className="stat-label">Canciones favoritas</div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Profile;
