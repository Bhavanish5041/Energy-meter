# Smart Energy Meter - React Version

This project has been fully converted to React with Vite as the build tool.

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Development

Run the following in separate terminals:

**Terminal 1 - React Dev Server:**
```bash
npm run dev
```
Runs on http://localhost:5173

**Terminal 2 - Backend Server:**
```bash
npm start
```
Runs on http://localhost:3000

**Terminal 3 - Mock ESP Simulator (Optional):**
```bash
npm run simulate
```

### Production Build

```bash
npm run build
```

This creates a `dist/` folder with the optimized React app.

To run in production mode:
```bash
NODE_ENV=production npm start
```

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx      # Navigation bar
│   ├── Navbar.css
│   ├── ThemeSwitch.jsx # Dark/Light mode toggle
│   └── ThemeSwitch.css
├── pages/              # Page components
│   ├── Dashboard.jsx   # Main dashboard (NILM, Budget, Charts)
│   ├── Dashboard.css
│   ├── Analytics.jsx   # Analytics with charts
│   ├── Analytics.css
│   ├── Alerts.jsx      # Alerts page
│   ├── Alerts.css
│   ├── Login.jsx       # Login page
│   └── Login.css
├── hooks/              # Custom React hooks
│   └── useSocket.js    # Socket.io hook
├── styles/             # Shared styles
├── App.jsx             # Main app component with routing
├── App.css
├── main.jsx            # React entry point
└── index.css           # Global styles

public/
├── theme_switch.css    # Theme switch styles
└── logout.png

server.js               # Express backend with Socket.io
vite.config.js          # Vite configuration
```

## ✨ Features

All original features preserved and enhanced:

- ✅ **Real-time Energy Monitoring** - Socket.io integration
- ✅ **NILM (Non-Intrusive Load Monitoring)** - Appliance detection from power spikes
- ✅ **Budget Burn Rate** - Monthly budget tracking with predictions
- ✅ **Live Charts** - Real-time power consumption graphs
- ✅ **Analytics Dashboard** - Multiple chart visualizations
- ✅ **Vampire Power Detection** - Night mode energy waste alerts
- ✅ **Eco Stats** - Carbon footprint and tree equivalent
- ✅ **Dark Mode** - Theme switching with persistence
- ✅ **React Router** - Client-side routing
- ✅ **Responsive Design** - Mobile-friendly layout

## 🔧 Technology Stack

- **React 18** - UI framework
- **React Router 6** - Routing
- **Vite** - Build tool and dev server
- **Chart.js + react-chartjs-2** - Data visualization
- **Socket.io Client** - Real-time communication
- **Express.js** - Backend server
- **Socket.io** - WebSocket server

## 📝 Notes

- The React app runs on port 5173 in development (Vite)
- The backend server runs on port 3000
- Vite proxy is configured to forward `/socket.io` and `/api` requests to the backend
- All state is managed with React hooks (useState, useEffect)
- Socket.io connection is handled in a custom hook (useSocket)

## 🐛 Troubleshooting

If Socket.io connection fails:
1. Ensure backend server is running on port 3000
2. Check that Vite proxy is configured correctly in `vite.config.js`
3. Verify CORS settings in `server.js`

If build fails:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Try `npm run build`

