export const API_KEYS = {
  OPENROUTE_SERVICE: process.env.NEXT_PUBLIC_OPENROUTE_SERVICE_KEY,
  HERE_API: process.env.NEXT_PUBLIC_HERE_API_KEY,
  OPENWEATHER_MAP: process.env.NEXT_PUBLIC_OPENWEATHER_MAP_KEY,
  MAPTILER: process.env.NEXT_PUBLIC_MAPTILER_KEY,
  TOMTOM: process.env.NEXT_PUBLIC_TOMTOM_API_KEY,
};

export const API_ENDPOINTS = {
  ORS_DIRECTIONS: "https://api.openrouteservice.org/v2/directions",
  HERE_TRAFFIC_INCIDENTS:
    "https://traffic.ls.hereapi.com/traffic/6.2/incidents",
  HERE_TRAFFIC_FLOW: "https://traffic.ls.hereapi.com/traffic/6.3/flow",

  OPENWEATHER_CURRENT: "https://api.openweathermap.org/data/2.5/weather",
  OPENWEATHER_FORECAST: "https://api.openweathermap.org/data/2.5/forecast",

  TOMTOM_TRAFFIC: "https://api.tomtom.com/traffic/services/5/incidentDetails",
  
  OVERPASS_API: "https://overpass-api.de/api/interpreter",
  TRANSPORT_API: "https://transport.data.gouv.fr/api/disruptions",
};

export const ROUTE_PROFILES = {
  FAST: {
    profile: "driving-car",
    preference: "fastest"
  },
  CURVY: {
    profile: "driving-car", 
    preference: "shortest",
    options: {
    }
  }
};

export const MAP_CONFIG = {
  defaultCenter: [48.8566, 2.3522], // Paris
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
