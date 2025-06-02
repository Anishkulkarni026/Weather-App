const express = require('express');
const axios = require('axios');
const app = express();

const WEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY';
const FSQ_API_KEY = 'fsq3bNWgDW0xr6hOlVPLHIWkfHSt8wn0NzbsH/kPZpuhINQ=';

// Fetch places to visit using Foursquare Places API
async function getPlacesToVisit(lat, lon) {
  const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&categories=16000&limit=5&sort=POPULARITY`;
  // category 16000 = Tourist Attraction (Foursquare category id)

  try {
    const response = await axios.get(url, {
      headers: {
        Accept: 'application/json',
        Authorization: FSQ_API_KEY,
      },
    });

    const data = response.data;

    if (!data.results || data.results.length === 0) {
      return ['No places found nearby'];
    }

    // Extract place names
    return data.results.map(place => place.name);
  } catch (err) {
    console.error('Foursquare API error:', err.message);
    return ['Error fetching places'];
  }
}

// Simple best time to visit (can be enhanced)
function getBestTimeToVisit(city) {
  // This can be made dynamic or use a dataset for each city
  return `Spring and Autumn months are generally best to visit ${city}`;
}

app.get('/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.json({ error: 'No city provided' });

  try {
    // Get current weather to obtain lat, lon
    const currentRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`
    );
    const current = currentRes.data;

    if (current.cod && current.cod !== 200) {
      return res.json({ error: 'City not found' });
    }

    const lat = current.coord.lat;
    const lon = current.coord.lon;

    // Get 5-day forecast
    const forecastRes = await axios.get(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`
    );
    const forecast = forecastRes.data;

    // Fetch places to visit dynamically
    const placesToVisit = await getPlacesToVisit(lat, lon);

    // Best time to visit
    const bestTime = getBestTimeToVisit(city);

    res.json({
      current,
      forecast,
      placesToVisit,
      bestTime,
    });
  } catch (err) {
    console.error(err.message);
    res.json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
