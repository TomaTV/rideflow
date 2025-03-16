import { NextResponse } from "next/server";
import axios from "axios";
import { API_KEYS, API_ENDPOINTS } from "@/utils/apiConfig";

// Fonction pour traduire les descriptions d'incidents de l'anglais vers le français
function traduireDescriptionIncident(description) {
  if (!description || typeof description !== 'string') return description;
  
  const traductions = {
    "stationary traffic": "Trafic à l'arrêt",
    "slow traffic": "Trafic ralenti",
    "queuing traffic": "Trafic en file d'attente",
    "closed": "Fermé",
    "congestion": "Embouteillage",
    "accident": "Accident",
    "incident": "Incident",
    "roadworks": "Travaux",
    "construction": "Construction",
    "road closed": "Route fermée",
    "lane closed": "Voie fermée",
    "traffic jam": "Embouteillage",
    "roadblock": "Barrage routier",
    "detour": "Déviation",
    "danger": "Danger",
    "caution": "Prudence",
    "slippery road": "Route glissante",
    "obstruction": "Obstruction",
    "breakdown": "Panne",
    "planned closure": "Fermeture planifiée",
    "road construction": "Travaux routiers",
    "bridge": "Pont"
  };
  
  // Rechercher des correspondances complètes ou partielles
  let result = description;
  for (const [anglais, francais] of Object.entries(traductions)) {
    // Correspondance complète
    if (description.toLowerCase() === anglais.toLowerCase()) {
      return francais;
    }
    
    // Correspondance partielle (remplacer chaque occurrence)
    const regex = new RegExp(anglais, 'gi');
    if (regex.test(description.toLowerCase())) {
      result = result.replace(regex, francais);
    }
  }
  
  return result;
}

// Récupérer la clé API TomTom depuis les variables d'environnement
const TOMTOM_API_KEY = API_KEYS.TOMTOM;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const bbox = searchParams.get("bbox");

    if (!bbox) {
      return NextResponse.json(
        { error: "Le paramètre bbox est requis" },
        { status: 400 }
      );
    }

    // Format: minLon,minLat,maxLon,maxLat
    const [west, south, east, north] = bbox.split(",").map(parseFloat);

    // Utiliser uniquement l'API TomTom pour obtenir des incidents réels
    try {
      console.log(`Récupération des incidents pour bbox: ${bbox}`);
      const tomtomResponse = await fetchTomTomIncidents(
        south,
        west,
        north,
        east
      );
      
      return NextResponse.json({
        TRAFFIC_ITEMS: {
          TRAFFIC_ITEM: tomtomResponse,
        },
        source: "tomtom",
      });
    } catch (apiError) {
      console.error("Erreur lors de l'appel à l'API TomTom:", apiError);
      
      // En cas d'échec, renvoyer un tableau vide
      return NextResponse.json({
        TRAFFIC_ITEMS: {
          TRAFFIC_ITEM: [],
        },
        source: "tomtom_empty",
        error: "Aucune donnée d'incident disponible"
      });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des incidents:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la récupération des incidents",
      },
      { status: 500 }
    );
  }
}

// Fonction pour récupérer les incidents depuis l'API TomTom
async function fetchTomTomIncidents(south, west, north, east) {
  // Construire l'URL de l'API TomTom pour les incidents
  const tomtomUrl = `${API_ENDPOINTS.TOMTOM_TRAFFIC}?key=${TOMTOM_API_KEY}&bbox=${west},${south},${east},${north}&fields={incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}`;

  const response = await axios.get(tomtomUrl);

  if (!response.data || !response.data.incidents) {
    console.log("Aucun incident trouvé via TomTom API");
    return [];
  }

  // Transformer les données TomTom au format attendu par notre frontend
  return response.data.incidents
    .map((incident, index) => {
      // Extraire les coordonnées (le premier point pour la localisation)
      let lat = null;
      let lng = null;

      if (
        incident.geometry &&
        incident.geometry.coordinates &&
        incident.geometry.coordinates.length > 0
      ) {
        // TomTom renvoie [longitude, latitude]
        if (incident.geometry.type === "LineString") {
          lng = incident.geometry.coordinates[0][0];
          lat = incident.geometry.coordinates[0][1];
        } else if (incident.geometry.type === "Point") {
          lng = incident.geometry.coordinates[0];
          lat = incident.geometry.coordinates[1];
        }
      }

      // Construire une description basée sur les événements
      let description = "Incident de circulation";
      if (
        incident.properties &&
        incident.properties.events &&
        incident.properties.events.length > 0
      ) {
        description = incident.properties.events[0].description || description;
        // Traduire la description de l'anglais vers le français
        description = traduireDescriptionIncident(description);
      }

      // Déterminer le type d'incident
      let type = "UNKNOWN";
      if (incident.properties && incident.properties.iconCategory) {
        switch (incident.properties.iconCategory) {
          case "accident":
            type = "ACCIDENT";
            break;
          case "roadworks":
          case "construction":
            type = "CONSTRUCTION";
            break;
          case "congestion":
          case "jam":
            type = "CONGESTION";
            break;
          case "roadClosure":
          case "closure":
            type = "ROAD_CLOSED";
            break;
          default:
            if (typeof incident.properties.iconCategory === "string") {
              type = incident.properties.iconCategory.toUpperCase();
            } else {
              type = "UNKNOWN";
            }
        }
      } else {
        type = "UNKNOWN";
      }

      return {
        id: `tomtom-${incident.id || index}`,
        TYPE: type,
        TRAFFIC_ITEM_DESCRIPTION: { value: description },
        LOCATION: {
          GEOLOC: {
            COORDINATES: {
              LATITUDE: lat,
              LONGITUDE: lng,
            },
          },
        },
        // Informations supplémentaires
        from: incident.properties?.from || "",
        to: incident.properties?.to || "",
        delay: incident.properties?.delay || 0,
        startTime: incident.properties?.startTime || new Date().toISOString(),
        endTime: incident.properties?.endTime || null,
      };
    })
    .filter(
      (incident) =>
        incident.LOCATION.GEOLOC.COORDINATES.LATITUDE &&
        incident.LOCATION.GEOLOC.COORDINATES.LONGITUDE
    );
}