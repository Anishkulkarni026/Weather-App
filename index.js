const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.static('public'));

// Endpoint to get location by IP (called by frontend fallback)
app.get('/location', async (req, res) => {
  try {
    // Get client's IP from request headers or connection
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';

    // You can log IP to debug:
    // console.log('Client IP:', ip);

    // Use ipinfo.io API (replace 'YOUR_IPINFO_TOKEN' with your token if needed)
    // Free tier doesn't require token, but better to get one for production
    const url = `https://ipinfo.io/${ip}/json`;

    const response = await axios.get(url);
    const loc = response.data.loc; // loc = "lat,lon"

    if (!loc) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const [latitude, longitude] = loc.split(',');

    res.json({ latitude, longitude, city: response.data.city, region: response.data.region, country: response.data.country });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get location from IP' });
  }
});

// Weather + Forecast endpoint
app.get('/weather', async (req, res) => {
  const { city, lat, lon } = req.query;
  const apiKey = process.env.API_KEY;
  try {
    let currentUrl = '';
    let forecastUrl = '';

    if (city) {
      currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    } else if (lat && lon) {
      currentUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
      forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
      return res.status(400).json({ error: 'City or lat/lon required' });
    }

    const [currentRes, forecastRes] = await Promise.all([
      axios.get(currentUrl),
      axios.get(forecastUrl)
    ]);

    res.json({ current: currentRes.data, forecast: forecastRes.data });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
