/**
 * Store global pour RideFlow utilisant Zustand
 *
 * Ce fichier centralise la gestion d'état de l'application.
 */

// Fonction pour déterminer la direction à partir du texte d'instruction
function determinerDirection(texte) {
  const texteBas = texte.toLowerCase();

  if (texteBas.includes("droite") || texteBas.includes("bifurqu")) {
    return "right";
  }

  if (texteBas.includes("gauche")) {
    return "left";
  }

  if (
    texteBas.includes("tout droit") ||
    texteBas.includes("continuez") ||
    texteBas.includes("continuer")
  ) {
    return "straight";
  }

  if (texteBas.includes("demi-tour")) {
    return "uturn";
  }

  if (texteBas.includes("rond-point") || texteBas.includes("sortie")) {
    return "roundabout";
  }

  return ""; // Direction inconnue
}

import { create } from "zustand";
import {
  routeService,
  trafficService,
  weatherService,
  poiService,
} from "./apiServices";

function extractInstructions(routeData) {
  // Pour le débogage, regardez la structure des données reçues
  console.log("Extraction des instructions depuis les données d'itinéraire:");

  // Si la structure utilise le format OpenRouteService standard
  if (routeData && routeData.routes && routeData.routes[0]) {
    const route = routeData.routes[0];

    // Parcourir les segments
    if (route.segments) {
      const allInstructions = [];

      // Ajouter une instruction de départ
      allInstructions.push({
        id: "depart",
        instruction: "Point de départ",
        distance: 0,
        duration: 0,
        type: "depart",
        name: route.summary
          ? `Distance totale: ${formatDistance(route.summary.distance)}`
          : "",
      });

      // Parcourir tous les segments et récupérer les étapes
      route.segments.forEach((segment, segmentIndex) => {
        if (segment.steps) {
          segment.steps.forEach((step, stepIndex) => {
            // Extraction basique des informations
            const instruction =
              traduireInstruction(step.instruction) || "Continuez tout droit";
            const distance = step.distance || 0;
            const duration = step.duration || 0;
            const name = step.name || "";
            const type = step.type || "";

            allInstructions.push({
              id: `${segmentIndex}-${stepIndex}`,
              instruction,
              distance,
              duration,
              name,
              type,
              direction: determinerDirection(instruction),
            });
          });
        }
      });

      // Ajouter une instruction d'arrivée
      allInstructions.push({
        id: "arrive",
        instruction: "Arrivée à destination",
        distance: 0,
        duration: 0,
        type: "arrive",
        name: route.summary
          ? `Durée estimée: ${formatDuration(route.summary.duration)}`
          : "",
      });

      return allInstructions;
    }
  }

  // Si la structure n'est pas reconnue, essayer de détecter le format
  if (routeData && routeData.features) {
    try {
      const feature = routeData.features.find(
        (f) => f.properties && f.properties.segments
      );
      if (feature && feature.properties && feature.properties.segments) {
        // Format GeoJSON détecté, récursion avec une structure adaptée
        return extractInstructions({
          routes: [
            {
              segments: feature.properties.segments,
              summary: feature.properties.summary,
            },
          ],
        });
      }
    } catch (e) {
      console.error("Erreur lors de l'extraction des instructions:", e);
    }
  }

  console.warn(
    "Format de données non reconnu pour les instructions, génération d'instructions basiques"
  );

  // Générer des instructions minimales si le format n'est pas reconnu
  return [
    {
      id: "depart",
      instruction: "Point de départ",
      distance: 0,
      type: "depart",
    },
    {
      id: "info",
      instruction: "Itinéraire calculé",
      distance: getRouteDistance(routeData),
      type: "info",
    },
    {
      id: "arrive",
      instruction: "Arrivée à destination",
      distance: 0,
      type: "arrive",
    },
  ];
}

