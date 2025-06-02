const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.static('public'));

// Endpoint to get location by IP (called by frontend fallback)
app.get('/location', async (req, res) => {
  try {
    // Get client's IP from request headers or connection
    const ip = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '').split(',')[0].trim();

    // Use ipinfo.io API (replace with your token if you want, free tier can work without)
    const url = `https://ipinfo.io/${ip}/json`;

    const response = await axios.get(url);
    const loc = response.data.loc; // loc = "lat,lon"

    if (!loc) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const [latitude, longitude] = loc.split(',');

    res.json({ 
      latitude, 
      longitude, 
      city: response.data.city, 
      region: response.data.region, 
      country: response.data.country 
    });
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

// Nearby tourist places endpoint using Foursquare Places API
app.get('/places', async (req, res) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude are required' });
  }

  try {
    const fsqApiKey = process.env.FSQ_API_KEY;
    const url = 'https://api.foursquare.com/v3/places/search';

    const params = {
      ll: `${lat},${lon}`,
      radius: 1000,          // 1 km radius
      categories: '16000',   // Tourist Attractions category
      limit: 10
    };

    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': fsqApiKey,
        'Accept': 'application/json'
      }
    });

    const places = response.data.results.map(place => ({
      id: place.fsq_id,
      name: place.name,
      location: place.location,
      categories: place.categories.map(c => c.name),
      distance: place.distance
    }));

    res.json({ places });
  } catch (error) {
    console.error('Error fetching places:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
