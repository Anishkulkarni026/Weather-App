const express = require('express');
const axios = require('axios');
const app = express();

const WEATHER_API_KEY = 'cc7112dd7b9735891f663e03adc5de75';
const FSQ_API_KEY = 'fsq3bNWgDW0xr6hOlVPLHIWkfHSt8wn0NzbsH/kPZpuhINQ=';

// Root Route - Serves Professional UI
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Weather & Places Forecast</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
  <style>
    body {
      background: linear-gradient(to right, #83a4d4, #b6fbff);
      min-height: 100vh;
      font-family: 'Segoe UI', sans-serif;
    }
    .weather-card {
      background: #fff;
      border-radius: 15px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
      padding: 30px;
      margin-top: 20px;
    }
    .forecast-item {
      border: none;
      background: #f8f9fa;
      border-radius: 10px;
      margin-bottom: 10px;
    }
    .section-title {
      margin-top: 30px;
      font-weight: bold;
      border-bottom: 2px solid #0d6efd;
      padding-bottom: 5px;
    }
    .city-name {
      font-size: 28px;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <div class="container py-5">
    <div class="text-center mb-4">
      <h1><i class="fas fa-cloud-sun"></i> Weather & Places Forecast</h1>
      <p class="text-muted">Get current weather, forecast, and popular places instantly</p>
    </div>

    <div class="input-group input-group-lg mb-4">
      <input type="text" id="cityInput" class="form-control" placeholder="Enter city name" autocomplete="off">
      <button class="btn btn-primary" onclick="getWeather()">Search</button>
    </div>

    <div id="result"></div>
  </div>

  <script>
    async function getWeather() {
      const city = document.getElementById("cityInput").value.trim();
      const result = document.getElementById("result");
      if (!city) {
        result.innerHTML = '<div class="alert alert-warning">Please enter a city.</div>';
        return;
      }

      result.innerHTML = '<div class="text-center text-primary"><div class="spinner-border" role="status"></div><p>Loading data...</p></div>';

      try {
        const response = await fetch(\`/weather?city=\${encodeURIComponent(city)}\`);
        const data = await response.json();

        if (data.error) {
          result.innerHTML = \`<div class="alert alert-danger">\${data.error}</div>\`;
          return;
        }

        const current = data.current;
        const forecast = data.forecast.list.slice(0, 3);
        const places = data.placesToVisit;
        const bestTime = data.bestTime;

        result.innerHTML = \`
          <div class="weather-card">
            <div class="mb-4">
              <div class="city-name">\${current.name}</div>
              <div><i class="fas fa-thermometer-half text-danger"></i> \${current.main.temp}°C &mdash; \${current.weather[0].description}</div>
              <small class="text-muted">Humidity: \${current.main.humidity}% | Wind: \${current.wind.speed} m/s</small>
            </div>

            <div class="section-title"><i class="fas fa-calendar-day"></i> Next 3 Forecasts</div>
            <ul class="list-group mb-4">
              \${forecast.map(f => \`
                <li class="list-group-item forecast-item d-flex justify-content-between align-items-center">
                  <span>\${f.dt_txt}</span>
                  <span><i class="fas fa-temperature-high text-warning"></i> \${f.main.temp}°C - \${f.weather[0].description}</span>
                </li>
              \`).join('')}
            </ul>

            <div class="section-title"><i class="fas fa-map-marker-alt"></i> Top Places to Visit</div>
            <ul class="list-group mb-4">
              \${places.map(p => \`<li class="list-group-item">\${p}</li>\`).join('')}
            </ul>

            <div class="section-title"><i class="fas fa-calendar-check"></i> Best Time to Visit</div>
            <p class="mb-0">\${bestTime}</p>
          </div>
        \`;
      } catch (err) {
        console.error('Fetch error:', err);
        result.innerHTML = '<div class="alert alert-danger">Something went wrong. Please try again later.</div>';
      }
    }
  </script>
</body>
</html>
  `);
});

// Get popular places using Foursquare Places API
async function getPlacesToVisit(city) {
  const url = `https://api.foursquare.com/v3/places/search?near=${encodeURIComponent(city)}&categories=16000&limit=5&sort=POPULARITY`;

  try {
    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': FSQ_API_KEY,
      },
    });

    const data = response.data;
    return data.results?.length > 0 ? data.results.map(place => place.name) : ['No popular places found'];
  } catch (err) {
    console.error('Foursquare API error:', err.message);
    return ['Error fetching places'];
  }
}

// Static best time function
function getBestTimeToVisit(city) {
  return `Spring and Autumn months are generally best to visit ${city}.`;
}

// Weather endpoint
app.get('/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.json({ error: 'No city provided' });

  try {
    const currentRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`
    );

    const forecastRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`
    );

    const placesToVisit = await getPlacesToVisit(city);
    const bestTime = getBestTimeToVisit(city);

    res.json({
      current: currentRes.data,
      forecast: forecastRes.data,
      placesToVisit,
      bestTime,
    });
  } catch (err) {
    console.error(err.message);
    res.json({ error: 'City not found or something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));