// Fonction pour traduire les instructions en français
function traduireInstruction(texte) {
  if (!texte) return "";

  // Déjà en français
  if (
    texte.includes("droite") ||
    texte.includes("gauche") ||
    texte.includes("continuez")
  ) {
    return texte;
  }

  // Traductions courantes
  const traductions = {
    "Turn right": "Tournez à droite",
    "Turn left": "Tournez à gauche",
    "Turn slight right": "Légère bifurcation à droite",
    "Turn slight left": "Légère bifurcation à gauche",
    "Turn sharp right": "Virage serré à droite",
    "Turn sharp left": "Virage serré à gauche",
    "Make a U-turn": "Faites demi-tour",
    Continue: "Continuez tout droit",
    "Continue straight": "Continuez tout droit",
    "Keep right": "Serrez à droite",
    "Keep left": "Serrez à gauche",
    "Enter roundabout": "Entrez dans le rond-point",
    "Exit roundabout": "Sortez du rond-point",
    "Take the 1st exit": "Prenez la 1ère sortie",
    "Take the 2nd exit": "Prenez la 2ème sortie",
    "Take the 3rd exit": "Prenez la 3ème sortie",
    "Take the exit": "Prenez la sortie",
    "At the roundabout": "Au rond-point",
    Destination: "Destination",
    "You have arrived at your destination": "Vous êtes arrivé à destination",
  };

  // Essayer de trouver une traduction exacte
  if (traductions[texte]) return traductions[texte];

  // Essayer de trouver des motifs à remplacer
  let resultat = texte;

  // Remplacer les parties communes
  for (const [anglais, francais] of Object.entries(traductions)) {
    if (resultat.includes(anglais)) {
      resultat = resultat.replace(anglais, francais);
    }
  }

  // Remplacer les nombres d'ordinal
  resultat = resultat.replace(
    /take the (\d+)(?:st|nd|rd|th) exit/i,
    (match, nombre) => {
      if (nombre === "1") return "Prenez la 1ère sortie";
      return `Prenez la ${nombre}ème sortie`;
    }
  );

  // Si aucune traduction trouvée, renvoyer le texte original
  return resultat;
}

// Fonction utilitaire pour formater les distances
function formatDistance(meters) {
  if (!meters && meters !== 0) return "";
  if (meters < 1000) {
    return `${Math.round(meters)} mètres`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

// Fonction utilitaire pour formater les durées
function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return "";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  }
  return `${minutes} min`;
}

// Fonction pour récupérer la distance d'un itinéraire
function getRouteDistance(routeData) {
  if (!routeData) return 0;

  // Essayer différents formats
  if (routeData.routes && routeData.routes[0] && routeData.routes[0].summary) {
    return routeData.routes[0].summary.distance;
  }

  if (
    routeData.features &&
    routeData.features[0] &&
    routeData.features[0].properties &&
    routeData.features[0].properties.summary
  ) {
    return routeData.features[0].properties.summary.distance;
  }

  return 0;
}

