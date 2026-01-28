import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useSocket } from '../hooks/useSocket';
import './Dashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { data } = useSocket();
  const [previousPower, setPreviousPower] = useState(0);
  const [detectedAppliance, setDetectedAppliance] = useState(null);
  const [detectionTimeout, setDetectionTimeout] = useState(null);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{
      label: 'Power Consumption (W)',
      data: [],
      borderColor: '#0077cc',
      backgroundColor: 'rgba(0, 119, 204, 0.1)',
      fill: true,
      tension: 0.3,
      pointBackgroundColor: '#0077cc'
    }]
  });

  const darkMode = document.body.classList.contains('dark');
  const textColor = darkMode ? '#f0f0f0' : '#222';

  const applianceSignatures = [
    { name: 'Air Conditioner', icon: '', min: 1000, max: 3500 },
    { name: 'Washing Machine', icon: '', min: 300, max: 2500 },
    { name: 'Microwave', icon: '', min: 800, max: 1500 },
    { name: 'Electric Kettle', icon: '', min: 1500, max: 2200 },
    { name: 'Water Heater', icon: '', min: 2000, max: 4500 },
    { name: 'Refrigerator', icon: '', min: 100, max: 400 },
    { name: 'Iron', icon: '', min: 800, max: 1500 },
    { name: 'Hair Dryer', icon: '', min: 1000, max: 2000 },
    { name: 'TV', icon: '', min: 50, max: 300 },
    { name: 'Computer/Laptop', icon: '', min: 30, max: 200 },
    { name: 'Light Bulb', icon: '', min: 5, max: 100 },
    { name: 'Fan', icon: '', min: 50, max: 150 },
    { name: 'Phone Charger', icon: '', min: 5, max: 25 },
    { name: 'Standby Device', icon: '', min: 1, max: 50 }
  ];

  const detectAppliance = (delta) => {
    if (delta < 10) return null;

    for (const appliance of applianceSignatures) {
      if (delta >= appliance.min && delta <= appliance.max) {
        return appliance;
      }
    }

    const closest = applianceSignatures.reduce((prev, curr) => {
      const prevDiff = Math.abs(delta - (prev.min + prev.max) / 2);
      const currDiff = Math.abs(delta - (curr.min + curr.max) / 2);
      return currDiff < prevDiff ? curr : prev;
    });

    return closest;
  };

  const [logEntries, setLogEntries] = useState([]);

  useEffect(() => {
    if (!data) return;

    if (data.power !== undefined && previousPower > 0) {
      const delta = data.power - previousPower;
      const absDelta = Math.abs(delta);

      if (absDelta > 20) {
        const appliance = detectAppliance(absDelta);
        if (appliance) {
          setDetectedAppliance({ ...appliance, delta });

          if (detectionTimeout) {
            clearTimeout(detectionTimeout);
          }
          const timeout = setTimeout(() => {
            setDetectedAppliance(null);
          }, 5000);
          setDetectionTimeout(timeout);

          console.log(`NILM: Detected ${appliance.name} (${delta > 0 ? '+' : ''}${delta.toFixed(0)}W)`);
        }
      }
    }

    if (data.power !== undefined) {
      setPreviousPower(data.power);
    }

    if (data.power !== undefined) {
      const time = new Date().toLocaleTimeString();
      setChartData(prev => {
        const newLabels = [...prev.labels, time];
        const newData = [...prev.datasets[0].data, data.power];

        if (newLabels.length > 10) {
          newLabels.shift();
          newData.shift();
        }

        return {
          ...prev,
          labels: newLabels,
          datasets: [{
            ...prev.datasets[0],
            data: newData
          }]
        };
      });
    }

    if (data.voltage !== undefined && data.current !== undefined && data.power !== undefined) {
      const time = new Date().toLocaleTimeString();
      const newEntry = `[${time}] ${data.voltage}V | ${data.current}A | ${data.power}W`;
      setLogEntries(prev => {
        const updated = [newEntry, ...prev];
        return updated.slice(0, 50); 
      });
    }
  }, [data, previousPower, detectionTimeout]);

  const BUDGET_LIMIT = 2000;
  const DAYS_IN_MONTH = 30;
  let budgetInfo = { used: 0, predicted: 0, percentage: 0, status: 'On Track', statusColor: '#28a745', barClass: '' };

  if (data?.bill !== undefined && data?.energy !== undefined) {
    const currentDay = new Date().getDate();
    const daysPassed = Math.max(1, Math.min(currentDay, DAYS_IN_MONTH));
    const currentBill = parseFloat(data.bill) || 0;
    const avgDailyBill = currentBill / daysPassed;
    const predictedMonthlyBill = avgDailyBill * DAYS_IN_MONTH;
    const displayBill = Math.max(currentBill, predictedMonthlyBill);

    budgetInfo.used = displayBill;
    budgetInfo.predicted = predictedMonthlyBill;
    budgetInfo.percentage = Math.min(100, (displayBill / BUDGET_LIMIT) * 100);

    if (predictedMonthlyBill > BUDGET_LIMIT * 1.1) {
      budgetInfo.status = 'Over Budget';
      budgetInfo.statusColor = '#dc3545';
      budgetInfo.barClass = 'danger';
    } else if (predictedMonthlyBill > BUDGET_LIMIT) {
      budgetInfo.status = 'At Risk';
      budgetInfo.statusColor = '#ff9800';
      budgetInfo.barClass = 'warning';
    } else if (predictedMonthlyBill > BUDGET_LIMIT * 0.8) {
      budgetInfo.status = 'Approaching Limit';
      budgetInfo.statusColor = '#ff9800';
      budgetInfo.barClass = 'warning';
    } else {
      budgetInfo.status = 'On Track';
      budgetInfo.statusColor = '#28a745';
      budgetInfo.barClass = '';
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: textColor }
      }
    },
    scales: {
      x: {
        ticks: { color: textColor }
      },
      y: {
        beginAtZero: true,
        ticks: { color: textColor }
      }
    }
  };

  return (
    <main className="dashboard-main">
      <h2>Real-Time Energy Overview</h2>

      <div className="dashboard-container">
        <div className="log-sidebar">
          <h3>Live Event Log</h3>
          <div className="log-entries">
            {logEntries.map((entry, index) => (
              <div key={index} className="log-entry">{entry}</div>
            ))}
          </div>
        </div>

        <div className="main-content">
          {}
          {data?.vampireAlert && (
            <div className="vampire-alert">
              <h3>Vampire Load Detected!</h3>
              <p>Your house is idle (Night Mode), but something is consuming power.</p>
              <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                Potential Waste: ₹{data.wastedCost || 0} / year
              </p>
            </div>
          )}

          {}
          {detectedAppliance && (
            <div className="appliance-detection-box">
              <h3>Appliance Detected</h3>
              <p style={{ fontSize: '1.3rem', fontWeight: 'bold' }}>
                {detectedAppliance.name} {detectedAppliance.icon}
              </p>
              <p style={{ fontSize: '0.9rem', color: '#666' }}>
                Power change: {detectedAppliance.delta > 0 ? '+' : ''}{detectedAppliance.delta.toFixed(0)}W
              </p>
            </div>
          )}

          {}
          <div className="budget-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0, color: '#007bff' }}>Monthly Budget</h3>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                ₹{budgetInfo.used.toFixed(0)} / ₹{BUDGET_LIMIT}
              </div>
            </div>
            <div className="budget-progress-container">
              <div 
                className={`budget-progress-bar ${budgetInfo.barClass}`}
                style={{ width: `${budgetInfo.percentage}%` }}
              >
                {budgetInfo.percentage.toFixed(1)}%
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.9rem' }}>
              <span style={{ color: budgetInfo.statusColor }}>{budgetInfo.status}</span>
              <span>Predicted: ₹{budgetInfo.predicted.toFixed(0)}</span>
            </div>
          </div>

          {}
          <div className="eco-row">
            <div className="eco-card">
              <div>Carbon Footprint</div>
              <div className="eco-value">{data?.co2?.toFixed(3) || '0.00'} kg</div>
            </div>
            <div className="eco-card">
              <div>Trees Burnt</div>
              <div className="eco-value" style={{ color: '#ff9800' }}>
                {data?.trees?.toFixed(4) || '0.00'} trees
              </div>
            </div>
          </div>

          {}
          <div className="cards">
            <div className="card">
              Voltage<br />
              <span>{data?.voltage || 230}V</span>
            </div>
            <div className="card">
              Current<br />
              <span>{data?.current || 5}A</span>
            </div>
            <div className="card">
              Power<br />
              <span>{data?.power || 1150}W</span>
            </div>
            <div className="card" style={{ border: '2px solid #007bff', backgroundColor: 'rgba(0, 123, 255, 0.05)' }}>
              Bill Amount<br />
              <span id="bill-amount">₹{data?.bill || '52.50'}</span>
            </div>
          </div>

          {}
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {}
    </main>
  );
};

export default Dashboard;

