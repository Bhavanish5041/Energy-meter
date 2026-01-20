import http from 'http';

// Configuration
const TARGET_URL = 'http://localhost:3000/api/data'; // Ensure this matches your server route
const INTERVAL_MS = 2000; // Send data every 2 seconds

console.log(`🔌 Starting ESP32 Simulator... Target: ${TARGET_URL}`);

function generateRandomData() {
  // Simulate fluctuating voltage around 230V (with occasional spikes/dips)
  const voltage = (230 + (Math.random() * 60 - 30)).toFixed(1); // 200-260V range
  // Simulate current (occasional spikes up to 20A)
  const current = (Math.random() * 19 + 1).toFixed(2);
  // Calculate power
  const power = (voltage * current).toFixed(0);

  return JSON.stringify({
    voltage: parseFloat(voltage),
    current: parseFloat(current),
    power: parseFloat(power),
    energy: parseFloat((power / 1000).toFixed(4)) // kWh snapshot
  });
}

function sendData() {
  const data = generateRandomData();

  // Setup the request
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = http.request(TARGET_URL, options, (res) => {
    // Optional: Log server response status
    // console.log(`Status: ${res.statusCode}`);
  });

  req.on('error', (error) => {
    console.error(` Connection Error: ${error.message}`);
    console.error('   (Is your main server running?)');
  });

  req.write(data);
  req.end();

  console.log(` Sent: ${data}`);
}

// Start the loop
setInterval(sendData, INTERVAL_MS);