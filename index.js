const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json()); // for parsing application/json
app.use(express.static('public'));

const API_KEY = process.env.API_KEY;

// In-memory store for favorites and alerts per user (demo purpose)
const userData = {
  favorites: {}, // { userId: [locationString] }
  alerts: {},    // { userId: [alertObjects] }
};

// Helper: format location name for suggestions
function formatLocation(loc) {
  let name = loc.name;
  if (loc.state) name += `, ${loc.state}`;
  name += `, ${loc.country}`;
  return name;
}

// Suggest cities endpoint using OpenWeatherMap Geocoding API
app.get('/suggest', async (req, res) => {
  const q = req.query.q;
  if (!q || q.length < 1) return res.json([]);
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${API_KEY}`;
  try {
    const response = await axios.get(url);
    const suggestions = response.data.map(formatLocation);
    res.json(suggestions);
  } catch (err) {
    console.error('Suggest error:', err.message);
    res.status(500).json([]);
  }
});

// Weather + Forecast + AQI + Historical + Sun/Moon endpoint
app.get('/weather', async (req, res) => {
  const { city, lat, lon } = req.query;
  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: 'City or lat/lon required' });
  }

  try {
    let weatherUrl, forecastUrl, aqiUrl, historicalPromises;

    if (city) {
      // If city is provided, use city for current and forecast, but no AQI or historical (need lat/lon)
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
      aqiUrl = null;
      historicalPromises = null;
    } else {
      // If lat/lon provided, get all data
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      aqiUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

      // Historical data for past 5 days
      const now = Math.floor(Date.now() / 1000);
      const oneDay = 86400;
      historicalPromises = [];
      for (let i = 1; i <= 5; i++) {
        const dt = now - i * oneDay;
        historicalPromises.push(
          axios.get(`https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${dt}&appid=${API_KEY}&units=metric`)
        );
      }
    }

    const [currentRes, forecastRes, aqiRes, historicalRes] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(forecastUrl),
      aqiUrl ? axios.get(aqiUrl) : Promise.resolve({ data: null }),
      historicalPromises ? Promise.all(historicalPromises) : Promise.resolve([])
    ]);

    // Sun and Moon info (moon_phase is placeholder)
    const sunMoon = {
      sunrise: currentRes.data.sys.sunrise,
      sunset: currentRes.data.sys.sunset,
      moon_phase: 'waxing_gibbous', // placeholder: actual moon phase needs a separate calculation or API
    };

    // Format historical data
    const historical = historicalRes.map(r => ({
      date: new Date(r.data.current.dt * 1000).toISOString().split('T')[0],
      temp: r.data.current.temp,
      weather: r.data.current.weather,
    }));

    res.json({
      current: currentRes.data,
      forecast: forecastRes.data,
      air_quality: aqiRes.data,
      historical,
      sun_moon: sunMoon,
    });
  } catch (e) {
    console.error('Weather fetch error:', e.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Favorites API - Add a location
app.post('/favorites', (req, res) => {
  const { userId, location } = req.body;
  if (!userId || !location) return res.status(400).json({ error: 'userId and location required' });
  userData.favorites[userId] = userData.favorites[userId] || [];
  if (!userData.favorites[userId].includes(location)) {
    userData.favorites[userId].push(location);
  }
  res.json({ favorites: userData.favorites[userId] });
});

// Favorites API - Get favorites for user
app.get('/favorites', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  res.json({ favorites: userData.favorites[userId] || [] });
});

// Alerts API - Add alert
app.post('/alerts', (req, res) => {
  const { userId, alert } = req.body;
  if (!userId || !alert) return res.status(400).json({ error: 'userId and alert required' });
  userData.alerts[userId] = userData.alerts[userId] || [];
  userData.alerts[userId].push(alert);
  res.json({ alerts: userData.alerts[userId] });
});

// Alerts API - Get alerts for user
app.get('/alerts', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  res.json({ alerts: userData.alerts[userId] || [] });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
