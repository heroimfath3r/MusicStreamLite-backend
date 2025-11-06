import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  FaBroadcastTower, // ✅ Reemplaza a FaRadio
  FaNewspaper,
  FaMusic
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
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
          <motion.li variants={itemVariants}>
            <NavLink to="/playlist/chill" className="sidebar-link small-text">
              <span className="playlist-dot" style={{backgroundColor: '#4ECDC4'}}></span>
              <span>Concentración en p...</span>
            </NavLink>
          </motion.li>
          <motion.li variants={itemVariants}>
            <NavLink to="/playlist/dark" className="sidebar-link small-text">
              <span className="playlist-dot" style={{backgroundColor: '#6B5B95'}}></span>
              <span>Damn</span>
            </NavLink>
          </motion.li>
          <motion.li variants={itemVariants}>
            <NavLink to="/playlist/everything" className="sidebar-link small-text">
              <span className="playlist-dot" style={{backgroundColor: '#FEB236'}}></span>
              <span>Everything</span>
            </NavLink>
          </motion.li>
          <motion.li variants={itemVariants}>
            <NavLink to="/playlist/future" className="sidebar-link small-text">
              <span className="playlist-dot" style={{backgroundColor: '#D6ED17'}}></span>
              <span>Future Essentials</span>
            </NavLink>
          </motion.li>
          <motion.li variants={itemVariants}>
            <NavLink to="/playlist/gunna" className="sidebar-link small-text">
              <span className="playlist-dot" style={{backgroundColor: '#FF6B6B'}}></span>
              <span>Gunna Essentials</span>
            </NavLink>
          </motion.li>
          <motion.li variants={itemVariants}>
            <NavLink to="/playlist/etc" className="sidebar-link small-text">
              <FaList size={16} />
              <span>Más...</span>
            </NavLink>
          </motion.li>
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
