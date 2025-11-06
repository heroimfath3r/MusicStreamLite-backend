import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaMusic,
  FaUser,
  FaCog,
  FaSignOutAlt
} from 'react-icons/fa';
import './Header.css';
import { useCurrentUser } from '../hooks/useCurrentUser.js';

const Header = () => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading } = useCurrentUser();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/home', label: 'Inicio' },
    { path: '/search', label: 'Buscar' },
    { path: '/library', label: 'Tu Biblioteca' }
  ];

  const handleLogout = () => {
    // Limpiar localStorage/sessionStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.clear();

    // Redirigir a login
    navigate('/login');
  };

  // Animaciones
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const navVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const navItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.header 
      className="apple-header"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="header-left">
        {/* Logo */}
       <motion.div 
  className="logo"
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
  <Link to="/home" className="logo-link">
    <FaMusic className="logo-icon" size={28} />
    <span className="logo-text">MusicStream</span>
  </Link>
</motion.div>
        {/* Navigation */}
        <motion.nav 
          className="nav-links"
          variants={navVariants}
          initial="hidden"
          animate="visible"
        >
          {navItems.map((item) => (
            <motion.div key={item.path} variants={navItemVariants}>
              <Link 
                to={item.path}
                className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
              >
                {item.label}
                {isActive(item.path) && (
                  <motion.div 
                    className="nav-underline"
                    layoutId="underline"
                    transition={{ type: 'spring', stiffness: 380, damping: 40 }}
                  />
                )}
              </Link>
            </motion.div>
          ))}
        </motion.nav>
      </div>

      {/* Right side */}
      <div className="header-right">
        {/* User menu */}
        <motion.div
          className="user-menu-container"
          onMouseEnter={() => setIsUserMenuOpen(true)}
          onMouseLeave={() => setIsUserMenuOpen(false)}
        >
          <motion.button
            className="user-avatar"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
          >
            <FaUser size={16} />
          </motion.button>

          {/* Dropdown menu */}
          <motion.div
            className="user-dropdown"
            initial={{ opacity: 0, y: -10 }}
            animate={isUserMenuOpen ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            pointerEvents={isUserMenuOpen ? 'auto' : 'none'}
          >
            <div className="dropdown-header">
              <div className="user-info">
                <div className="user-avatar-lg">
                  <FaUser size={20} />
                </div>
                <div>
                  <div className="user-name">
                    {loading ? 'Cargando...' : (user?.name || 'Usuario')}
                  </div>
                  <div className="user-email">
                    {loading ? '' : (user?.email || '')}
                  </div>
                </div>
              </div>
            </div>

            <div className="dropdown-divider"></div>

            <div className="dropdown-menu">
              <Link to="/profile" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                <FaUser size={16} />
                <span>Mi Perfil</span>
              </Link>
              <Link to="/settings" className="dropdown-item" onClick={() => setIsUserMenuOpen(false)}>
                <FaCog size={16} />
                <span>Configuración</span>
              </Link>
            </div>

            <div className="dropdown-divider"></div>

            <button className="dropdown-logout" onClick={handleLogout}>
              <FaSignOutAlt size={16} />
              <span>Cerrar sesión</span>
            </button>
          </motion.div>
        </motion.div>
      </div>
    </motion.header>
  );
};

export default Header;