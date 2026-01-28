import React, { useState, useEffect } from 'react';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { useSocket } from '../hooks/useSocket';
import './Analytics.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const { data } = useSocket();
  const darkMode = document.body.classList.contains('dark');
  const textColor = darkMode ? '#f0f0f0' : '#666';

  const [realTimeData, setRealTimeData] = useState({
    labels: Array(60).fill(''),
    datasets: [
      {
        label: 'Live Power (W)',
        data: Array(60).fill(0),
        borderColor: '#ff5722',
        backgroundColor: 'rgba(255, 87, 34, 0.2)',
        fill: true,
        tension: 0.4,
        pointRadius: 0
      },

    ]
  });

  const [weeklyData, setWeeklyData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'],
    datasets: [{
      label: 'Energy (kWh)',
      data: [12, 19, 15, 17, 14, 22, 0], 
      backgroundColor: '#007bff'
    }]
  });

  const [breakdownData, setBreakdownData] = useState({
    labels: ['AC', 'Fridge', 'Lights', 'Washer', 'Others'],
    datasets: [{
      data: [0, 0, 0, 0, 0],
      backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff']
    }]
  });

  const [costData, setCostData] = useState({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Current'],
    datasets: [{
      label: 'Estimated Cost (₹)',
      data: [800, 1650, 2400, 0], 
      borderColor: '#28a745',
      fill: false,
      tension: 0.3
    }]
  });

  useEffect(() => {
    if (!data) return;

    if (data.power !== undefined) {
      setRealTimeData(prev => {
        const newLabels = [...prev.labels, ''];
        const newPowerData = [...prev.datasets[0].data, data.power];
        if (newLabels.length > 60) {
          newLabels.shift();
          newPowerData.shift();
        }
        return {
          labels: newLabels,
          datasets: [{ ...prev.datasets[0], data: newPowerData }]
        };
      });

      let ac = 0, fridge = 0, lights = 0, washer = 0, others = 0;
      const power = data.power;

      if (power > 2000) {

        ac = power * 0.6;
        fridge = 150;
        lights = 100;
        others = power - (ac + fridge + lights);
      } else if (power > 500) {

        washer = power * 0.5;
        fridge = 150;
        lights = 100;
        others = power - (washer + fridge + lights);
      } else {

        fridge = Math.min(power, 150);
        lights = Math.min(power - fridge, 50);
        others = Math.max(0, power - (fridge + lights));
      }

      setBreakdownData({
        labels: ['AC', 'Fridge', 'Lights', 'Washer', 'Others'],
        datasets: [{
          data: [Math.floor(ac), Math.floor(fridge), Math.floor(lights), Math.floor(washer), Math.floor(others)],
          backgroundColor: ['#ff6384', '#36a2eb', '#ffce56', '#4bc0c0', '#9966ff']
        }]
      });
    }

    if (data.energy !== undefined) {
      setWeeklyData(prev => {
        const newData = [...prev.datasets[0].data];
        newData[6] = data.energy; 
        return { ...prev, datasets: [{ ...prev.datasets[0], data: newData }] };
      });
    }

    if (data.bill !== undefined) {
      const currentBill = parseFloat(data.bill);
      if (!isNaN(currentBill)) {
        setCostData(prev => {
          const newData = [...prev.datasets[0].data];
          newData[3] = 3200 + currentBill; 
          return { ...prev, datasets: [{ ...prev.datasets[0], data: newData }] };
        });
      }
    }

  }, [data]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: textColor }
      }
    }
  };

  const barOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: { color: textColor }
      },
      y: {
        ticks: { color: textColor },
        beginAtZero: true
      }
    }
  };

  const lineOptions = {
    ...chartOptions,
    scales: {
      x: {
        ticks: { color: textColor }
      },
      y: {
        ticks: { color: textColor },
        beginAtZero: true
      }
    }
  };

  return (
    <main className="analytics-main">
      <h2>Advanced Analytics</h2>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', fontWeight: 'bold', color: '#007bff' }}>
        <div>Live Power: {data?.power?.toFixed(2) || 0} W</div>
        <div>Current Bill: ₹{data?.bill || '0.00'}</div>
      </div>

      <div className="charts-grid">
        <div className="chart-container" style={{ gridColumn: '1 / -1' }}>
          <h3>Real-Time Power Consumption</h3>
          <Line data={realTimeData} options={{ ...lineOptions, animation: { duration: 0 }, scales: { ...lineOptions.scales, x: { display: false } } }} />
        </div>

        <div className="chart-container">
          <h3>Weekly Usage (kWh)</h3>
          <Bar data={weeklyData} options={barOptions} />
        </div>

        <div className="chart-container">
          <h3>Appliance Breakdown</h3>
          <Doughnut data={breakdownData} options={chartOptions} />
        </div>

        <div className="chart-container" style={{ gridColumn: '1 / -1' }}>
          <h3>Monthly Cost Projection (₹)</h3>
          <Line data={costData} options={lineOptions} height={100} />
        </div>
      </div>
    </main>
  );
};

export default Analytics;

