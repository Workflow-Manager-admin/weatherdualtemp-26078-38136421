import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * WeatherDualTemp main container.
 * - User can input a location (city).
 * - On search/refresh, fetches weather via OpenWeatherMap.
 * - Shows temperature in both Fahrenheit & Celsius on a styled card.
 * - Handles loading and error states.
 * - Themed with primary: #2196F3, secondary: #FFFFFF, accent: #FF9800.
 */
function WeatherDualTemp() {
  // App state
  const [location, setLocation] = useState("");
  const [query, setQuery] = useState(""); // To trigger fetch on search rather than each keystroke
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Replace with your own OpenWeatherMap API key for production
  const API_KEY = "demo"; // 'demo' will not return real data, user must supply key

  // PUBLIC_INTERFACE
  async function fetchWeather(loc) {
    setLoading(true);
    setError("");
    setWeather(null);
    try {
      const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        loc
      )}&units=metric&appid=${API_KEY}`;
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error("Location not found.");
      }
      const data = await response.json();
      setWeather({
        name: data.name,
        country: data.sys?.country || "",
        celsius: Math.round(data.main.temp),
        fahrenheit: Math.round((data.main.temp * 9) / 5 + 32),
        icon: data.weather?.[0]?.icon,
        weatherMain: data.weather?.[0]?.main,
        weatherDesc: data.weather?.[0]?.description,
      });
    } catch (err) {
      setError(err.message || "Error fetching weather.");
    } finally {
      setLoading(false);
    }
  }

  // PUBLIC_INTERFACE
  function handleInputChange(e) {
    setLocation(e.target.value);
  }

  // PUBLIC_INTERFACE
  function handleSearch(e) {
    e.preventDefault();
    if (location.trim()) {
      setQuery(location.trim());
      fetchWeather(location.trim());
    }
  }

  // PUBLIC_INTERFACE
  function handleRefresh() {
    if (query) fetchWeather(query);
  }

  // Styles for the card and content
  return (
    <div className="weather-card-container">
      <form className="weather-form" onSubmit={handleSearch}>
        <input
          className="weather-input"
          type="text"
          placeholder="Enter city..."
          value={location}
          onChange={handleInputChange}
          aria-label="Enter city"
        />
        <button
          type="submit"
          className="btn weather-btn"
          disabled={loading || !location.trim()}
          aria-label="Search weather"
        >
          {loading ? "Loading..." : "Search"}
        </button>
        <button
          type="button"
          className="btn weather-btn-refresh"
          style={{ marginLeft: 8 }}
          onClick={handleRefresh}
          disabled={loading || !query}
          aria-label="Refresh weather"
        >
          &#x21bb;
        </button>
      </form>

      <div className="weather-centered-card">
        {error && (
          <div className="weather-error" data-testid="weather-error">
            {error}
          </div>
        )}
        {!error && weather && (
          <div className="weather-info">
            <div className="weather-location">
              <span className="weather-city">{weather.name}</span>
              {weather.country && (
                <span className="weather-country">, {weather.country}</span>
              )}
            </div>
            <div className="weather-main">
              {weather.icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.weatherDesc}
                  className="weather-icon"
                />
              )}
              <span className="weather-condition">
                {weather.weatherMain}
                {weather.weatherDesc
                  ? ` (${weather.weatherDesc})`
                  : null}
              </span>
            </div>
            <div className="weather-temp-pair">
              <div className="weather-temp-celsius">
                <span className="weather-temp-val">{weather.celsius}&deg;C</span>
              </div>
              <span className="weather-temp-divider">|</span>
              <div className="weather-temp-fahrenheit">
                <span className="weather-temp-val">{weather.fahrenheit}&deg;F</span>
              </div>
            </div>
          </div>
        )}
        {!error && !weather && (
          <div className="weather-placeholder">
            Enter a city above and click Search to see the weather!
          </div>
        )}
      </div>
      <div className="weather-credit">
        <small>
          Data from <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer">OpenWeatherMap</a>
        </small>
      </div>
    </div>
  );
}

export default WeatherDualTemp;