const useRideFlowStore = create((set, get) => ({
  // État de la carte
  map: {
    center: [48.8566, 2.3522], // Paris par défaut (format Leaflet [lat, lng])
    zoom: 13,
    bounds: null,
    isLoaded: false,
  },

  // État de l'itinéraire
  route: {
    start: null,
    end: null,
    waypoints: [],
    routeType: "FAST", // 'FAST' ou 'CURVY'
    routeData: null,
    instructions: [],
    isLoading: false,
    error: null,
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
      pois: false,
    },
  },

  // Paramètres utilisateur
  userSettings: {
    showRadars: false,
    showIncidents: false,
    showWeather: true,
    showPOIs: true,
    showInstructions: true,
    darkMode: false,
    pointPlacementMode: false, // Mode de placement des points par clic sur la carte
  },

  isSelectingStartPoint: true,

  // Actions pour la carte
  setMapCenter: (center) =>
    set((state) => ({
      map: { ...state.map, center },
    })),

  setMapZoom: (zoom) =>
    set((state) => ({
      map: { ...state.map, zoom },
    })),

  setMapBounds: (bounds) =>
    set((state) => ({
      map: { ...state.map, bounds },
    })),

  setMapLoaded: (isLoaded) =>
    set((state) => ({
      map: { ...state.map, isLoaded },
    })),

  // Actions pour l'itinéraire
  setRouteStart: (start) =>
    set((state) => ({
      route: { ...state.route, start },
    })),

  setRouteEnd: (end) =>
    set((state) => ({
      route: { ...state.route, end },
    })),

  setRouteType: (routeType) =>
    set((state) => ({
      route: { ...state.route, routeType },
    })),

  addWaypoint: (waypoint) =>
    set((state) => ({
      route: {
        ...state.route,
        waypoints: [...state.route.waypoints, waypoint],
      },
    })),

  removeWaypoint: (index) =>
    set((state) => ({
      route: {
        ...state.route,
        waypoints: state.route.waypoints.filter((_, i) => i !== index),
      },
    })),

  // Calcul d'itinéraire
  calculateRoute: async () => {
    const { start, end, routeType } = get().route;

    if (!start || !end) {
      return set((state) => ({
        route: {
          ...state.route,
          error: "Points de départ et d'arrivée requis",
        },
      }));
    }

    set((state) => ({
      route: {
        ...state.route,
        isLoading: true,
        error: null,
      },
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
          instructions: extractInstructions(routeData),
          isLoading: false,
        },
      }));

      // Charger automatiquement les données le long de l'itinéraire
      get().loadDataAlongRoute(routeData);
    } catch (error) {
      set((state) => ({
        route: {
          ...state.route,
          isLoading: false,
          error: error.message,
        },
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
      get().loadWeather(
        get().route.start.latitude,
        get().route.start.longitude
      );
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
          incidents: true,
        },
      },
    }));

    try {
      const data = await trafficService.getIncidents(bbox);

      set((state) => ({
        mapData: {
          ...state.mapData,
          incidents: data.TRAFFIC_ITEMS?.TRAFFIC_ITEM || [],
          isLoading: {
            ...state.mapData.isLoading,
            incidents: false,
          },
        },
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des incidents:", error);

      set((state) => ({
        mapData: {
          ...state.mapData,
          isLoading: {
            ...state.mapData.isLoading,
            incidents: false,
          },
        },
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
          radars: true,
        },
      },
    }));

    try {
      const data = await trafficService.getRadars(bbox);

      set((state) => ({
        mapData: {
          ...state.mapData,
          radars: data.radars || [],
          isLoading: {
            ...state.mapData.isLoading,
            radars: false,
          },
        },
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des radars:", error);

      set((state) => ({
        mapData: {
          ...state.mapData,
          isLoading: {
            ...state.mapData.isLoading,
            radars: false,
          },
        },
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
          weather: true,
        },
      },
    }));

    try {
      const data = await weatherService.getCurrentWeather(lat, lon);

      set((state) => ({
        mapData: {
          ...state.mapData,
          weather: data,
          isLoading: {
            ...state.mapData.isLoading,
            weather: false,
          },
        },
      }));
    } catch (error) {
      console.error("Erreur lors du chargement de la météo:", error);

      set((state) => ({
        mapData: {
          ...state.mapData,
          isLoading: {
            ...state.mapData.isLoading,
            weather: false,
          },
        },
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
          pois: true,
        },
      },
    }));

    try {
      const data = await poiService.getBikerPOIs(bbox);

      set((state) => ({
        mapData: {
          ...state.mapData,
          pois: data.elements || [],
          isLoading: {
            ...state.mapData.isLoading,
            pois: false,
          },
        },
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des POIs:", error);

      set((state) => ({
        mapData: {
          ...state.mapData,
          isLoading: {
            ...state.mapData.isLoading,
            pois: false,
          },
        },
      }));
    }
  },

  handleMapClick: async (latlng) => {
    // Vérifier si le mode de placement des points est activé
    if (!get().userSettings.pointPlacementMode) return false;

    try {
      // Déterminer quel point est en cours de sélection
      const isStart = get().isSelectingStartPoint;
      console.log(
        `Traitement du clic sur la carte: définition du point ${
          isStart ? "de départ" : "d'arrivée"
        }`
      );

      // Effectuer un géocodage inverse pour obtenir l'adresse du point cliqué
      const response = await fetch(
        `/api/geocode?q=${latlng.lat},${latlng.lng}&limit=1`
      );

      if (!response.ok) {
        throw new Error(`Erreur API: ${response.status}`);
      }

      const data = await response.json();
      const address = data && data.length > 0 ? data[0] : null;

      if (address) {
        // Créer un point à partir des coordonnées
        const point = {
          latitude: latlng.lat,
          longitude: latlng.lng,
          displayName:
            address.displayName ||
            `Position (${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)})`,
          type: "map_click",
        };

        // Mise à jour du point dans le store
        if (isStart) {
          get().setRouteStart(point);
          console.log("Point de départ défini", point);
        } else {
          get().setRouteEnd(point);
          console.log("Point d'arrivée défini", point);

          // Quand on a placé le point d'arrivée (second point), désactiver automatiquement le mode de placement
          if (get().route.start) {
            // Vérifier que le point de départ existe bien aussi
            console.log(
              "Les deux points sont placés, préparation de désactivation du mode..."
            );

            // Déclencher automatiquement le calcul d'itinéraire
            setTimeout(() => {
              // Désactiver le mode de placement après un court délai
              set({
                userSettings: {
                  ...get().userSettings,
                  pointPlacementMode: false,
                },
                isSelectingStartPoint: true, // Réinitialiser à la sélection du point de départ pour la prochaine fois
              });

              // Force le curseur à redevenir normal immédiatement
              try {
                // Forcer le changement de curseur en utilisant document.body d'abord
                document.body.style.cursor = "auto";

                // Puis spécifiquement pour l'élément de carte
                const mapElements = document.querySelectorAll(
                  '[style*="height: 100vh"]'
                );
                mapElements.forEach((el) => {
                  el.style.cursor = "grab";
                });

                console.log("Curseur forcé en mode normal via setTimeout");
              } catch (e) {
                console.warn("Impossible de forcer le curseur", e);
              }

              // Calculer l'itinéraire
              get().calculateRoute();
            }, 100);

            return true;
          }
        }

        // Si on a déjà placé le deuxième point, on ne change plus l'état
        if (!isStart && get().route.start) {
          return true;
        }

        // Basculer pour la prochaine sélection - IMPORTANT: la nouvelle valeur sera l'inverse de l'ancienne
        const newSelectingStart = !isStart;
        set({ isSelectingStartPoint: newSelectingStart });
        console.log(
          "Changement du type de point à placer: maintenant c'est",
          newSelectingStart ? "Point de départ" : "Point d'arrivée"
        );

        // Après avoir changé l'état, on vérifie qu'il a bien changé
        setTimeout(() => {
          const currentState = get().isSelectingStartPoint;
          console.log(
            "Vérification de l'état actuel:",
            currentState ? "Point de départ" : "Point d'arrivée"
          );
        }, 100);

        return true;
      } else {
        console.error("Aucune adresse trouvée pour ces coordonnées");
        return false;
      }
    } catch (error) {
      console.error("Erreur lors du géocodage inverse:", error);
      return false;
    }
  },

  resetPointSelection: () => set({ isSelectingStartPoint: true }),

  // Toggle du mode de placement des points
  togglePointPlacementMode: () => {
    set((state) => ({
      userSettings: {
        ...state.userSettings,
        pointPlacementMode: !state.userSettings.pointPlacementMode,
      },
      isSelectingStartPoint: true, // Réinitialiser à la sélection du point de départ
    }));
  },

  // Mise à jour des paramètres utilisateur
  toggleSetting: (setting) => {
    set((state) => ({
      userSettings: {
        ...state.userSettings,
        [setting]: !state.userSettings[setting],
      },
    }));

    // Actualiser les données si on vient d'activer un paramètre
    const newValue = !get().userSettings[setting];
    if (newValue) {
      const { map, route } = get();

      if (map.bounds) {
        switch (setting) {
          case "showIncidents":
            get().loadIncidents(map.bounds);
            break;
          case "showRadars":
            get().loadRadars(map.bounds);
            break;
          case "showPOIs":
            get().loadPOIs([
              map.bounds[1],
              map.bounds[0],
              map.bounds[3],
              map.bounds[2],
            ]);
            break;
          case "showWeather":
            if (route.start) {
              get().loadWeather(route.start.latitude, route.start.longitude);
            }
            break;
        }
      }
    }
  },
}));

export default useRideFlowStore;
