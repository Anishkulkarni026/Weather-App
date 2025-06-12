const express = require('express');
const axios = require('axios');
const app = express();

const WEATHER_API_KEY = 'cc7112dd7b9735891f663e03adc5de75';
const FSQ_API_KEY = 'fsq3bNWgDW0xr6hOlVPLHIWkfHSt8wn0NzbsH/kPZpuhINQ=';


app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <h1 class="title">Weather & Wonders Explorer</h1>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@600&display=swap">
  <style>
    body, html {
      height: 100%;
      margin: 0;
      font-family: 'Poppins', sans-serif;
      overflow-x: hidden;
      background-color: #002b5c;

      color: #333;
    }

    #vanta-bg {
      position: fixed;
      width: 100%;
      height: 100%;
      z-index: -1;
      top: 0;
      left: 0;
    }

    .container {
      position: relative;
      z-index: 10;
    }

    .weather-card {
      background: rgba(255, 255, 255, 0.85);
      backdrop-filter: blur(12px);
      border-radius: 20px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      padding: 35px;
      margin-top: 30px;
      animation: fadeIn 1s ease-in-out;
    }

    .city-name {
      font-size: 2.5rem;
      font-weight: 600;
      color: #0d6efd;
    }

    .flag {
      width: 32px;
      margin-left: 10px;
      vertical-align: middle;
    }

  

.section-title {
  font-family: 'Nunito', sans-serif;
  font-size: 1.3rem;
  font-weight: 600;
  margin-top: 25px;
  border-left: 5px solid #0d6efd;
  padding-left: 12px;
  color: #2c3e50;
}


    .forecast-card {
      min-width: 140px;
      background:#ADD8E6;
      border-radius: 12px;
      padding: 18px;
      margin: 10px;
      text-align: center;
      box-shadow: 0 6px 15px rgba(0,0,0,0.08);
    }

    .forecast-icon {
      width: 50px;
      height: 50px;
    }

    .btn-lg {
      border-radius: 50px;
      padding: 12px 32px;
    }

    .greeting {
      font-size: 1.25rem;
      margin-top: 20px;
      color: #fff;
    }
    .title {
  font-size: 3rem;
  font-weight: 700;
  color: #ffffff;
  text-align: center;
  margin-top: 30vh;
  animation: fadeSlideIn 2s ease-out forwards;
  opacity: 0;
}

