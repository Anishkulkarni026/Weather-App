// index.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.static('public'));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
