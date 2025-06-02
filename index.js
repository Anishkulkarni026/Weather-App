const express = require('express');
const fetch = require('node-fetch');
const app = express();

const WEATHER_API_KEY = 'YOUR_OPENWEATHER_API_KEY';
const FSQ_API_KEY = 'fsq3bNWgDW0xr6hOlVPLHIWkfHSt8wn0NzbsH/kPZpuhINQ=';

// Fetch places to visit using Foursquare Places API
async function getPlacesToVisit(lat, lon) {
  const url = `https://api.foursquare.com/v3/places/search?ll=${lat},${lon}&categories=16000&limit=5&sort=POPULARITY`;
  // category 16000 = Tourist Attraction (Foursquare category id)
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': FSQ_API_KEY,
      },
    });
    const data = await response.json();

    if (!data.results || data.results.length === 0) {
      return ['No places found nearby'];
    }

    // Extract place names
    return data.results.map(place => place.name);
  } catch (err) {
    console.error('Foursquare API error:', err);
    return ['Error fetching places'];
  }
}

// Simple best time to visit (can be enhanced)
function getBestTimeToVisit(city) {
  // This can be made dynamic or use a dataset for each city
  return 'Spring and Autumn months are generally best to visit ' + city;
}

app.get('/weather', async (req, res) => {
  const city = req.query.city;
  if (!city) return res.json({ error: 'No city provided' });

  try {
    // Get current weather to obtain lat, lon
    const currentRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`
    );
    const current = await currentRes.json();

    if (current.cod !== 200) {
      return res.json({ error: 'City not found' });
    }

    const lat = current.coord.lat;
    const lon = current.coord.lon;

    // Get 5-day forecast
    const forecastRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=metric&appid=${WEATHER_API_KEY}`
    );
    const forecast = await forecastRes.json();

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
    console.error(err);
    res.json({ error: 'Something went wrong' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
