"use client";

import { useEffect } from "react";
import useRideFlowStore from "@/utils/store";
import { weatherService } from "@/utils/apiServices";
import {
  RefreshCcw,
} from "lucide-react";

export default function WeatherWidget() {
  const { mapData, userSettings, route, loadWeather } = useRideFlowStore();
  const { weather, isLoading } = mapData;

  const handleRefreshWeather = () => {
    if (route.start) {
      loadWeather(route.start.latitude, route.start.longitude);
    }
  };

  useEffect(() => {
    if (route.start && userSettings.showWeather) {
      handleRefreshWeather();
    }
  }, [route.start, userSettings.showWeather]);

  const getWeatherIcon = (code) => {
    const firstDigit = Math.floor(code / 100);

    switch (firstDigit) {
      case 2: // Orage
        return "⛈️";
      case 3: // Bruine
        return "🌧️";
      case 5: // Pluie
        return code === 511 ? "🌨️" : "🌧️";
      case 6: // Neige
        return "❄️";
      case 7: // Atmosphère (brouillard, etc.)
        return "🌫️";
      case 8: // Nuages
        if (code === 800) {
          // Ciel dégagé
          return "☀️";
        } else if (code === 801) {
          // Quelques nuages
          return "🌤️";
        } else if (code === 802) {
          // Nuages épars
          return "⛅";
        } else {
          // Nuageux ou couvert
          return "☁️";
        }
      default:
        return "❓";
    }
  };

  // Fonction pour obtenir des conseils de sécurité en fonction de la météo
  const getSafetyTips = (weatherData) => {
    if (!weatherData || !weatherData.weather || !weatherData.weather[0]) {
      return "Aucune donnée météo disponible";
    }

    const code = weatherData.weather[0].id;
    const temp = weatherData.main?.temp;
    const windSpeed = weatherData.wind?.speed * 3.6; // Conversion m/s en km/h

    const firstDigit = Math.floor(code / 100);

    if (firstDigit === 2) {
      return "⚠️ Danger : Orage. Évitez de rouler, cherchez un abri.";
    }

    if (firstDigit === 5 || firstDigit === 6) {
      return "⚠️ Attention : Visibilité réduite et adhérence diminuée.";
    }

    if (firstDigit === 7) {
      return "⚠️ Attention : Brouillard, ralentissez et augmentez les distances de sécurité.";
    }

    if (temp < 3) {
      return "⚠️ Danger : Risque de verglas, routes potentiellement glissantes.";
    }

    if (windSpeed > 50) {
      return "⚠️ Attention : Vents forts, soyez vigilant aux rafales latérales.";
    }

    if (code === 800 && temp > 30) {
      return "ℹ️ Conseil : Forte chaleur, pensez à bien vous hydrater.";
    }

    return "✅ Conditions correctes pour rouler. Restez vigilant.";
  };

  if (!userSettings.showWeather) {
    return <div className="hidden"></div>; // Div caché plutôt que null
  }

  return (
    <div className="p-4 dark:bg-stone-800">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-bold text-stone-800 dark:text-white">
          Météo
        </h2>
        {weather && (
          <span
            className="text-sm text-[#FF6A00] dark:text-[#FF6A00] cursor-pointer hover:underline"
            onClick={handleRefreshWeather}
          >
            <RefreshCcw size={18} className="text-current" />
          </span>
        )}
      </div>

      {isLoading.weather ? (
        <div className="flex justify-center items-center h-24">
          <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
        </div>
      ) : weather ? (
        <div className="space-y-3">
          {/* Localisation */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>
              {weather.name}, {weather.sys?.country}
            </p>
          </div>

          {/* En-tête avec icône et température */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-4xl mr-3">
                {getWeatherIcon(weather.weather[0].id)}
              </span>
              <div>
                <p className="text-3xl font-bold text-stone-800 dark:text-white">
                  {Math.round(weather.main?.temp)}°C
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {weather.weather[0].description}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Min: {Math.round(weather.main?.temp_min)}°C
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Max: {Math.round(weather.main?.temp_max)}°C
              </p>
            </div>
          </div>

          {/* Détails météo */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-100 dark:bg-stone-700 p-2 rounded">
              <p className="text-gray-500 dark:text-gray-400">Ressenti</p>
              <p className="font-medium text-stone-800 dark:text-white">
                {Math.round(weather.main?.feels_like)}°C
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-stone-700 p-2 rounded">
              <p className="text-gray-500 dark:text-gray-400">Humidité</p>
              <p className="font-medium text-stone-800 dark:text-white">
                {weather.main?.humidity}%
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-stone-700 p-2 rounded">
              <p className="text-gray-500 dark:text-gray-400">Vent</p>
              <p className="font-medium text-stone-800 dark:text-white">
                {Math.round(weather.wind?.speed * 3.6)} km/h
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-stone-700 p-2 rounded">
              <p className="text-gray-500 dark:text-gray-400">Visibilité</p>
              <p className="font-medium text-stone-800 dark:text-white">
                {weather.visibility
                  ? `${Math.round(weather.visibility / 1000)} km`
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Conseils de sécurité */}
          <div className="mt-3 p-3 bg-gray-100 dark:bg-stone-800 rounded-md">
            <h3 className="font-medium text-stone-800 dark:text-white mb-1">
              Conseils motard
            </h3>
            <p className="text-sm text-stone-800 dark:text-gray-300">
              {getSafetyTips(weather)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-24">
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            Aucune donnée météo
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Définissez un itinéraire pour voir la météo
          </p>
        </div>
      )}
    </div>
  );
}
