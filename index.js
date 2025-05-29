const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.static('public')); // serve your frontend files here

// Suggestion endpoint (uses OpenWeatherMap Geocoding API)
app.get('/suggest', async (req, res) => {
  const q = req.query.q;
  if (!q || q.length < 1) return res.json([]);
  const apiKey = process.env.API_KEY;
  const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=5&appid=${apiKey}`;
  try {
    const response = await axios.get(url);
    const suggestions = response.data.map(loc => {
      let name = loc.name;
      if (loc.state) name += `, ${loc.state}`;
      name += `, ${loc.country}`;
      return name;
    });
    res.json(suggestions);
  } catch (err) {
    res.status(500).json([]);
  }
});

// Weather + Forecast endpoint
app.get('/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.status(400).json({ error: 'City required' });
  const key = process.env.API_KEY;
  const urls = {
    current: `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${key}&units=metric`,
    forecast: `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${key}&units=metric`
  };

  try {
    const [curRes, fctRes] = await Promise.all([
      axios.get(urls.current),
      axios.get(urls.forecast)
    ]);
    res.json({ current: curRes.data, forecast: fctRes.data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

// New Nearby weather endpoint (used in your detectNearby function)
app.get('/nearby', async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

  const key = process.env.API_KEY;
  // OpenWeatherMap "find" API to get weather for nearby locations within 50 km radius
  const url = `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=10&units=metric&appid=${key}`;

  try {
    const response = await axios.get(url);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch nearby weather data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
