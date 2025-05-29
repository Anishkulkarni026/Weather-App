async function detectNearby() {
  if (!navigator.geolocation) return alert('Geolocation not supported.');

  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude } = pos.coords;

    // OpenCage: Reverse geocode to get city
    const opencageKey = 'YOUR_OPENCAGE_API_KEY';
    const geoRes = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${opencageKey}`);
    const geoData = await geoRes.json();

    const city = geoData?.results[0]?.components?.city || geoData?.results[0]?.components?.town || geoData?.results[0]?.components?.village || 'your location';

    getWeather(city); // show weather

    // Nearby weather
    const nearbyRes = await fetch(`/nearby?lat=${latitude}&lon=${longitude}`);
    const data = await nearbyRes.json();

    const spots = data.list.map(loc => `
      <div class="card">
        <p><strong>${loc.name}</strong></p>
        <p>${loc.weather[0].main} | ${loc.main.temp}°C</p>
      </div>
    `).join('');
    document.getElementById('nearby').innerHTML = `<h3>Nearby Weather</h3>` + spots;

    // Suggest places using OpenCage's "tourism" tag + weather
    const dayOutSpots = geoData.results.filter(r =>
      r.components.tourism || r.components.attraction
    ).slice(0, 5).map(place => `
      <div class="card">
        <p><strong>${place.formatted}</strong></p>
        <p>Category: ${place.components.tourism || place.components.attraction}</p>
        <p>🕐 Best Time: ${suggestBestTime(data.list[0])}</p>
      </div>
    `).join('');

    document.getElementById('dayout').innerHTML = `
      <h3>Recommended Day Out Spots Near ${city}</h3>
      ${dayOutSpots || '<p>No specific attractions found. Try searching manually.</p>'}
    `;
  }, err => {
    alert("Unable to retrieve your location.");
    console.error(err);
  });
}

// Suggest best time based on weather conditions
function suggestBestTime(weather) {
  if (!weather) return "N/A";
  const temp = weather.main.temp;
  const condition = weather.weather[0].main.toLowerCase();

  if (condition.includes('rain') || condition.includes('storm')) return "Avoid today – bad weather";
  if (temp >= 20 && temp <= 30) return "Morning or Evening";
  if (temp > 30) return "Evening (too hot)";
  return "Midday or Afternoon";
}
