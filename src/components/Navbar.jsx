import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import ThemeSwitch from './ThemeSwitch';
import './Navbar.css';

const Navbar = ({ darkMode, setDarkMode, onLogout }) => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <Link to="/" className="nav-logo">
        Smart Energy Meter
      </Link>
      <ul className="nav-links">
        <li>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Dashboard
          </Link>
        </li>
        <li>
          <Link to="/analytics" className={location.pathname === '/analytics' ? 'active' : ''}>
            Analytics
          </Link>
        </li>
        <li>
          <Link to="/digital-twin" className={location.pathname === '/digital-twin' ? 'active' : ''}>
            Digital Twin
          </Link>
        </li>
        <li>
          <Link to="/alerts" className={location.pathname === '/alerts' ? 'active' : ''}>
            Alerts
          </Link>
        </li>
      </ul>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <ThemeSwitch darkMode={darkMode} setDarkMode={setDarkMode} />
        <button
          onClick={onLogout}
          className="logout-nav-btn"
          title="Logout"
        >
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

