# React Migration Guide

This project has been converted from vanilla HTML/JavaScript to React.

## Project Structure

```
src/
├── components/       # Reusable components
│   ├── Navbar.jsx
│   ├── Navbar.css
│   ├── ThemeSwitch.jsx
│   └── ...
├── pages/           # Page components
│   ├── Dashboard.jsx
│   ├── Analytics.jsx
│   ├── Alerts.jsx
│   └── Login.jsx
├── hooks/           # Custom hooks
│   ├── useSocket.js
│   └── useDarkMode.js
├── utils/           # Utility functions
├── App.jsx          # Main app component with routing
├── main.jsx         # Entry point
└── index.css        # Global styles

public/
├── theme_switch.css
└── logout.png
```

## Installation

```bash
npm install
```

## Development

```bash
# Start Vite dev server (React frontend)
npm run dev

# Start backend server (in another terminal)
npm start

# Run mock ESP simulator (in another terminal)
npm run simulate
```

## Build for Production

```bash
npm run build
```

This creates a `dist/` folder that can be served by the Express server.

## Changes Made

- All HTML files converted to React components
- Vanilla JavaScript converted to React hooks (useState, useEffect)
- Socket.io integrated with React hooks
- Chart.js integrated with react-chartjs-2
- React Router for navigation
- Dark mode managed through React state
- All features preserved: NILM, Budget Burn Rate, Charts, etc.

