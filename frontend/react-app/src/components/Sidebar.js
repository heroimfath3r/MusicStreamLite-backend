import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaNewspaper } from 'react-icons/fa';
import {
  FaHome,
  FaSearch,
  FaBook, // Usaremos FaBook para "Tu Biblioteca"
  FaPlus,
  FaHeart,
  FaCompactDisc, // Para Álbumes
  FaUserCircle, // Para Artistas
  FaItunesNote, // Para Canciones
  FaList, // Para Playlists
  FaBroadcastTower, // Para Radio
  FaMusic,
  FaSpinner // Para loading
} from 'react-icons/fa';
import { playlistsAPI, songsAPI } from '../services/api.js';
import './Sidebar.css';

const Sidebar = () => {
  // Estados para datos dinámicos
  const [playlists, setPlaylists] = useState([]);
  const [recentSongs, setRecentSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar playlists al montar el componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Cargar playlists del usuario
        const playlistsData = await playlistsAPI.getAll();
        setPlaylists(playlistsData.playlists || []);

        // Cargar canciones recientes (últimas 5)
        const songsData = await songsAPI.getAll({ limit: 5, sort: 'created_at', order: 'DESC' });
        setRecentSongs(songsData.songs || []);

      } catch (err) {
        console.error('Error cargando datos del sidebar:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const sidebarVariants = {
    hidden: { x: -250 },
    visible: {
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.aside 
      className="apple-sidebar"
      variants={sidebarVariants}
      initial="hidden"
      animate="visible"
    >
      <nav className="sidebar-nav">
        {/* Grupo principal */}
        <motion.ul className="nav-group" variants={sidebarVariants}>
          <motion.li variants={itemVariants}>
            <NavLink to="/home" className="sidebar-link">
              <FaHome size={18} />
              <span>Inicio</span>
            </NavLink>
          </motion.li>
          <motion.li variants={itemVariants}>
            <NavLink to="/browse" className="sidebar-link">
              <FaNewspaper size={18} />
              <span>Novedades</span>
            </NavLink>
          </motion.li>
        </motion.ul>

        <motion.div className="sidebar-divider" variants={itemVariants}></motion.div>

        {/* Grupo: Biblioteca */}
        <motion.h3 variants={itemVariants}>Biblioteca</motion.h3>
        <motion.ul className="nav-group" variants={sidebarVariants}>
          <motion.li variants={itemVariants}>
            <NavLink to="/library/artists" className="sidebar-link">
              <FaUserCircle size={18} />
              <span>Artistas</span>
            </NavLink>
          </motion.li>
          <motion.li variants={itemVariants}>
            <NavLink to="/library/albums" className="sidebar-link">
              <FaCompactDisc size={18} />
              <span>Álbumes</span>
            </NavLink>
          </motion.li>
          <motion.li variants={itemVariants}>
            <NavLink to="/library/songs" className="sidebar-link">
              <FaItunesNote size={18} />
              <span>Canciones</span>
            </NavLink>
          </motion.li>
        </motion.ul>

        <motion.div className="sidebar-divider" variants={itemVariants}></motion.div>

        {/* Grupo: Playlists */}
        <motion.h3 variants={itemVariants}>Playlists</motion.h3>
        <motion.ul className="nav-group" variants={sidebarVariants}>
          <motion.li variants={itemVariants}>
            <button className="sidebar-link add-playlist-btn">
              <FaPlus size={18} />
              <span>Nueva Playlist</span>
            </button>
          </motion.li>
          <motion.li variants={itemVariants}>
            <NavLink to="/playlist/all" className="sidebar-link small-text">
              <FaList size={16} />
              <span>Todas las playlists</span>
            </NavLink>
          </motion.li>
          <motion.li variants={itemVariants}>
            <NavLink to="/playlist/favorites" className="sidebar-link small-text">
              <FaHeart size={16} />
              <span>Canciones favoritas</span>
            </NavLink>
          </motion.li>

          {/* Mostrar indicador de carga */}
          {loading && (
            <motion.li variants={itemVariants}>
              <div className="sidebar-link small-text">
                <FaSpinner className="fa-spin" size={16} />
                <span>Cargando...</span>
              </div>
            </motion.li>
          )}

          {/* Mostrar playlists del usuario */}
          {!loading && playlists.length > 0 && playlists.slice(0, 8).map((playlist, index) => {
            // Generar colores aleatorios para los dots
            const colors = ['#4ECDC4', '#6B5B95', '#FEB236', '#D6ED17', '#FF6B6B', '#95E1D3', '#F38181', '#AA96DA'];
            const color = colors[index % colors.length];

            return (
              <motion.li key={playlist.playlist_id} variants={itemVariants}>
                <NavLink to={`/playlist/${playlist.playlist_id}`} className="sidebar-link small-text">
                  <span className="playlist-dot" style={{backgroundColor: color}}></span>
                  <span title={playlist.name}>
                    {playlist.name.length > 20 ? `${playlist.name.substring(0, 20)}...` : playlist.name}
                  </span>
                </NavLink>
              </motion.li>
            );
          })}

          {/* Mostrar mensaje si no hay playlists */}
          {!loading && playlists.length === 0 && (
            <motion.li variants={itemVariants}>
              <div className="sidebar-link small-text" style={{ opacity: 0.6 }}>
                <FaMusic size={16} />
                <span>No hay playlists</span>
              </div>
            </motion.li>
          )}

          {/* Mostrar "Más..." si hay más de 8 playlists */}
          {!loading && playlists.length > 8 && (
            <motion.li variants={itemVariants}>
              <NavLink to="/playlist/all" className="sidebar-link small-text">
                <FaList size={16} />
                <span>Más... ({playlists.length - 8})</span>
              </NavLink>
            </motion.li>
          )}
        </motion.ul>
      </nav>

      {/* Footer */}
      <motion.div className="sidebar-footer" variants={itemVariants}>
        <a href="#open-in-music" className="sidebar-link footer-action">
          <FaMusic size={18} />
          <span>Abrir en Música?</span>
        </a>
        <a href="#beta" className="sidebar-link footer-action">
          <span>Probar versión beta?</span>
        </a>
      </motion.div>
    </motion.aside>
  );
};

export default Sidebar;
