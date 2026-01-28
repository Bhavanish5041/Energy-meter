# Smart Energy Meter & Solar Digital Twin

A real-time IoT energy monitoring system comprising an ESP-based hardware meter, a Node.js/Express backend with WebSockets, and a modern React frontend with Digital Twin capabilities.

---

## Table of Contents
- [About the Project](#about-the-project)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Hardware Setup](#hardware-setup)
- [API Reference](#api-reference)

---

## About the Project

The **Smart Energy Meter** is designed to provide homeowners with real-time visibility into their electricity consumption. Unlike traditional meters, this system processes data instantly to calculate costs based on dynamic slabs (Indian Electricity Duty standards), predicts monthly bills, and monitors voltage/power surges.

It also features a **Solar Digital Twin**, which uses live weather data (via OpenWeatherMap) to simulate how much power a solar panel setup would generate at your location, helping users understand potential savings before investing in hardware.

---

## Key Features

- **Real-Time Dashboard**: Live monitoring of Voltage (V), Current (A), Power (W), and Energy (kWh).
- **Dynamic Cost Calculation**:
  - Implements tiered pricing slabs (e.g., 0-100 units, 101-200 units).
  - Includes fixed charges and electricity duty.
- **Solar Digital Twin**:
  - Fetches real-time cloud cover and sunrise/sunset times.
  - Simulates solar power generation and calculates virtual savings.
- **Alert System**:
  - **Over-voltage/Under-voltage** detection.
  - **High Power Usage** warnings.
  - **Vampire Power Detection**: Alerts power usage during late night hours when devices should be off.
- **Simulation Mode**: Run the entire stack without hardware using the built-in ESP simulator.

---

## Technology Stack

- **Frontend**: React.js, Vite, Chart.js, CSS3 (Custom Dark/Light Theme).
- **Backend**: Node.js, Express.js, Socket.io (for real-time bi-directional communication).
- **Hardware Firmware**: C++ (Arduino Framework) for ESP8266/ESP32.
- **Tools**: Git, npm.

---

## Folder Structure

```
/
├── backend/            # Node.js Server & Simulator
│   ├── server.js       # Main entry point (Express + Socket.io)
│   └── mock_esp.js     # Simulation script for testing without hardware
├── firmware/           # Microcontroller Code
│   └── esp_code.ino    # Arduino sketch for ESP8266/ESP32
├── src/                # React Frontend Source
│   ├── components/     # Reusable UI components (Navbar, ThemeSwitch)
│   ├── pages/          # Main views (Dashboard, Analytics, Digital Twin)
│   └── hooks/          # Custom hooks (e.g., useSocket)
├── public/             # Static Assets
└── legacy/             # Archived files (ignored by git)
```

---

## Getting Started

### Prerequisites
- **Node.js**: v16 or higher.
- **Arduino IDE**: For flashing the physical code (optional if using simulator).

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Bhavanish5041/Energy-meter.git
    cd Energy-meter
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

### Configuration
Create a `.env` file in the root directory (optional, for Weather features):
```env
OPENWEATHER_API_KEY=your_api_key_here
CITY=Mumbai
```
*If no key is provided, the system falls back to a basic weather simulation.*

---

## Running the Application

### Option 1: Development Mode (Recommended)
Runs both the React frontend and Node backend.
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm start
```
Access the app at `http://localhost:5173`.

### Option 2: Simulation Mode
If you don't have the hardware yet, you can simulate an ESP device sending data to the server.
```bash
# Keep the backend running (npm start)
# Open a new terminal:
npm run simulate
```
You will see fake voltage and current data being sent to your dashboard instantly.

---

## Hardware Setup

1.  **Components**: ESP8266 or ESP32, PZEM-004T (Power Monitor Module).
2.  **Wiring**:
    - PZEM VCC -> 5V
    - PZEM GND -> GND
    - PZEM RX -> ESP TX (D2/GPIO)
    - PZEM TX -> ESP RX (D1/GPIO)
3.  **Flash Firmware**:
    - Open `firmware/esp_code.ino` in Arduino IDE.
    - Install `PZEM004Tv30` library.
    - Update the `ssid`, `password`, and `host` variables.
    - Upload to board.

---

## API Reference

#### POST `/api/data`
Receiver endpoint for energy data.
- **Body**: `{"voltage": 230.5, "current": 5.2, "power": 1200, "energy": 15.4}`
- **Response**: `200 OK`