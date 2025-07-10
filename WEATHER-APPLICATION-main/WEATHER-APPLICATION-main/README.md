# Modern Weather App

A responsive, feature-rich weather application that provides current conditions, forecasts, charts, and interactive maps.

## Features

- **Current Weather**: Displays temperature, conditions, humidity, wind speed, and more
- **Forecasts**: Toggle between hourly (24-hour) and weekly (7-day) forecasts
- **Interactive Charts**: Visualize temperature trends and precipitation
- **Sun & Moon Data**: Track daylight progress and moon phases
- **Weather Maps**: View different weather layers (temperature, clouds, precipitation, etc.)
- **Contact Form**: User feedback submission
- **Dark Mode**: Toggle between light and dark themes
- **Responsive Design**: Works on all device sizes

## Technologies Used

- HTML5, CSS3, JavaScript
- Chart.js for data visualization
- Leaflet.js for interactive maps
- WeatherAPI.com for weather data
- Google Material Icons

## Installation

No installation required - just open `index.html` in a modern web browser.

## Usage

1. The app will automatically detect your location and display weather data
2. Alternatively, search for any city using the search bar
3. Navigate between different sections using the menu
4. Toggle between light/dark mode using the theme button

## API Keys

The app uses two weather APIs:
1. WeatherAPI.com (primary)
2. OpenWeatherMap (for map layers)

**Note**: The included API keys are for demonstration purposes only. For production use, you should:
- Replace with your own API keys
- Store them securely (not in client-side code)
- Implement rate limiting

## Customization

You can customize:
- Color themes in `styles.css` (modify the `:root` variables)
- Weather condition mappings in `script.js`
- Layout and styling in the CSS file

## Browser Support

The app works best in modern browsers (Chrome, Firefox, Edge, Safari) that support:
- Flexbox
- CSS Grid
- ES6 JavaScript
- Geolocation API

## License

This project is open-source and available for personal and educational use. Commercial use may require permission.
