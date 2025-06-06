const express = require('express');
const axios = require('axios');
const app = express();

const WEATHER_API_KEY = 'cc7112dd7b9735891f663e03adc5de75';
const FSQ_API_KEY = 'fsq3bNWgDW0xr6hOlVPLHIWkfHSt8wn0NzbsH/kPZpuhINQ=';

// Root Route - Serves HTML + JS
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8" />
        <title>Weather & Places</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
    </head>
    <body class="bg-light">
        <div class="container py-5">
            <h2 class="text-center mb-4">🌤 Weather & Places Finder</h2>
            <div class="input-group mb-3">
                <input
                  type="text"
                  id="cityInput"
                  class="form-control"
                  placeholder="Enter city name"
                  autocomplete="off"
                />
                <button class="btn btn-primary" onclick="getWeather()">Search</button>
            </div>
            <div id="result" class="mt-4"></div>
        </div>
        <script>
            async function getWeather() {
                const city = document.getElementById("cityInput").value.trim();
                const result = document.getElementById("result");
                if (!city) {
                    result.innerHTML = '<div class="alert alert-warning">Please enter a city.</div>';
                    return;
                }

                result.innerHTML = '<p class="text-center">Loading...</p>';

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
                        <div class="card mb-3">
                            <div class="card-body">
                                <h4 class="card-title">\${current.name}</h4>
                                <p class="card-text">
                                    <strong>Now:</strong> \${current.main.temp}°C, \${current.weather[0].description}
                                </p>
                            </div>
                        </div>

                        <h5>📅 Forecast (Next 3)</h5>
                        <ul class="list-group mb-3">
                            \${forecast.map(f => \`<li class="list-group-item">\${f.dt_txt}: \${f.main.temp}°C, \${f.weather[0].description}</li>\`).join('')}
                        </ul>

                        <h5>📍 Popular Places</h5>
                        <ul class="list-group mb-3">
                            \${places.map(p => \`<li class="list-group-item">\${p}</li>\`).join('')}
                        </ul>

                        <h6>🗓️ Best Time to Visit</h6>
                        <p>\${bestTime}</p>
                    \`;
                } catch (err) {
                    console.error('Fetch error:', err);
                    result.innerHTML = '<div class="alert alert-danger">Something went wrong.</div>';
                }
            }
        </script>
    </body>
    </html>
  `);
});

// Foursquare Places API
async function getPlacesToVisit(city) {
  const url = `https://api.foursquare.com/v3/places/search?near=\${encodeURIComponent(city)}&categories=16000&limit=5&sort=POPULARITY\`;

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
  return \`Spring and Autumn months are generally best to visit \${city}.\`;
}

// Weather endpoint
app.get('/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.json({ error: 'No city provided' });

  try {
    const currentRes = await axios.get(
      \`https://api.openweathermap.org/data/2.5/weather?q=\${encodeURIComponent(city)}&units=metric&appid=\${WEATHER_API_KEY}\`
    );

    const forecastRes = await axios.get(
      \`https://api.openweathermap.org/data/2.5/forecast?q=\${encodeURIComponent(city)}&units=metric&appid=\${WEATHER_API_KEY}\`
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
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
