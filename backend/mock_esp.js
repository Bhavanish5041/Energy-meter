import http from 'http';

const TARGET_URL = 'http://localhost:3000/api/data'; 
const INTERVAL_MS = 2000; 

console.log(`🔌 Starting ESP32 Simulator... Target: ${TARGET_URL}`);

function generateRandomData() {

  const voltage = (230 + (Math.random() * 60 - 30)).toFixed(1); 

  const current = (Math.random() * 19 + 1).toFixed(2);

  const power = (voltage * current).toFixed(0);

  return JSON.stringify({
    voltage: parseFloat(voltage),
    current: parseFloat(current),
    power: parseFloat(power),
    energy: parseFloat((power / 1000).toFixed(4)) 
  });
}

function sendData() {
  const data = generateRandomData();

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  };

  const req = http.request(TARGET_URL, options, (res) => {

  });

  req.on('error', (error) => {
    console.error(` Connection Error: ${error.message}`);
    console.error('   (Is your main server running?)');
  });

  req.write(data);
  req.end();

  console.log(` Sent: ${data}`);
}

setInterval(sendData, INTERVAL_MS);