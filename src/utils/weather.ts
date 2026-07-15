export interface WeatherCondition {
  labelId: 'sunny' | 'rainy' | 'stormy' | 'foggy' | 'cloudy';
  textId: string;
}

export function getWeatherCondition(code: number, isDay: boolean = true): WeatherCondition {
  if (code === 0) {
    return { labelId: 'sunny', textId: 'Sunny / Cerah' };
  } else if (code >= 1 && code <= 3) {
    return { labelId: 'cloudy', textId: 'Partly Cloudy / Berawan' };
  } else if (code === 45 || code === 48) {
    return { labelId: 'foggy', textId: 'Foggy / Berkabut' };
  } else if (code === 51 || code === 53 || code === 55) {
    return { labelId: 'rainy', textId: 'Light Drizzle / Gerimis' };
  } else if (code >= 61 && code <= 65) {
    return { labelId: 'rainy', textId: 'Moderate Rain / Hujan' };
  } else if (code >= 71 && code <= 75) {
    return { labelId: 'cloudy', textId: 'Snowy / Bersalju' };
  } else if (code >= 80 && code <= 82) {
    return { labelId: 'rainy', textId: 'Heavy Rain / Hujan Lebat' };
  } else if (code >= 95 && code <= 99) {
    return { labelId: 'stormy', textId: 'Thunderstorm / Badai Petir' };
  } else if (code >= 176 && code <= 395) {
    return { labelId: 'rainy', textId: 'Local Showers / Hujan Lokal' };
  }
  return { labelId: 'cloudy', textId: 'Cloudy / Berawan' };
}