/* Slide & Fade In Animation */
@keyframes fadeSlideIn {
  0% {
    opacity: 0;
    transform: translateY(-40px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}


    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
  .fade-up {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeUp 1s ease-out forwards;
  }

  .fade-up-delay {
    animation-delay: 1.5s;
  }

  @keyframes fadeUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }    
  </style>
</head>
<body>
  <div id="vanta-bg"></div>

  <div class="container py-5 text-center">
    <div class="greeting text-white" id="greeting"></div>
    <div class="text-center my-4 fade-up fade-up-delay">
  <input type="text" id="cityInput" class="form-control form-control-lg w-75 mx-auto rounded-pill" placeholder="Enter a city..." />
  <button class="btn btn-primary btn-lg mt-3" onclick="getWeather()"><i class="fas fa-search"></i> Search</button>
</div>


    <div id="result"></div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.waves.min.js"></script>
  <script>
    VANTA.WAVES({
      el: "#vanta-bg",
      color: 0x0077ff,
      shininess: 50,
      waveHeight: 20,
      waveSpeed: 1.2,
      zoom: 1.1,
    });

    const greetingEl = document.getElementById("greeting");
    const hour = new Date().getHours();
    greetingEl.textContent = hour < 12
      ? "Good morning!"
      : hour < 18
      ? "Good afternoon!"
      : "Good evening!";

    async function getWeather() {
      const city = document.getElementById("cityInput").value.trim();
      const result = document.getElementById("result");

      if (!city) {
        result.innerHTML = '<div class="alert alert-warning">Please enter a city name.</div>';
        return;
      }

      result.innerHTML = \`
        <div class="text-center text-white mt-5">
          <div class="spinner-border text-light"></div>
          <p>Loading weather data...</p>
        </div>\`;

      try {
        const response = await fetch(\`/weather?city=\${encodeURIComponent(city)}\`);
        const data = await response.json();

        if (data.error) {
          result.innerHTML = \`<div class="alert alert-danger mt-4">\${data.error}</div>\`;
          return;
        }

        const current = data.current;
        const forecast = groupForecastByDay(data.forecast.list);
        const places = data.placesToVisit;
        const bestTime = data.bestTime;
        const flagUrl = \`https://flagsapi.com/\${current.sys.country}/flat/64.png\`;

        result.innerHTML = \`
          <div class="weather-card mx-auto">
            <div class="text-center">
              <div class="city-name">\${current.name}, \${current.sys.country}
                <img class="flag" src="\${flagUrl}" alt="\${current.sys.country} flag" />
              </div>
              <p class="lead">\${current.weather[0].description} — <strong>\${current.main.temp.toFixed(1)}°C</strong></p>
              <p class="text-muted">Humidity: \${current.main.humidity}% | Wind: \${current.wind.speed} m/s</p>
            </div>

            <div class="section-title"><i class="fas fa-calendar-alt me-2"></i>5-Day Forecast</div>
            <div class="d-flex flex-wrap justify-content-center">
              \${forecast.map(f => \`
                <div class="forecast-card">
                  <strong>\${f.date}</strong>
                  <img class="forecast-icon" src="https://openweathermap.org/img/wn/\${f.icon}@2x.png" />
                  <div>\${f.description}</div>
                  <div class="text-primary"><i class="fas fa-temperature-low"></i> \${f.minTemp}°C</div>
                  <div class="text-danger"><i class="fas fa-temperature-high"></i> \${f.maxTemp}°C</div>
                </div>\`).join('')}
            </div>

            <div class="section-title"><i class="fas fa-map-marked-alt me-2"></i>Top Attractions</div>
            <ul class="list-group mb-4">
              \${places.map(p => \`<li class="list-group-item">\${p}</li>\`).join('')}
            </ul>

            <div class="section-title"><i class="fas fa-clock me-2"></i>Best Time to Visit</div>
            <p>\${bestTime}</p>
          </div>
        \`;
      } catch (err) {
        result.innerHTML = '<div class="alert alert-danger">Something went wrong while fetching data.</div>';
      }
    }

    function groupForecastByDay(list) {
      const days = {};
      list.forEach(f => {
        const date = f.dt_txt.split(' ')[0];
        if (!days[date]) days[date] = [];
        days[date].push(f);
      });

      return Object.entries(days).slice(0, 5).map(([date, items]) => {
        const temps = items.map(i => i.main.temp);
        const min = Math.min(...temps).toFixed(1);
        const max = Math.max(...temps).toFixed(1);
        const mid = items.find(i => i.dt_txt.includes('12:00:00')) || items[0];
        return {
          date,
          minTemp: min,
          maxTemp: max,
          description: mid.weather[0].description,
          icon: mid.weather[0].icon
        };
      });
    }
  </script>
</body>
</html>`);
});

async function getPlacesToVisit(city) {
  try {
    const url = `https://api.foursquare.com/v3/places/search?near=${encodeURIComponent(city)}&categories=16000&limit=5`;
    const response = await axios.get(url, {
      headers: {
        'Authorization': FSQ_API_KEY
      }
    });
    return response.data.results?.map(place => place.name) || ['No popular places found'];
  } catch {
    return ['Unable to fetch places.'];
  }
}

function getBestTimeToVisit(city) {
  return `October to March is typically the most comfortable times to visit ${city}.`;
}

app.get('/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.json({ error: 'City not provided' });

  try {
    const [currentRes, forecastRes] = await Promise.all([
      axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`),
      axios.get(`https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`)
    ]);

    const placesToVisit = await getPlacesToVisit(city);
    const bestTime = getBestTimeToVisit(city);

    res.json({
      current: currentRes.data,
      forecast: forecastRes.data,
      placesToVisit,
      bestTime
    });
  } catch (err) {
    res.json({ error: 'Unable to fetch weather data. Please check the city name.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('🌐 Server running at http://localhost:\${PORT}'));
