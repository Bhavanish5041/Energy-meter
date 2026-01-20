import React from 'react';
import './Alerts.css';
import { useSocket } from '../hooks/useSocket';

const Alerts = () => {
  const { data, socket } = useSocket();
  const [alerts, setAlerts] = React.useState([]);

  React.useEffect(() => {
    if (!socket) return;

    // Handle initial history
    socket.on('alert-history', (history) => {
      setAlerts(history);
    });

    // Handle new alerts
    socket.on('new-alert', (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
    });

    return () => {
      socket.off('alert-history');
      socket.off('new-alert');
    };
  }, [socket]);

  return (
    <main className="alerts-content">
      <section className="card">
        <h2>Alerts & Notifications</h2>
        <p>This section shows real-time alerts based on usage thresholds, faults, and anomalies in your energy system.</p>
      </section>

      <section className="card">
        <h3>Recent Alerts ({alerts.length})</h3>
        <ul className="alert-list">
          {alerts.length === 0 && <li style={{ padding: '1rem', color: '#666' }}>No alerts yet...</li>}
          {alerts.map((alert, index) => (
            <li key={alert.id || index} className={`alert ${alert.type}`}>
              <span style={{ fontWeight: 'bold', marginRight: '10px' }}>[{alert.time}]</span>
              {alert.message || alert.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h3>Alert Settings</h3>
        <p>You can configure alert thresholds and preferred notification methods (email, SMS, dashboard) in the Settings page.</p>
      </section>
    </main>
  );
};

export default Alerts;

