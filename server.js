import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- DIGITAL TWIN ENGINE: Weather & Solar Logic ---
// --- DIGITAL TWIN ENGINE: Weather & Solar Logic ---
const WeatherService = {
  cache: {
    data: null,
    lastFetch: 0
  },

  // Fetch from OpenWeatherMap
  getDatas: async function () {
    const DEMO_MODE = false; // Force Noon Simulation
    if (DEMO_MODE) { return { isDaytime: true, cloudCover: 10, sunFactor: 1.0 }; }

    const NOW = Date.now();
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

    // Return cached data if valid
    if (this.cache && this.cache.data && (NOW - this.cache.lastFetch < CACHE_DURATION)) {
      return this.processWeatherData(this.cache.data);
    }

    const API_KEY = process.env.OPENWEATHER_API_KEY;
    const CITY = process.env.CITY || 'Mumbai';

    if (!API_KEY || API_KEY === 'your_api_key_here') {
      // Only log this once ideally, but allowed for now
      // console.log('⚠️ No API Key found. Using Simulation.');
      return WeatherService.getSimulatedData();
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}`;
      const response = await axios.get(url);

      // Cache it
      this.cache = {
        data: response.data,
        lastFetch: NOW
      };
      console.log(`☁️ Fetched real weather for ${CITY}: ${response.data.weather[0].description}`);

      return WeatherService.processWeatherData(response.data);
    } catch (error) {
      console.error('❌ Weather API Error:', error.message);
      return WeatherService.getSimulatedData();
    }
  },

  processWeatherData: function (data) {
    const now = new Date(); // Current system time
    // Use sunrise/sunset from API to determine isDaytime
    // API returns unix timestamp (seconds), JS uses ms
    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);

    const isDaytime = now >= sunrise && now < sunset;
    const cloudCover = data.clouds.all; // 0-100%

    // Calculate Sun Factor based on time vs noon (simplified)
    // Ideal: Calculate elevation angle.
    // Approx: Bell curve between sunrise and sunset.
    let sunFactor = 0;
    if (isDaytime) {
      const totalDayDuration = sunset - sunrise;
      const timeSinceSunrise = now - sunrise;
      const progress = timeSinceSunrise / totalDayDuration; // 0.0 to 1.0

      // Parabola: 4 * x * (1 - x) peaks at 0.5 (noon-ish) with value 1
      sunFactor = 4 * progress * (1 - progress);
      sunFactor = Math.max(0, sunFactor);
    }

    return { isDaytime, cloudCover, sunFactor };
  },

  getSimulatedData: function () {
    const now = new Date();
    const hour = now.getHours();

    // Simple Day/Night Logic
    const isDaytime = hour >= 6 && hour < 18;

    // Simulate Cloud Cover (randomly changes slightly over time)
    // We'll just define a base cloud cover for now
    const cloudCover = 20; // 20% cloudy

    // Sun Position Factor (Simple Bell Curve for 6am to 6pm)
    let sunFactor = 0;
    if (isDaytime) {
      // Peak at noon (hour 12) -> 1.0
      // 6am/6pm -> 0.0
      const hourFromNoon = Math.abs(12 - hour);
      sunFactor = Math.max(0, 1 - (hourFromNoon / 6));
    }

    return { isDaytime, cloudCover, sunFactor };
  }
};

const SolarMathEngine = {
  calculateProduction: (sunFactor, cloudCover) => {
    const MAX_SOLAR_OUTPUT = 3000; // 3kW System

    // Logic: Max * SunAngle * (ClearSkyPercentage)
    const production = MAX_SOLAR_OUTPUT * sunFactor * (1 - (cloudCover / 100));
    return Math.floor(production); // Watts
  }
};

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const PORT = 3000;

// startup check
if (process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'your_api_key_here') {
  console.log('✅ OpenWeatherMap API Key detected. Live Digital Twin enabled.');
} else {
  console.log('⚠️ No valid API Key found. Digital Twin will run in Simulation Mode.');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve React build in production, or static files in development
if (process.env.NODE_ENV === 'production') {
  // Serve React build
  app.use(express.static(path.join(__dirname, 'dist')));

  // Serve React app for all routes (SPA routing)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // In development, serve static files
  app.use(express.static(path.join(__dirname, '.')));
}

// Store latest data
let currentData = {
  voltage: 0,
  current: 0,
  power: 0,
  energy: 0, // kWh
  bill: 0,   // ₹
  co2: 0,    // kg
  trees: 0,  // equivalent trees
  isNight: false,
  vampireAlert: false,
  wastedCost: 0,

  // Digital Twin Data
  solarProduction: 0,
  virtualGridPower: 0,
  virtualSavings: 0, // Rate of saving (₹/hr) or similar? Let's just track instantaneous saved power for now or accumulated savings?
  // Let's stick to instantaneous visualization for the chart first.

  timestamp: Date.now()
};

// Alert Storage
let alerts = []; // { id, type, message, time }
const MAX_ALERTS = 50;

function addAlert(type, message) {
  const alert = {
    id: Date.now(),
    type, // 'danger', 'warning', 'info'
    message,
    time: new Date().toLocaleTimeString()
  };

  alerts.unshift(alert);
  if (alerts.length > MAX_ALERTS) alerts.pop();

  io.emit('new-alert', alert);
}

const FIXED_CHARGE = 50.0; // ₹50 fixed monthly charge
const ELECTRICITY_DUTY = 0.05; // 5% duty

// Pricing Slabs (Example)
// 0-100 units: ₹3.00
// 101-300 units: ₹5.00
// >300 units: ₹7.00
function calculateBill(units) {
  let bill = 0;
  let remaining = units;

  // Slab 1
  let slab1 = Math.min(remaining, 100);
  bill += slab1 * 3.00;
  remaining -= slab1;

  // Slab 2
  if (remaining > 0) {
    let slab2 = Math.min(remaining, 200);
    bill += slab2 * 5.00;
    remaining -= slab2;
  }

  // Slab 3
  if (remaining > 0) {
    bill += remaining * 7.00;
  }

  // Add Fixed Charge
  bill += FIXED_CHARGE;

  // Add Duty
  bill += bill * ELECTRICITY_DUTY;

  return bill.toFixed(2);
}

// API Endpoint for ESP to send data
app.post('/api/data', async (req, res) => {
  const { voltage, current, power } = req.body;

  if (voltage !== undefined && current !== undefined) {
    const now = Date.now();
    // Handle first update or if timestamp is invalid
    const timeDiff = currentData.timestamp > 0
      ? Math.max(0, (now - currentData.timestamp) / 1000) // Prevent negative time
      : 1; // Default to 1 second on first update
    currentData.timestamp = now;

    // Update instantaneous values
    currentData.voltage = parseFloat(voltage);
    currentData.current = parseFloat(current);
    currentData.power = power !== undefined ? parseFloat(power) : (currentData.voltage * currentData.current);

    // Calculate Energy Increment (Power * Time)
    const energyIncrement = (currentData.power * timeDiff) / (1000 * 3600);
    currentData.energy += energyIncrement;

    // --- NEW: Eco-Gamification Logic ---
    // 1 kWh ≈ 0.82 kg CO2 (India Grid Average)
    const CO2_PER_KWH = 0.82;
    currentData.co2 = currentData.energy * CO2_PER_KWH;

    // A mature tree absorbs ~21kg CO2/year -> ~0.0024 kg/hour
    // "Trees Burnt" = Total CO2 / 21
    currentData.trees = currentData.co2 / 21.0;

    // --- NEW: Vampire Power Slayer (Night Mode) ---
    // Check if time is between 11 PM (23) and 6 AM (6)
    const currentHour = new Date(now).getHours();
    const isNight = (currentHour >= 23 || currentHour < 6);

    currentData.isNight = isNight;
    currentData.vampireAlert = false;
    currentData.wastedCost = 0;

    if (isNight) {
      // Vampire Criteria: Steady low power (10W - 200W)
      // Usually standby devices, not Fridge (intermittent) or Ac (high power)
      if (currentData.power > 10 && currentData.power < 200) {
        if (!currentData.vampireAlert) { // Only trigger once per "session" logic could be better but simple for now
          currentData.vampireAlert = true;
          // Calculate annualized wasted cost
          const wastedUnitsYearly = (currentData.power / 1000) * 24 * 365;
          currentData.wastedCost = (wastedUnitsYearly * 5.0).toFixed(0);

          addAlert('warning', `Vampire Power Detected! ${currentData.power}W being used at night.`);
        }
      }
    }

    // --- DIGITAL TWIN CALCULATION ---
    const weather = await WeatherService.getDatas();
    const solarOutput = SolarMathEngine.calculateProduction(weather.sunFactor, weather.cloudCover);

    // Debug Log
    console.log(`☀️ Solar Debug: Day? ${weather.isDaytime}, SunFactor: ${weather.sunFactor.toFixed(2)}, Output: ${solarOutput}W`);

    currentData.solarProduction = solarOutput;
    // Virtual Grid = Actual Load - Virtual Solar
    currentData.virtualGridPower = currentData.power - solarOutput;

    // Calculate instantaneous savings (approx ₹5/unit)
    currentData.virtualSavings = ((solarOutput / 1000) * 5.0).toFixed(2);

    // --- Alert Checks ---
    // 1. Overload
    if (currentData.power > 4000) {
      addAlert('danger', `High Power Usage! Currently extracting ${currentData.power}W`);
    }

    // 2. Voltage Fluctuation
    if (currentData.voltage < 200) {
      addAlert('warning', `Low Voltage Detected: ${currentData.voltage}V`);
    } else if (currentData.voltage > 250) {
      addAlert('danger', `High Voltage Surge: ${currentData.voltage}V`);
    }

    // Calculate Bill
    currentData.bill = calculateBill(currentData.energy);

    console.log(`Received - P: ${currentData.power}W, Vampire: ${currentData.vampireAlert}, CO2: ${currentData.co2.toFixed(4)}kg`);

    // Broadcast to all connected clients
    io.emit('energy-update', currentData);

    res.status(200).send('Data received');
  } else {
    res.status(400).send('Invalid data format');
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected');

  // Send the latest data immediately upon connection
  socket.emit('energy-update', currentData);

  // Send alert history
  socket.emit('alert-history', alerts);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
