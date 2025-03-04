/**
 * Store global pour RideFlow utilisant Zustand
 * 
 * Ce fichier centralise la gestion d'état de l'application.
 */

import { create } from 'zustand';
import { routeService, trafficService, weatherService, poiService } from './apiServices';

const useRideFlowStore = create((set, get) => ({
  // État de la carte
  map: {
    center: [48.8566, 2.3522], // Paris par défaut (format Leaflet [lat, lng])
    zoom: 13,
    bounds: null,
    isLoaded: false
  },
  
  // État de l'itinéraire
  route: {
    start: null,
    end: null,
    waypoints: [],
    routeType: 'FAST', // 'FAST' ou 'CURVY'
    routeData: null,
    isLoading: false,
    error: null
  },
  
  // État des données sur la carte
  mapData: {
    incidents: [],
    radars: [],
    weather: null,
    pois: [],
    isLoading: {
      incidents: false,
      radars: false,
      weather: false,
      pois: false
    }
  },
  
  // Paramètres utilisateur
  userSettings: {
    showRadars: false,
    showIncidents: false,
    showWeather: true,
    showPOIs: true,
    darkMode: false
  },
  
  // Actions pour la carte
  setMapCenter: (center) => set((state) => ({
    map: { ...state.map, center }
  })),
  
  setMapZoom: (zoom) => set((state) => ({
    map: { ...state.map, zoom }
  })),
  
  setMapBounds: (bounds) => set((state) => ({
    map: { ...state.map, bounds }
  })),
  
  setMapLoaded: (isLoaded) => set((state) => ({
    map: { ...state.map, isLoaded }
  })),
  
  // Actions pour l'itinéraire
  setRouteStart: (start) => set((state) => ({
    route: { ...state.route, start }
  })),
  
  setRouteEnd: (end) => set((state) => ({
    route: { ...state.route, end }
  })),
  
  setRouteType: (routeType) => set((state) => ({
    route: { ...state.route, routeType }
  })),
  
  addWaypoint: (waypoint) => set((state) => ({
    route: { 
      ...state.route, 
      waypoints: [...state.route.waypoints, waypoint]
    }
  })),
  
  removeWaypoint: (index) => set((state) => ({
    route: {
      ...state.route,
      waypoints: state.route.waypoints.filter((_, i) => i !== index)
    }
  })),
  
  // Calcul d'itinéraire
  calculateRoute: async () => {
    const { start, end, routeType } = get().route;
    
    if (!start || !end) {
      return set((state) => ({
        route: {
          ...state.route,
          error: "Points de départ et d'arrivée requis"
        }
      }));
    }
    
    set((state) => ({
      route: {
        ...state.route,
        isLoading: true,
        error: null
      }
    }));
    
    try {
      // OpenRouteService attend les coordonnées au format [lng, lat]
      const routeData = await routeService.getRoute(
        [start.longitude, start.latitude],
        [end.longitude, end.latitude],
        routeType
      );
      
      set((state) => ({
        route: {
          ...state.route,
          routeData,
          isLoading: false
        }
      }));
      
      // Charger automatiquement les données le long de l'itinéraire
      get().loadDataAlongRoute(routeData);
      
    } catch (error) {
      set((state) => ({
        route: {
          ...state.route,
          isLoading: false,
          error: error.message
        }
      }));
    }
  },
  
  // Chargement des données le long de l'itinéraire
  loadDataAlongRoute: async (routeData) => {
    if (!routeData || !routeData.bbox) return;
    
    const bbox = routeData.bbox; // [minLon, minLat, maxLon, maxLat]
    
    // Mise à jour des bornes de la carte pour afficher tout l'itinéraire
    get().setMapBounds(bbox);
    
    // Chargement des incidents
    get().loadIncidents(bbox);
    
    // Chargement des radars
    get().loadRadars(bbox);
    
    // Chargement de la météo au point de départ
    if (get().route.start) {
      get().loadWeather(get().route.start.latitude, get().route.start.longitude);
    }
    
    // Chargement des POIs (format OSM différent)
    get().loadPOIs([bbox[1], bbox[0], bbox[3], bbox[2]]);
  },
  
  // Chargement des incidents
  loadIncidents: async (bbox) => {
    if (!get().userSettings.showIncidents) return;
    
    set((state) => ({
      mapData: {
        ...state.mapData,
        isLoading: {
          ...state.mapData.isLoading,
          incidents: true
        }
      }
    }));
    
    try {
      const data = await trafficService.getIncidents(bbox);
      
      set((state) => ({
        mapData: {
          ...state.mapData,
          incidents: data.TRAFFIC_ITEMS?.TRAFFIC_ITEM || [],
          isLoading: {
            ...state.mapData.isLoading,
            incidents: false
          }
        }
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des incidents:", error);
      
      set((state) => ({
        mapData: {
          ...state.mapData,
          isLoading: {
            ...state.mapData.isLoading,
            incidents: false
          }
        }
      }));
    }
  },
  
  // Chargement des radars
  loadRadars: async (bbox) => {
    if (!get().userSettings.showRadars) return;
    
    set((state) => ({
      mapData: {
        ...state.mapData,
        isLoading: {
          ...state.mapData.isLoading,
          radars: true
        }
      }
    }));
    
    try {
      const data = await trafficService.getRadars(bbox);
      
      set((state) => ({
        mapData: {
          ...state.mapData,
          radars: data.radars || [],
          isLoading: {
            ...state.mapData.isLoading,
            radars: false
          }
        }
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des radars:", error);
      
      set((state) => ({
        mapData: {
          ...state.mapData,
          isLoading: {
            ...state.mapData.isLoading,
            radars: false
          }
        }
      }));
    }
  },
  
  // Chargement de la météo
  loadWeather: async (lat, lon) => {
    if (!get().userSettings.showWeather) return;
    
    set((state) => ({
      mapData: {
        ...state.mapData,
        isLoading: {
          ...state.mapData.isLoading,
          weather: true
        }
      }
    }));
    
    try {
      const data = await weatherService.getCurrentWeather(lat, lon);
      
      set((state) => ({
        mapData: {
          ...state.mapData,
          weather: data,
          isLoading: {
            ...state.mapData.isLoading,
            weather: false
          }
        }
      }));
    } catch (error) {
      console.error("Erreur lors du chargement de la météo:", error);
      
      set((state) => ({
        mapData: {
          ...state.mapData,
          isLoading: {
            ...state.mapData.isLoading,
            weather: false
          }
        }
      }));
    }
  },
  
  // Chargement des POIs
  loadPOIs: async (bbox) => {
    if (!get().userSettings.showPOIs) return;
    
    set((state) => ({
      mapData: {
        ...state.mapData,
        isLoading: {
          ...state.mapData.isLoading,
          pois: true
        }
      }
    }));
    
    try {
      const data = await poiService.getBikerPOIs(bbox);
      
      set((state) => ({
        mapData: {
          ...state.mapData,
          pois: data.elements || [],
          isLoading: {
            ...state.mapData.isLoading,
            pois: false
          }
        }
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des POIs:", error);
      
      set((state) => ({
        mapData: {
          ...state.mapData,
          isLoading: {
            ...state.mapData.isLoading,
            pois: false
          }
        }
      }));
    }
  },
  
  // Mise à jour des paramètres utilisateur
  toggleSetting: (setting) => {
    set((state) => ({
      userSettings: {
        ...state.userSettings,
        [setting]: !state.userSettings[setting]
      }
    }));
    
    // Actualiser les données si on vient d'activer un paramètre
    const newValue = !get().userSettings[setting];
    if (newValue) {
      const { map, route } = get();
      
      if (map.bounds) {
        switch (setting) {
          case 'showIncidents':
            get().loadIncidents(map.bounds);
            break;
          case 'showRadars':
            get().loadRadars(map.bounds);
            break;
          case 'showPOIs':
            get().loadPOIs([map.bounds[1], map.bounds[0], map.bounds[3], map.bounds[2]]);
            break;
          case 'showWeather':
            if (route.start) {
              get().loadWeather(route.start.latitude, route.start.longitude);
            }
            break;
        }
      }
    }
  }
}));

export default useRideFlowStore;
