import axios from "axios";
import { API_KEYS, API_ENDPOINTS, ROUTE_PROFILES } from "./apiConfig";

export const routeService = {
  getRoute: async (startCoords, endCoords, routeType = "FAST") => {
    try {
      console.log("Calcul d'itinéraire avec les coordonnées:", {
        startCoords,
        endCoords,
        routeType,
      });

      // Utiliser notre API proxy pour éviter les problèmes CORS et formater correctement les données
      const response = await axios.post("/api/route", {
        startCoords,
        endCoords,
        routeType,
        includeInstructions: true,
      });

      console.log("Réponse de l'API d'itinéraire:", response.data);
      return response.data;
    } catch (error) {
      console.error("Erreur lors du calcul d'itinéraire:", error);
      throw error;
    }
  },
};

export const trafficService = {
  getIncidents: async (bbox) => {
    try {
      // Utiliser notre API proxy pour éviter les problèmes CORS
      const response = await axios.get(`/api/incidents?bbox=${bbox.join(",")}`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des incidents:", error);
      throw error;
    }
  },

  getRadars: async (bbox) => {
    try {
      // Construction des paramètres de la requête
      const west = bbox[0];
      const south = bbox[1];
      const east = bbox[2];
      const north = bbox[3];

      // Utiliser notre API proxy pour éviter les problèmes CORS
      const response = await axios.get(`/api/radars`, {
        params: {
          west,
          south,
          east,
          north,
        },
      });

      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des radars:", error);
      throw error;
    }
  },
};

export const weatherService = {
  getCurrentWeather: async (lat, lon) => {
    try {
      const response = await axios.get(API_ENDPOINTS.OPENWEATHER_CURRENT, {
        params: {
          lat,
          lon,
          appid: API_KEYS.OPENWEATHER_MAP,
          units: "metric",
          lang: "fr",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération de la météo:", error);
      throw error;
    }
  },
};

export const poiService = {
  getBikerPOIs: async (bbox) => {
    // Requête Overpass pour trouver les stations, garages, etc.
    const query = `
      [out:json];
      (
        // Stations service
        node["amenity"="fuel"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
        // Garages moto
        node["shop"="motorcycle"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
        node["shop"="motorcycle_repair"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
        // Parkings motos
        node["amenity"="parking"]["motorcycle"="yes"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
        // Restaurants/cafés populaires auprès des motards (tag spécifique)
        node["amenity"="restaurant"]["motorcycle"="yes"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
        node["amenity"="cafe"]["motorcycle"="yes"](${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]});
      );
      out body;
    `;

    try {
      const response = await axios.post(API_ENDPOINTS.OVERPASS_API, query, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des POIs:", error);
      throw error;
    }
  },
};
