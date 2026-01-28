import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WeatherService = {
  cache: {
    data: null,
    lastFetch: 0
  },

  getDatas: async function () {
    const DEMO_MODE = false;
    if (DEMO_MODE) { return { isDaytime: true, cloudCover: 10, sunFactor: 1.0 }; }

    const NOW = Date.now();
    const CACHE_DURATION = 15 * 60 * 1000;

    if (this.cache && this.cache.data && (NOW - this.cache.lastFetch < CACHE_DURATION)) {
      return this.processWeatherData(this.cache.data);
    }

    const API_KEY = process.env.OPENWEATHER_API_KEY;
    const CITY = process.env.CITY || 'Mumbai';

    if (!API_KEY || API_KEY === 'your_api_key_here') {

      return WeatherService.getSimulatedData();
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}`;
      const response = await axios.get(url);

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
    const now = new Date();

    const sunrise = new Date(data.sys.sunrise * 1000);
    const sunset = new Date(data.sys.sunset * 1000);

    const isDaytime = now >= sunrise && now < sunset;
    const cloudCover = data.clouds.all;

    let sunFactor = 0;
    if (isDaytime) {
      const totalDayDuration = sunset - sunrise;
      const timeSinceSunrise = now - sunrise;
      const progress = timeSinceSunrise / totalDayDuration;

      sunFactor = 4 * progress * (1 - progress);
      sunFactor = Math.max(0, sunFactor);
    }

    return { isDaytime, cloudCover, sunFactor };
  },

  getSimulatedData: function () {
    const now = new Date();
    const hour = now.getHours();

    const isDaytime = hour >= 6 && hour < 18;

    const cloudCover = 20;

    let sunFactor = 0;
    if (isDaytime) {

      const hourFromNoon = Math.abs(12 - hour);
      sunFactor = Math.max(0, 1 - (hourFromNoon / 6));
    }

    return { isDaytime, cloudCover, sunFactor };
  }
};

const SolarMathEngine = {
  calculateProduction: (sunFactor, cloudCover) => {
    const MAX_SOLAR_OUTPUT = 3000;

    const production = MAX_SOLAR_OUTPUT * sunFactor * (1 - (cloudCover / 100));
    return Math.floor(production);
  }
};

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server);

const PORT = 3000;

if (process.env.OPENWEATHER_API_KEY && process.env.OPENWEATHER_API_KEY !== 'your_api_key_here') {
  console.log('✅ OpenWeatherMap API Key detected. Live Digital Twin enabled.');
} else {
  console.log('⚠️ No valid API Key found. Digital Twin will run in Simulation Mode.');
}

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
} else {
  app.use(express.static(path.join(__dirname, '..')));
}

let currentData = {
  voltage: 0,
  current: 0,
  power: 0,
  energy: 0,
  bill: 0,
  co2: 0,
  trees: 0,
  isNight: false,
  vampireAlert: false,
  wastedCost: 0,

  solarProduction: 0,
  virtualGridPower: 0,
  virtualSavings: 0,

  timestamp: Date.now()
};

let alerts = [];
const MAX_ALERTS = 50;

function addAlert(type, message) {
  const alert = {
    id: Date.now(),
    type,
    message,
    time: new Date().toLocaleTimeString()
  };

  alerts.unshift(alert);
  if (alerts.length > MAX_ALERTS) alerts.pop();

  io.emit('new-alert', alert);
}

const FIXED_CHARGE = 50.0;
const ELECTRICITY_DUTY = 0.05;

function calculateBill(units) {
  let bill = 0;
  let remaining = units;

  let slab1 = Math.min(remaining, 100);
  bill += slab1 * 3.00;
  remaining -= slab1;

  if (remaining > 0) {
    let slab2 = Math.min(remaining, 200);
    bill += slab2 * 5.00;
    remaining -= slab2;
  }

  if (remaining > 0) {
    bill += remaining * 7.00;
  }

  bill += FIXED_CHARGE;

  bill += bill * ELECTRICITY_DUTY;

  return bill.toFixed(2);
}

app.post('/api/data', async (req, res) => {
  const { voltage, current, power } = req.body;

  if (voltage !== undefined && current !== undefined) {
    const now = Date.now();

    const timeDiff = currentData.timestamp > 0
      ? Math.max(0, (now - currentData.timestamp) / 1000)
      : 1;
    currentData.timestamp = now;

    currentData.voltage = parseFloat(voltage);
    currentData.current = parseFloat(current);
    currentData.power = power !== undefined ? parseFloat(power) : (currentData.voltage * currentData.current);

    const energyIncrement = (currentData.power * timeDiff) / (1000 * 3600);
    currentData.energy += energyIncrement;

    const CO2_PER_KWH = 0.82;
    currentData.co2 = currentData.energy * CO2_PER_KWH;

    currentData.trees = currentData.co2 / 21.0;

    const currentHour = new Date(now).getHours();
    const isNight = (currentHour >= 23 || currentHour < 6);

    currentData.isNight = isNight;
    currentData.vampireAlert = false;
    currentData.wastedCost = 0;

    if (isNight) {

      if (currentData.power > 10 && currentData.power < 200) {
        if (!currentData.vampireAlert) {
          currentData.vampireAlert = true;

          const wastedUnitsYearly = (currentData.power / 1000) * 24 * 365;
          currentData.wastedCost = (wastedUnitsYearly * 5.0).toFixed(0);

          addAlert('warning', `Vampire Power Detected! ${currentData.power}W being used at night.`);
        }
      }
    }

    const weather = await WeatherService.getDatas();
    const solarOutput = SolarMathEngine.calculateProduction(weather.sunFactor, weather.cloudCover);

    console.log(`☀️ Solar Debug: Day? ${weather.isDaytime}, SunFactor: ${weather.sunFactor.toFixed(2)}, Output: ${solarOutput}W`);

    currentData.solarProduction = solarOutput;

    currentData.virtualGridPower = currentData.power - solarOutput;

    currentData.virtualSavings = ((solarOutput / 1000) * 5.0).toFixed(2);

    if (currentData.power > 4000) {
      addAlert('danger', `High Power Usage! Currently extracting ${currentData.power}W`);
    }

    if (currentData.voltage < 200) {
      addAlert('warning', `Low Voltage Detected: ${currentData.voltage}V`);
    } else if (currentData.voltage > 250) {
      addAlert('danger', `High Voltage Surge: ${currentData.voltage}V`);
    }

    currentData.bill = calculateBill(currentData.energy);

    console.log(`Received - P: ${currentData.power}W, Vampire: ${currentData.vampireAlert}, CO2: ${currentData.co2.toFixed(4)}kg`);

    io.emit('energy-update', currentData);

    res.status(200).send('Data received');
  } else {
    res.status(400).send('Invalid data format');
  }
});

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.emit('energy-update', currentData);

  socket.emit('alert-history', alerts);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
