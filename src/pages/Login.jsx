import React, { useState } from 'react';
import ThemeSwitch from '../components/ThemeSwitch';
import './Login.css';

const Login = ({ onLogin, darkMode, setDarkMode }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple authentication - in production, use proper auth
    if (username && password) {
      onLogin();
    }
  };

  return (
    <div className={`login-wrapper ${darkMode ? 'dark' : ''}`}>
      <div className="login-box">
        <h2>Smart Energy Meter</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit">Login</button>
        </form>
        <div style={{ marginTop: '1rem' }}>
          <ThemeSwitch darkMode={darkMode} setDarkMode={setDarkMode} />
        </div>
      </div>
    </div>
  );
};

export default Login;

