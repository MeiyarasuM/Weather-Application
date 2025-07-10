// Weather condition to theme mapping
    const weatherThemes = {
      // Sunny/Clear
      1000: 'theme-sunny', // Sunny
      
      // Cloudy
      1003: 'theme-cloudy', // Partly cloudy
      1006: 'theme-cloudy', // Cloudy
      1009: 'theme-cloudy', // Overcast
      
      // Rainy
      1030: 'theme-rainy', // Mist
      1063: 'theme-rainy', // Patchy rain possible
      1066: 'theme-snowy', // Patchy snow possible
      1069: 'theme-snowy', // Patchy sleet possible
      1072: 'theme-snowy', // Patchy freezing drizzle possible
      1087: 'theme-stormy', // Thundery outbreaks possible
      1114: 'theme-snowy', // Blowing snow
      1117: 'theme-snowy', // Blizzard
      1135: 'theme-cloudy', // Fog
      1147: 'theme-cloudy', // Freezing fog
      1150: 'theme-rainy', // Patchy light drizzle
      1153: 'theme-rainy', // Light drizzle
      1168: 'theme-rainy', // Freezing drizzle
      1171: 'theme-rainy', // Heavy freezing drizzle
      1180: 'theme-rainy', // Patchy light rain
      1183: 'theme-rainy', // Light rain
      1186: 'theme-rainy', // Moderate rain at times
      1189: 'theme-rainy', // Moderate rain
      1192: 'theme-rainy', // Heavy rain at times
      1195: 'theme-rainy', // Heavy rain
      1198: 'theme-rainy', // Light freezing rain
      1201: 'theme-rainy', // Moderate or heavy freezing rain
      1204: 'theme-snowy', // Light sleet
      1207: 'theme-snowy', // Moderate or heavy sleet
      1210: 'theme-snowy', // Patchy light snow
      1213: 'theme-snowy', // Light snow
      1216: 'theme-snowy', // Patchy moderate snow
      1219: 'theme-snowy', // Moderate snow
      1222: 'theme-snowy', // Patchy heavy snow
      1225: 'theme-snowy', // Heavy snow
      1237: 'theme-snowy', // Ice pellets
      1240: 'theme-rainy', // Light rain shower
      1243: 'theme-rainy', // Moderate or heavy rain shower
      1246: 'theme-rainy', // Torrential rain shower
      1249: 'theme-snowy', // Light sleet showers
      1252: 'theme-snowy', // Moderate or heavy sleet showers
      1255: 'theme-snowy', // Light snow showers
      1258: 'theme-snowy', // Moderate or heavy snow showers
      1261: 'theme-snowy', // Light showers of ice pellets
      1264: 'theme-snowy', // Moderate or heavy showers of ice pellets
      1273: 'theme-stormy', // Patchy light rain with thunder
      1276: 'theme-stormy', // Moderate or heavy rain with thunder
      1279: 'theme-stormy', // Patchy light snow with thunder
      1282: 'theme-stormy', // Moderate or heavy snow with thunder
      
      // Night time (if we can detect it)
      night: 'theme-night'
    };

    const apiKey = '79c64f2dd24b462d9b9100603251204'; // weatherapi.com
    const openWeatherMapKey = 'fc14f8194b3cb8d04e8743ad77837f3b'; // openweathermap.org

    let weatherLayer;
    let map;
    let currentLayer = 'temp_new';
    let weatherData = {};
    let currentForecastView = 'hourly';
    let temperatureChart;
    let precipitationChart;

    // Initialize the app
    document.addEventListener('DOMContentLoaded', () => {
      getLocation();
    });

    // Update theme based on weather condition
    function updateTheme(conditionCode, isDay) {
      // Remove all theme classes
      document.body.classList.remove(
        'theme-sunny', 'theme-rainy', 'theme-cloudy', 
        'theme-snowy', 'theme-stormy', 'theme-night'
      );
      
      // Check if it's night time
      if (!isDay) {
        document.body.classList.add('theme-night');
        return;
      }
      
      // Add the appropriate theme class
      const themeClass = weatherThemes[conditionCode] || 'theme-sunny';
      document.body.classList.add(themeClass);
    }

    // Get user's location with better error handling
    async function getLocation() {
      return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                await loadWeatherData(lat, lon);
                resolve({ lat, lon });
              } catch (error) {
                console.error("Error loading weather data:", error);
                fallbackToDefaultLocation();
                reject(error);
              }
            },
            async (error) => {
              console.error("Geolocation error:", error);
              fallbackToDefaultLocation();
              reject(error);
            },
            { 
              timeout: 10000,
              maximumAge: 600000, // 10 minutes
              enableHighAccuracy: true 
            }
          );
        } else {
          console.log("Geolocation not supported");
          fallbackToDefaultLocation();
          reject(new Error("Geolocation not supported"));
        }
      });
    }

    // Fallback to default location (London)
    async function fallbackToDefaultLocation() {
      try {
        await loadWeatherData(51.5074, -0.1278); // London coordinates
        // Show message to user that we're using default location
        showLocationMessage("Using default location (London) since we couldn't access your current location.");
      } catch (error) {
        console.error("Error loading default location data:", error);
        showLocationMessage("Could not load weather data. Please try again later or search for a city.");
      }
    }

    // Show location status message to user
    function showLocationMessage(message) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'location-message';
      messageDiv.textContent = message;
      document.body.prepend(messageDiv);
      
      // Remove message after 5 seconds
      setTimeout(() => {
        messageDiv.remove();
      }, 5000);
    }

    // Load weather data and update UI
    async function loadWeatherData(lat, lon) {
      try {
        document.getElementById('loader').classList.add('show');
        const data = await fetchWeatherData(lat, lon);
        weatherData = data;

        if (weatherData && weatherData.location && weatherData.current) {
          // Update theme based on current weather
          const isDay = weatherData.current.is_day === 1;
          updateTheme(weatherData.current.condition.code, isDay);
          
          updateUI();
          initMap(lat, lon);
        } else {
          throw new Error('Invalid data received from the API');
        }
      } catch (error) {
        console.error("Error loading weather data:", error);
        alert("Could not load weather data. Please try again later.");
      } finally {
        document.getElementById('loader').classList.remove('show');
      }
    }

    // Fetch weather data from API
    async function fetchWeatherData(lat, lon) {
      const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${lat},${lon}&days=7`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(`Error fetching weather data: ${errorData.error.message}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Error in fetchWeatherData:", error);
        throw error;
      }
    }

    // Update all UI elements
    function updateUI() {
      updateHeroSection();
      if (currentForecastView === 'hourly') {
        updateHourlyForecast();
      } else {
        updateWeeklyForecast();
      }
      updateCharts();
      updateSunriseSunset();
    }

    // Update hero section with current weather
    function updateHeroSection() {
      const current = weatherData.current;
      const location = weatherData.location;
      
      // Format the local time
      const localTime = new Date(location.localtime).toLocaleString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const heroHTML = `
        <div class="hero-content">
          <div class="hero-main">
            <div class="hero-location">
              <h2>${location.name}</h2>
              <p>${location.region ? `${location.region}, ` : ''}${location.country}</p>
              <p class="hero-time">${localTime}</p>
            </div>
            
            <div class="hero-weather">
              <img src="https:${current.condition.icon}" alt="${current.condition.text}">
              <p class="weather-condition">${current.condition.text}</p>
            </div>
            
            <div class="hero-temp">
              <span class="temp-value">${Math.round(current.temp_c)}°</span>
              <span class="feels-like">Feels like ${Math.round(current.feelslike_c)}°</span>
            </div>
          </div>
          
          <div class="hero-stats">
            <div class="stat-item">
              <span class="material-symbols-outlined">air</span>
              <div class="stat-details">
                <p class="stat-label">Wind</p>
                <p class="stat-value">${current.wind_kph} km/h</p>
              </div>
            </div>
            
            <div class="stat-item">
              <span class="material-symbols-outlined">water_drop</span>
              <div class="stat-details">
                <p class="stat-label">Humidity</p>
                <p class="stat-value">${current.humidity}%</p>
              </div>
            </div>
            
            <div class="stat-item">
              <span class="material-symbols-outlined">light_mode</span>
              <div class="stat-details">
                <p class="stat-label">UV Index</p>
                <p class="stat-value">${current.uv}</p>
              </div>
            </div>
            
            <div class="stat-item">
              <span class="material-symbols-outlined">thermostat</span>
              <div class="stat-details">
                <p class="stat-label">Pressure</p>
                <p class="stat-value">${current.pressure_mb} mb</p>
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById('heroSection').innerHTML = heroHTML;
    }

    // Show hourly forecast with fade-in effect
    function showHourlyForecast() {
      currentForecastView = 'hourly';
      const hourlySection = document.getElementById('hourlySection');
      const weeklySection = document.getElementById('weeklySection');

      weeklySection.style.opacity = 0;
      setTimeout(() => {
        weeklySection.style.display = 'none';
        hourlySection.style.display = 'block';
        hourlySection.style.opacity = 1;
      }, 300);

      document.getElementById('hourlyBtn').classList.add('active');
      document.getElementById('weeklyBtn').classList.remove('active');
      updateHourlyForecast();
    }

    // Show weekly forecast with fade-in effect
    function showWeeklyForecast() {
      currentForecastView = 'weekly';
      const hourlySection = document.getElementById('hourlySection');
      const weeklySection = document.getElementById('weeklySection');

      hourlySection.style.opacity = 0;
      setTimeout(() => {
        hourlySection.style.display = 'none';
        weeklySection.style.display = 'block';
        weeklySection.style.opacity = 1;
      }, 300);

      document.getElementById('hourlyBtn').classList.remove('active');
      document.getElementById('weeklyBtn').classList.add('active');
      updateWeeklyForecast();
    }

    // Update hourly forecast with all 24 hours
    function updateHourlyForecast() {
      const hourlyContainer = document.getElementById('hourly');
      hourlyContainer.innerHTML = '';

      const currentHour = new Date().getHours();
      const hours = weatherData.forecast.forecastday[0].hour;

      // Rearrange hours to start from the current hour
      const sortedHours = [...hours.slice(currentHour), ...hours.slice(0, currentHour)];

      // Create all 24 hours in order
      sortedHours.forEach((hour) => {
        const hourTime = new Date(hour.time);
        const isCurrent = hourTime.getHours() === currentHour;

        const hourDiv = document.createElement('div');
        hourDiv.className = `hour${isCurrent ? ' active' : ''}`;
        hourDiv.innerHTML = `
          <h4>${hourTime.getHours()}:00</h4>
          <img src="https:${hour.condition.icon}" alt="${hour.condition.text}">
          <p>${Math.round(hour.temp_c)}°C</p>
          <p class="text-sm">${hour.condition.text}</p>
          <div class="temp-trend">
            <span>${hour.wind_kph} km/h</span>
            <span>${hour.humidity}%</span>
          </div>
        `;
        hourlyContainer.appendChild(hourDiv);
      });

      // Scroll to the current hour after a short delay
      setTimeout(() => {
        const activeHour = document.querySelector('.hour.active');
        if (activeHour) {
          activeHour.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      }, 100);
    }

    // Update weekly forecast
    function updateWeeklyForecast() {
      const dailyContainer = document.getElementById('daily');
      dailyContainer.innerHTML = '';

      const today = new Date().toDateString();
      const forecastDays = weatherData.forecast.forecastday;

      // Rearrange days to start with today
      const todayIndex = forecastDays.findIndex(day => new Date(day.date).toDateString() === today);
      const sortedDays = [...forecastDays.slice(todayIndex), ...forecastDays.slice(0, todayIndex)];

      // Create days in order
      sortedDays.forEach(day => {
        const date = new Date(day.date);
        const isToday = date.toDateString() === today;
        const dayDiv = document.createElement('div');
        dayDiv.className = `day${isToday ? ' active' : ''}`;
        dayDiv.innerHTML = `
          <h4>${date.toLocaleDateString([], { weekday: 'short' })}</h4>
          <p class="text-sm">${date.toLocaleDateString([], { day: 'numeric', month: 'short' })}</p>
          <img src="https:${day.day.condition.icon}" alt="${day.day.condition.text}">
          <p class="font-bold">${Math.round(day.day.avgtemp_c)}°C</p>
          <div class="temp-trend">
            <span class="text-red-500">
              <div>${Math.round(day.day.maxtemp_c)}°</div>
            </span>
            <span class="text-blue-500">
              <div>${Math.round(day.day.mintemp_c)}°</div>
            </span>
          </div>
        `;
        dailyContainer.appendChild(dayDiv);
      });

      // Scroll to today's forecast after a short delay
      setTimeout(() => {
        const activeDay = document.querySelector('.day.active');
        if (activeDay) {
          activeDay.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center',
          });
        }
      }, 100);
    }

    // Update weather charts
    function updateCharts() {
      const forecastDays = weatherData.forecast.forecastday;

      // Prepare chart data
      const labels = forecastDays.map(day => new Date(day.date).toLocaleDateString([], { weekday: 'short' }));
      const maxTemps = forecastDays.map(day => Math.round(day.day.maxtemp_c));
      const minTemps = forecastDays.map(day => Math.round(day.day.mintemp_c));
      const rainfall = forecastDays.map(day => Math.round(day.day.totalprecip_mm * 10) / 10);

      // Destroy existing temperature chart if it exists
      if (temperatureChart) {
        temperatureChart.destroy();
      }

      // Render Temperature Chart
      const temperatureCtx = document.getElementById('temperatureChartContainer').getContext('2d');
      temperatureChart = new Chart(temperatureCtx, {
        type: 'line',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Max Temperature (°C)',
              data: maxTemps,
              borderColor: '#ff7043',
              backgroundColor: 'rgba(255, 112, 67, 0.2)',
              fill: true,
            },
            {
              label: 'Min Temperature (°C)',
              data: minTemps,
              borderColor: '#42a5f5',
              backgroundColor: 'rgba(66, 165, 245, 0.2)',
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
          },
        },
      });

      // Destroy existing precipitation chart if it exists
      if (precipitationChart) {
        precipitationChart.destroy();
      }

      // Render Precipitation Chart
      const precipitationCtx = document.getElementById('precipitationChartContainer').getContext('2d');
      precipitationChart = new Chart(precipitationCtx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [
            {
              label: 'Rainfall (mm)',
              data: rainfall,
              backgroundColor: '#33C3F0',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            },
          },
        },
      });
    }

    // Show chart tab
    function showChartTab(tabName) {
      // Update tab buttons
      document.querySelectorAll('.chart-tab').forEach(tab => {
        tab.classList.remove('active');
      });
      document.querySelector(`.chart-tab[onclick="showChartTab('${tabName}')"]`).classList.add('active');
      
      // Update tab content
      document.querySelectorAll('.chart-tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${tabName}Chart`).classList.add('active');
    }

    // Update Sunrise and Sunset Section
    function updateSunriseSunset() {
      const astro = weatherData.forecast.forecastday[0].astro;
      
      // Update times
      document.getElementById('sunriseTime').textContent = astro.sunrise;
      document.getElementById('sunsetTime').textContent = astro.sunset;
      
      // Calculate sun position
      const now = new Date(weatherData.location.localtime);
      const sunrise = new Date(`${weatherData.forecast.forecastday[0].date} ${astro.sunrise}`);
      const sunset = new Date(`${weatherData.forecast.forecastday[0].date} ${astro.sunset}`);
      
      const totalDaylight = sunset - sunrise;
      const currentPosition = now - sunrise;
      const percent = Math.min(Math.max((currentPosition / totalDaylight) * 100, 0), 100);
      
      // Update sun position
      document.getElementById('sunPosition').style.left = `${percent}%`;
      
      // Update current time display
      document.getElementById('currentSolarTime').textContent = 
        `Current: ${now.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`;
      
      // Update daylight progress bar
      document.getElementById('daylightBar').style.width = `${100 - percent}%`;
      
      // Update moon phase
      updateMoonPhase(astro);
    }

    function updateMoonPhase(astro) {
      const moonPhase = astro.moon_phase;
      const moonIllumination = astro.moon_illumination;
      
      document.getElementById('moonPhaseText').textContent = moonPhase;
      document.getElementById('moonIllumination').textContent = `Illumination: ${moonIllumination}%`;
      
      // Visual moon phase representation
      const moonVisual = document.getElementById('moonPhaseVisual');
      
      // Clear previous styles
      moonVisual.style.clipPath = '';
      moonVisual.style.boxShadow = '';
      moonVisual.style.background = 'linear-gradient(145deg, #e6e6e6, #ffffff)';
      
      // Set styles based on moon phase
      if (moonPhase.includes("New")) {
        // New Moon - completely dark
        moonVisual.style.boxShadow = 'inset 20px 0 15px -10px rgba(0,0,0,0.8)';
      } 
      else if (moonPhase.includes("Waxing Crescent")) {
        // Waxing Crescent - small sliver on right
        moonVisual.style.clipPath = 'polygon(50% 0%, 50% 100%, 100% 100%, 100% 0%)';
        moonVisual.style.boxShadow = 'inset 10px 0 10px -5px rgba(0,0,0,0.5)';
      }
      else if (moonPhase.includes("First Quarter")) {
        // First Quarter - right half illuminated
        moonVisual.style.clipPath = 'polygon(50% 0%, 50% 100%, 100% 100%, 100% 0%)';
      }
      else if (moonPhase.includes("Waxing Gibbous")) {
        // Waxing Gibbous - mostly right side illuminated
        moonVisual.style.clipPath = 'polygon(25% 0%, 25% 100%, 100% 100%, 100% 0%)';
      }
      else if (moonPhase.includes("Full")) {
        // Full Moon - completely illuminated
        // No clip path needed
      }
      else if (moonPhase.includes("Waning Gibbous")) {
        // Waning Gibbous - mostly left side illuminated
        moonVisual.style.clipPath = 'polygon(0% 0%, 0% 100%, 75% 100%, 75% 0%)';
      }
      else if (moonPhase.includes("Last Quarter")) {
        // Last Quarter - left half illuminated
        moonVisual.style.clipPath = 'polygon(0% 0%, 0% 100%, 50% 100%, 50% 0%)';
      }
      else if (moonPhase.includes("Waning Crescent")) {
        // Waning Crescent - small sliver on left
        moonVisual.style.clipPath = 'polygon(0% 0%, 0% 100%, 50% 100%, 50% 0%)';
        moonVisual.style.boxShadow = 'inset -10px 0 10px -5px rgba(0,0,0,0.5)';
      }
      
      // Add texture to the moon
      moonVisual.style.background = `
        linear-gradient(145deg, #e6e6e6, #ffffff),
        radial-gradient(circle at 30% 30%, rgba(0,0,0,0.1) 0%, transparent 20%),
        radial-gradient(circle at 70% 70%, rgba(0,0,0,0.1) 0%, transparent 20%)
      `;
    }

    // Initialize the map
    function initMap(lat, lon) {
      if (map) {
        map.remove(); // Remove the existing map instance
      }

      // Initialize the map
      map = L.map('windSpeedMap').setView([lat, lon], 5);

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      // Add weather layer
      weatherLayer = L.tileLayer(`https://tile.openweathermap.org/map/${currentLayer}/{z}/{x}/{y}.png?appid=${openWeatherMapKey}`, {
        attribution: 'Weather data © OpenWeatherMap',
        opacity: 0.85,
      }).addTo(map);
    }

    // Change the map layer
    function changeMapLayer(layer) {
      currentLayer = layer;
      weatherLayer.setUrl(`https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${openWeatherMapKey}`);
      // Update active button
      document.querySelectorAll('.map-controls button').forEach(btn => {
        btn.classList.remove('active');
      });
      document.querySelector(`button[onclick="changeMapLayer('${layer}')"]`).classList.add('active');
    }

    // Search for a city
    async function searchCity() {
      const city = document.getElementById('cityInput').value.trim();
      if (!city) {
        alert('Please enter a city name');
        return;
      }

      try {
        document.getElementById('loader').classList.add('show');
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${encodeURIComponent(city)}&days=7`;
        const response = await fetch(url);

        if (!response.ok) {
          const errorData = await response.json();
          console.error("API Error:", errorData);
          throw new Error(`City not found: ${errorData.error.message}`);
        }

        weatherData = await response.json();
        
        if (weatherData && weatherData.location && weatherData.current) {
          // Update theme based on current weather
          const isDay = weatherData.current.is_day === 1;
          updateTheme(weatherData.current.condition.code, isDay);
          
          updateUI();
          initMap(weatherData.location.lat, weatherData.location.lon);
        } else {
          throw new Error('Invalid data received from the API');
        }
      } catch (error) {
        console.error("Error searching city:", error);
        alert(`Could not find weather for that location. Error: ${error.message}`);
      } finally {
        document.getElementById('loader').classList.remove('show');
      }
    }

    // Contact form submission
    document.getElementById('contactForm').addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form values
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const subject = document.getElementById('subject').value;
      const message = document.getElementById('message').value;
      
      // Here you would typically send the data to a server
      // For this example, we'll just show a success message
      alert(`Thank you, ${name}! Your message has been sent. We'll get back to you soon.`);
      
      // Reset the form
      this.reset();
    });

    // Enable smooth scrolling for navbar links
    document.querySelectorAll('nav a').forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetSection = document.getElementById(targetId);

        if (targetSection) {
          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });

          // Highlight the active link
          document.querySelectorAll('nav a').forEach(navLink => {
            navLink.classList.remove('active');
          });
          this.classList.add('active');
        }
      });
    });

    // Highlight the active link on scroll
    const sections = document.querySelectorAll('#heroSection, #forecastSection, #charts, #sunriseSunset, #map, #contact');
    const navLinks = document.querySelectorAll('nav a');

    window.addEventListener('scroll', () => {
      let currentSection = '';

      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100; // Adjust for navbar height
        if (window.scrollY >= sectionTop) {
          currentSection = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === currentSection) {
          link.classList.add('active');
        }
      });
    });
    // Add to your JavaScript (after DOMContentLoaded)
