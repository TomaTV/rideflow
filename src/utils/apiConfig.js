export const API_KEYS = {
  // OpenRouteService pour le calcul d'itinéraires
  // Inscrivez-vous sur https://openrouteservice.org/dev/#/signup
  OPENROUTE_SERVICE: process.env.NEXT_PUBLIC_OPENROUTE_SERVICE_KEY || "",

  // HERE Maps pour les informations de trafic et incidents
  // Inscrivez-vous sur https://developer.here.com/sign-up (offre gratuite disponible)
  HERE_API: process.env.NEXT_PUBLIC_HERE_API_KEY || "",

  // OpenWeatherMap pour la météo
  // Inscrivez-vous sur https://openweathermap.org/api (offre gratuite disponible)
  OPENWEATHER_MAP: process.env.NEXT_PUBLIC_OPENWEATHER_MAP_KEY || "",

  // MapTiler pour les cartes
  // Inscrivez-vous sur https://www.maptiler.com/cloud/ (offre gratuite disponible)
  MAPTILER: process.env.NEXT_PUBLIC_MAPTILER_KEY || "",
};

export const API_ENDPOINTS = {
  // OpenRouteService
  ORS_DIRECTIONS: "https://api.openrouteservice.org/v2/directions",

  // HERE Maps (alternatives gratuites à TomTom)
  HERE_TRAFFIC_INCIDENTS:
    "https://traffic.ls.hereapi.com/traffic/6.2/incidents",
  HERE_TRAFFIC_FLOW: "https://traffic.ls.hereapi.com/traffic/6.3/flow",

  // OpenWeatherMap
  OPENWEATHER_CURRENT: "https://api.openweathermap.org/data/2.5/weather",
  OPENWEATHER_FORECAST: "https://api.openweathermap.org/data/2.5/forecast",

  // Overpass API (OSM) - API gratuite pour les points d'intérêt
  OVERPASS_API: "https://overpass-api.de/api/interpreter",

  // POI.js - API open source pour les radars (alternative à TomTom pour les radars)
  POIJS_RADARS: "https://data.poi.js.org/radars/",
};

// Options pour le calcul d'itinéraires
export const ROUTE_PROFILES = {
  FAST: {
    profile: "driving-car",
    preference: "fastest"
  },
  CURVY: {
    profile: "driving-car", 
    preference: "shortest", // Utiliser shortest pour les routes sinueuses (moins direct = plus sinueux)
    options: {
      // Aucune option complexe pour éviter les erreurs
    }
  }
};

// Paramètres de la carte (pour MapTiler Basic)
export const MAP_CONFIG = {
  defaultCenter: [48.8566, 2.3522], // Paris, France [lat, lng] - ORDRE INVERSÉ pour Leaflet
  defaultZoom: 13,
  tileLayer: {
    url: `https://api.maptiler.com/maps/basic/{z}/{x}/{y}.png?key=${API_KEYS.MAPTILER}`,
    attribution:
      '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  darkModeTileLayer: {
    url: `https://api.maptiler.com/maps/darkmatter/{z}/{x}/{y}.png?key=${API_KEYS.MAPTILER}`,
    attribution:
      '&copy; <a href="https://www.maptiler.com/copyright/">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  // Style pour les itinéraires
  routeStyle: {
    fast: {
      color: "#3388ff",
      weight: 6,
      opacity: 0.8,
    },
    curvy: {
      color: "#ff8833",
      weight: 6,
      opacity: 0.8,
    },
  },
};
