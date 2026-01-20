import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { useSocket } from '../hooks/useSocket';
import './Analytics.css'; // Reusing analytics styles for now, or we can create DigitalTwin.css

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const DigitalTwin = () => {
    const { data } = useSocket();
    const darkMode = document.body.classList.contains('dark');
    const textColor = darkMode ? '#f0f0f0' : '#666';

    const [showSolar, setShowSolar] = useState(true); // Default to showing solar for this page
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
            {
                label: 'Virtual (With Solar)',
                data: Array(60).fill(0),
                borderColor: '#28a745',
                borderDash: [5, 5],
                backgroundColor: 'rgba(40, 167, 69, 0.1)',
                fill: false,
                tension: 0.4,
                pointRadius: 0
            }
        ]
    });

    useEffect(() => {
        if (!data || data.power === undefined) return;

        setRealTimeData(prev => {
            const newLabels = [...prev.labels, ''];
            const newPowerData = [...prev.datasets[0].data, data.power];

            let newVirtualData = [...prev.datasets[1].data];
            if (data.virtualGridPower !== undefined) {
                newVirtualData.push(data.virtualGridPower);
            } else {
                newVirtualData.push(data.power);
            }

            if (newLabels.length > 60) {
                newLabels.shift();
                newPowerData.shift();
                newVirtualData.shift();
            }

            return {
                labels: newLabels,
                datasets: [
                    { ...prev.datasets[0], data: newPowerData },
                    { ...prev.datasets[1], data: newVirtualData }
                ]
            };
        });
    }, [data]);

    const lineOptions = {
        responsive: true,
        animation: { duration: 0 },
        scales: {
            x: {
                display: false,
                ticks: { color: textColor }
            },
            y: {
                ticks: { color: textColor },
                beginAtZero: true
            }
        },
        plugins: {
            legend: {
                labels: { color: textColor }
            }
        }
    };

    return (
        <main className="analytics-main" style={{ padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Digital Twin: Virtual Solar Simulation</h2>

            <p style={{ textAlign: 'center', marginBottom: '2rem', color: textColor, maxWidth: '800px', margin: '0 auto 2rem auto' }}>
                Experience the potential of solar energy without installing a single panel.
                Our Digital Twin engine uses real-time local weather data to simulate a 3kW solar installation
                and calculates your potential savings instantly.
            </p>

            {/* Stats Cards */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <div className="stat-card" style={{ background: darkMode ? '#333' : '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minWidth: '200px', textAlign: 'center', border: '1px solid #28a745' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>Simulated Solar Output</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data?.solarProduction || 0} W</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>Based on live weather</div>
                </div>

                <div className="stat-card" style={{ background: darkMode ? '#333' : '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', minWidth: '200px', textAlign: 'center', border: '1px solid #007bff' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#007bff' }}>Potential Savings</h4>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>₹{data?.virtualSavings || '0.00'}<span style={{ fontSize: '1rem' }}>/hr</span></div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.8 }}>If you had solar now</div>
                </div>
            </div>

            <div className="charts-grid" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div className="chart-container" style={{ gridColumn: '1 / -1' }}>
                    <h3>Real-Time Grid vs. Virtual Hybrid</h3>
                    <Line data={realTimeData} options={lineOptions} />
                </div>
            </div>
        </main>
    );
};

export default DigitalTwin;
