// index.js

// OpenWeather API key - put your real key in .env and server will proxy requests
// For this demo, the server handles /weather and /nearby endpoints

async function getWeather() {
  const city = document.getElementById('city').value.trim();
  if (!city) {
    alert('Please enter a city name.');
    return;
  }

  try {
    const res = await fetch(`/weather?city=${encodeURIComponent(city)}`);
    if (!res.ok) throw new Error('City not found or API error');
    const data = await res.json();

    // Save city to recently viewed
    saveCity(city);

    displayWeather(data);
  } catch (e) {
    alert('Error fetching weather: ' + e.message);
    clearDisplay();
  }
}

function displayWeather(data) {
  const current = data.current;
  const forecast = data.forecast;

  const weatherInfo = `
    <div class="card">
      <h2>${current.name}, ${current.sys.country}</h2>
      <p><strong>${current.weather[0].main}</strong> - ${current.weather[0].description}</p>
      <p>Temperature: ${current.main.temp} °C</p>
      <p>Humidity: ${current.main.humidity}%</p>
      <p>Wind: ${current.wind.speed} m/s</p>
    </div>
  `;

  let forecastHtml = '<h3>5-day Forecast</h3>';
  // Show forecast for every 8th item (24h step in 3h intervals)
  forecastHtml += forecast.list.filter((_, i) => i % 8 === 0).map(item => `
    <div class="card">
      <p><strong>${new Date(item.dt * 1000).toLocaleDateString()}</strong></p>
      <p>${item.weather[0].main} - ${item.weather[0].description}</p>
      <p>Temp: ${item.main.temp} °C</p>
    </div>
  `).join('');

  document.getElementById('weather-info').innerHTML = weatherInfo;
  document.getElementById('forecast').innerHTML = forecastHtml;
}

function clearDisplay() {
  document.getElementById('weather-info').innerHTML = '';
  document.getElementById('forecast').innerHTML = '';
  document.getElementById('nearby').innerHTML = '';
  document.getElementById('dayout').innerHTML = '';
}

// Recently viewed cities stored in localStorage
function saveCity(city) {
  let saved = JSON.parse(localStorage.getItem('recentCities') || '[]');
  if (!saved.includes(city)) {
    saved.unshift(city);
    if (saved.length > 5) saved.pop();
    localStorage.setItem('recentCities', JSON.stringify(saved));
  }
}

function renderSaved() {
  let saved = JSON.parse(localStorage.getItem('recentCities') || '[]');
  if (saved.length === 0) {
    alert('No recently viewed cities.');
    return;
  }
  const list = saved.map(city => `<li style="color:#fff; cursor:pointer;" onclick="selectCity('${city}')">${city}</li>`).join('');
  document.getElementById('weather-info').innerHTML = `<h3>Recently Viewed Cities</h3><ul>${list}</ul>`;
  document.getElementById('forecast').innerHTML = '';
  document.getElementById('nearby').innerHTML = '';
  document.getElementById('dayout').innerHTML = '';
}

function selectCity(city) {
  document.getElementById('city').value = city;
  getWeather();
}

// Use browser geolocation to detect nearby weather and day out spots
async function detectNearby() {
  if (!navigator.geolocation) {
    alert('Geolocation not supported by your browser.');
    return;
  }

  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;

    try {
      // Reverse geocode city using OpenCage (this key should be kept secret in real app)
      const opencageKey = '51d3a41ce63d4180828c457a896dcd0e';
      const geoRes = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${opencageKey}`);
      const geoData = await geoRes.json();

      const city = geoData?.results[0]?.components?.city
        || geoData?.results[0]?.components?.town
        || geoData?.results[0]?.components?.village
        || 'your location';

      document.getElementById('city').value = city;
      getWeather();

      // Fetch nearby weather spots from your backend
      const nearbyRes = await fetch(`/nearby?lat=${latitude}&lon=${longitude}`);
      const nearbyData = await nearbyRes.json();

      const spots = nearbyData.list.map(loc => `
        <div class="card">
          <p><strong>${loc.name}</strong></p>
          <p>${loc.weather[0].main} | ${loc.main.temp}°C</p>
        </div>
      `).join('');
      document.getElementById('nearby').innerHTML = `<h3>Nearby Weather</h3>` + spots;

      // Suggest day out spots from OpenCage results (tourism/attraction)
      const dayOutSpots = geoData.results.filter(r =>
        r.components.tourism || r.components.attraction
      ).slice(0, 5).map(place => `
        <div class="card">
          <p><strong>${place.formatted}</strong></p>
          <p>Category: ${place.components.tourism || place.components.attraction}</p>
          <p>🕐 Best Time: ${suggestBestTime(nearbyData.list[0])}</p>
        </div>
      `).join('');

      document.getElementById('dayout').innerHTML = `
        <h3>Recommended Day Out Spots Near ${city}</h3>
        ${dayOutSpots || '<p>No specific attractions found. Try searching manually.</p>'}
      `;
    } catch (err) {
      alert('Error detecting nearby locations: ' + err.message);
      console.error(err);
    }

  }, (err) => {
    alert("Unable to retrieve your location.");
    console.error(err);
  });
}

// Suggest best time for outing based on weather conditions
function suggestBestTime(weather) {
  if (!weather) return "N/A";
  const temp = weather.main.temp;
  const condition = weather.weather[0].main.toLowerCase();

  if (condition.includes('rain') || condition.includes('storm')) return "Avoid today – bad weather";
  if (temp >= 20 && temp <= 30) return "Morning or Evening";
  if (temp > 30) return "Evening (too hot)";
  return "Midday or Afternoon";
}

// Autocomplete city suggestions using /suggest endpoint
document.getElementById('city').addEventListener('input', async (e) => {
  const q = e.target.value.trim();
  if (q.length < 2) {
    document.getElementById('suggestions').innerHTML = '';
    return;
  }

  try {
    const res = await fetch(`/suggest?q=${encodeURIComponent(q)}`);
    const suggestions = await res.json();
    document.getElementById('suggestions').innerHTML = suggestions.map(s => `<option value="${s}">`).join('');
  } catch (e) {
    console.error('Error fetching suggestions', e);
  }
});
