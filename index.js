const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static('public'));

const API_KEY = process.env.API_KEY;

// In-memory data store (for demo purposes)
const userData = {
  favorites: {}, // Format: { userId: [locationString] }
  alerts: {},    // Format: { userId: [alertObjects] }
};

// Helper: Format location nicely
function formatLocation(loc) {
  let name = loc.name;
  if (loc.state) name += `, ${loc.state}`;
  name += `, ${loc.country}`;
  return name;
}

// Endpoint: Suggest cities using OpenWeatherMap Geocoding API
app.get('/suggest', async (req, res) => {
  const query = req.query.q;
  if (!query || query.trim() === '') return res.json([]);

  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${API_KEY}`;

  try {
    const response = await axios.get(url);
    const suggestions = response.data.map(formatLocation);
    res.json(suggestions);
  } catch (err) {
    console.error('[Suggest API Error]', err.message);
    res.status(500).json([]);
  }
});

// Endpoint: Get weather, forecast, AQI, historical, sun/moon data
app.get('/weather', async (req, res) => {
  const { city, lat, lon } = req.query;
  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: 'City or lat/lon required' });
  }

  try {
    let weatherUrl, forecastUrl, aqiUrl = null, historicalPromises = [];

    if (city) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`;
    } else {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
      aqiUrl = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`;

      // Prepare historical data for past 5 days
      const now = Math.floor(Date.now() / 1000);
      const oneDay = 86400;
      for (let i = 1; i <= 5; i++) {
        const dt = now - i * oneDay;
        const historicalUrl = `https://api.openweathermap.org/data/2.5/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${dt}&appid=${API_KEY}&units=metric`;
        historicalPromises.push(axios.get(historicalUrl));
      }
    }

    // Fetch all in parallel
    const [currentRes, forecastRes, aqiRes, historicalRes] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(forecastUrl),
      aqiUrl ? axios.get(aqiUrl) : Promise.resolve({ data: null }),
      historicalPromises.length ? Promise.all(historicalPromises) : Promise.resolve([])
    ]);

    // Sun/Moon info placeholder
    const sunMoon = {
      sunrise: currentRes.data.sys.sunrise,
      sunset: currentRes.data.sys.sunset,
      moon_phase: 'waxing_gibbous' // You can replace this with accurate moon phase logic
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
    console.error('[Weather API Error]', e.message);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// Endpoint: Add to favorites
app.post('/favorites', (req, res) => {
  const { userId, location } = req.body;
  if (!userId || !location) {
    return res.status(400).json({ error: 'userId and location required' });
  }

  userData.favorites[userId] = userData.favorites[userId] || [];
  if (!userData.favorites[userId].includes(location)) {
    userData.favorites[userId].push(location);
  }

  res.json({ favorites: userData.favorites[userId] });
});

// Endpoint: Get favorites
app.get('/favorites', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }
  res.json({ favorites: userData.favorites[userId] || [] });
});

// Endpoint: Add weather alert
app.post('/alerts', (req, res) => {
  const { userId, alert } = req.body;
  if (!userId || !alert) {
    return res.status(400).json({ error: 'userId and alert required' });
  }

  userData.alerts[userId] = userData.alerts[userId] || [];
  userData.alerts[userId].push(alert);
  res.json({ alerts: userData.alerts[userId] });
});

// Endpoint: Get alerts
app.get('/alerts', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }
  res.json({ alerts: userData.alerts[userId] || [] });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🌦️ WeatherWise server running at http://localhost:${PORT}`);
});