function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Check for saved theme preference or use system preference
  const currentTheme = localStorage.getItem('theme') || 
                      (prefersDarkScheme.matches ? 'dark' : 'light');
  
  // Apply the initial theme
  if (currentTheme === 'dark') {
    document.body.classList.add('dark-mode');
    themeToggle.innerHTML = '<span class="material-symbols-outlined">light_mode</span>';
  } else {
    document.body.classList.remove('dark-mode');
    themeToggle.innerHTML = '<span class="material-symbols-outlined">dark_mode</span>';
  }
  
  // Toggle theme when button is clicked
  themeToggle.addEventListener('click', () => {
    if (document.body.classList.contains('dark-mode')) {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
      themeToggle.innerHTML = '<span class="material-symbols-outlined">dark_mode</span>';
    } else {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
      themeToggle.innerHTML = '<span class="material-symbols-outlined">light_mode</span>';
    }
  });
  
  // Listen for system theme changes
  prefersDarkScheme.addEventListener('change', (e) => {
    if (localStorage.getItem('theme') === null) { // Only if no manual preference set
      if (e.matches) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<span class="material-symbols-outlined">light_mode</span>';
      } else {
        document.body.classList.remove('dark-mode');
        themeToggle.innerHTML = '<span class="material-symbols-outlined">dark_mode</span>';
      }
    }
  });
}

