import React from 'react';
import './App.css';
import WeatherDualTemp from './WeatherDualTemp';

// PUBLIC_INTERFACE
function App() {
  return (
    <div className="app weather-app-gradient-bg">
      <nav className="navbar">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <div className="logo">
              <span className="logo-symbol" style={{ color: "#2196F3" }}>*</span> WeatherDualTemp
            </div>
            {/* Optionally place app-wide actions here */}
          </div>
        </div>
      </nav>
      <main>
        <div className="container flex-center-main">
          <WeatherDualTemp />
        </div>
      </main>
    </div>
  );
}

export default App;