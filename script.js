// Troque pela sua chave da OpenWeather
const OPEN_WEATHER_API_KEY = '8391b6969d4701c8f75a54b4daa75214';

// Instância atual do Skycons (para recriar com cor nova)
let currentSkycons = null;

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('city');
  const btn = document.getElementById('search-btn');

  btn.addEventListener('click', getWeather);
  input.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') getWeather();
  });
});

async function getWeather() {
  const city = document.getElementById('city').value.trim();
  if (!city) {
    alert("Por favor, digite o nome de uma cidade.");
    return;
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${OPEN_WEATHER_API_KEY}&units=metric&lang=pt_br`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Cidade não encontrada');

    const data = await response.json();
    renderWeather(data);
  } catch (err) {
    console.error(err);
    alert("Cidade não encontrada, tente novamente.");
  }
}

function renderWeather(data) {
  const infoBox = document.getElementById('weather-info');
  infoBox.classList.remove('hidden');

  const cityName = `${data.name}${data.sys?.country ? `, ${data.sys.country}` : ''}`;
  document.getElementById('city-name').innerText = `🌆 Clima em ${cityName}`;
  document.getElementById('description').innerText = data.weather[0].description;

  document.getElementById('temperature').innerText = `🌡️ ${data.main.temp.toFixed(1)}°C`;
  document.getElementById('humidity').innerText = `💧 Umidade: ${data.main.humidity}%`;

  // Converte m/s para km/h
  const windKmh = (data.wind.speed * 3.6).toFixed(0);
  document.getElementById('wind-speed').innerText = `💨 Vento: ${windKmh} km/h`;

  // Decide se é noite (com base na hora do local)
  const nowUtc = data.dt;             // segundos UTC
  const sunriseUtc = data.sys.sunrise;
  const sunsetUtc = data.sys.sunset;
  const isNight = nowUtc < sunriseUtc || nowUtc > sunsetUtc;

  // Ícone animado + fundo dinâmico
  const condition = (data.weather[0].main || '').toLowerCase();
  const iconCode = data.weather[0].icon; // fallback PNG
  const { skyconName, color, bg } = mapToSkycons(condition, isNight);

  // Atualiza fundo da página
  document.body.style.background = bg;

  // Tenta usar Skycons; se não existir, usa PNG da OpenWeather
  const canvas = document.getElementById('weather-canvas');
  const img = document.getElementById('owm-icon');

  if (window.Skycons && typeof Skycons === 'function') {
    // Esconde PNG e mostra canvas
    img.classList.add('hidden');
    canvas.classList.remove('hidden');

    // Destroi instância anterior para mudar cor
    if (currentSkycons) {
      currentSkycons.remove(canvas);
      currentSkycons.pause();
      currentSkycons = null;
    }

    currentSkycons = new Skycons({ color });
    // A API do Skycons aceita strings como "clear-day", "cloudy", "rain", etc.
    currentSkycons.add(canvas, skyconName);
    currentSkycons.play();
  } else {
    // Fallback para PNG oficial da OpenWeather
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
    img.src = iconUrl;
    img.classList.remove('hidden');
    canvas.classList.add('hidden');
  }
}

/**
 * Mapeia condição da OpenWeather para:
 * - nome do ícone Skycons (string)
 * - cor do ícone
 * - gradiente de fundo
 * Considera dia/noite para clear/partly-cloudy.
 */
function mapToSkycons(condition, isNight) {
  // Valores padrão (céu parcialmente nublado de dia)
  let skyconName = isNight ? "partly-cloudy-night" : "partly-cloudy-day";
  let color = "#ffa500";
  let bg = "linear-gradient(135deg,#fdfbfb,#ebedee)";

  switch (condition) {
    case "clear":
      skyconName = isNight ? "clear-night" : "clear-day";
      color = "#f9d71c";
      bg = isNight
        ? "linear-gradient(135deg,#0f2027,#203a43,#2c5364)"
        : "linear-gradient(135deg,#f6d365,#fda085)";
      break;

    case "clouds":
      skyconName = "cloudy";
      color = "#7d7d7d";
      bg = "linear-gradient(135deg,#bdc3c7,#2c3e50)";
      break;

    case "rain":
      skyconName = "rain";
      color = "#1e90ff";
      bg = "linear-gradient(135deg,#89f7fe,#66a6ff)";
      break;

    case "drizzle":
      skyconName = "sleet"; // Skycons não tem 'drizzle'; sleet fica visualmente similar
      color = "#00bfff";
      bg = "linear-gradient(135deg,#a1c4fd,#c2e9fb)";
      break;

    case "thunderstorm":
      // Skycons não possui trovão; usamos 'rain' com cor diferente
      skyconName = "rain";
      color = "#ff8c00";
      bg = "linear-gradient(135deg,#373b44,#4286f4)";
      break;

    case "snow":
      skyconName = "snow";
      color = "#00ced1";
      bg = "linear-gradient(135deg,#e0eafc,#cfdef3)";
      break;

    case "mist":
    case "fog":
    case "haze":
    case "smoke":
    case "dust":
    case "sand":
      skyconName = "fog";
      color = "#999999";
      bg = "linear-gradient(135deg,#d7d2cc,#304352)";
      break;

    default:
      skyconName = isNight ? "partly-cloudy-night" : "partly-cloudy-day";
      color = "#ffa500";
      bg = "linear-gradient(135deg,#fdfbfb,#ebedee)";
  }

  return { skyconName, color, bg };
}
