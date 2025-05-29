const express = require('express');
const axios = require('axios');
const path = require('path');
require('dotenv').config();

const app = express();
const recentCities = [];

app.use(express.static('public'));

// Weather endpoint
app.get('/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.redirect('/');

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

    if (!recentCities.includes(city)) recentCities.unshift(city);
    if (recentCities.length > 5) recentCities.pop();

    const weatherHtml = `
      <a href="/">← Back</a>
      <div class="card">
        <h1>${city}</h1>
        <p>Current: ${curRes.data.weather[0].description}, ${curRes.data.main.temp}°C</p>
      </div>
    `;

    res.send(htmlWrapper(weatherHtml));
  } catch (e) {
    res.send(htmlWrapper('<p>Error fetching weather data</p>'));
  }
});

// Recently viewed endpoint
app.get('/recent', (req, res) => {
  if (recentCities.length === 0) {
    return res.send(htmlWrapper('<p>No recent cities viewed.</p>'));
  }
  const list = recentCities.map(c => `<li>${c}</li>`).join('');
  res.send(htmlWrapper(`<h2>Recently Viewed Cities:</h2><ul>${list}</ul><a href="/">← Back</a>`));
});

// Fallback for location detection
app.get('/detect-location', (req, res) => {
  res.send(htmlWrapper('<p>Geolocation requires JavaScript, which is disabled in this version. Please enter a city manually.</p><a href="/">← Back</a>'));
});

// Helper to wrap content in basic HTML
function htmlWrapper(content) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <title>Weather Result</title>
      <style>
        body {
          font-family: sans-serif;
          background: #222;
          color: #fff;
          text-align: center;
          padding: 40px;
        }
        .card {
          background: rgba(255,255,255,0.1);
          padding: 20px;
          border-radius: 10px;
          margin-top: 20px;
        }
        a {
          display: inline-block;
          margin-top: 20px;
          color: #fff;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>${content}</body>
    </html>
  `;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