// Call this in your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
  getLocation();
  setupThemeToggle(); // Add this line
});
// Modify your updateTheme function to preserve dark mode
function updateTheme(conditionCode, isDay) {
  // Save current dark mode state
  const isDarkMode = document.body.classList.contains('dark-mode');
  
  // Remove all theme classes
  document.body.classList.remove(
    'theme-sunny', 'theme-rainy', 'theme-cloudy', 
    'theme-snowy', 'theme-stormy', 'theme-night'
  );
  
  // Check if it's night time
  if (!isDay) {
    document.body.classList.add('theme-night');
    // If it's night, ensure dark mode is on unless manually set to light
    if (!isDarkMode && localStorage.getItem('theme') !== 'light') {
      document.body.classList.add('dark-mode');
      document.getElementById('themeToggle').innerHTML = '<span class="material-symbols-outlined">light_mode</span>';
    }
    return;
  }
  
  // Add the appropriate theme class
  const themeClass = weatherThemes[conditionCode] || 'theme-sunny';
  document.body.classList.add(themeClass);
  
  // Restore dark mode if it was enabled
  if (isDarkMode) {
    document.body.classList.add('dark-mode');
  }
}
// Add this to your existing JavaScript
function setupMobileMenu() {
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    // Toggle between menu and close icons
    const icon = hamburger.querySelector('.material-symbols-outlined');
    if (navLinks.classList.contains('active')) {
      icon.textContent = 'close';
    } else {
      icon.textContent = 'menu';
    }
  });
  
  // Close menu when a link is clicked (for mobile)
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 768) {
        navLinks.classList.remove('active');
        hamburger.querySelector('.material-symbols-outlined').textContent = 'menu';
      }
    });
  });
}

// Call this in your DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
  getLocation();
  setupThemeToggle();
  setupMobileMenu(); // Add this line
});
