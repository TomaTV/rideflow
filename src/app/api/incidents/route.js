import { NextResponse } from "next/server";

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

    // Pour le moment, comme l'API externe ne fonctionne pas, retournons des données de test
    const [west, south, east, north] = bbox.split(",").map(parseFloat);
    const mockIncidents = generateMockIncidents(south, west, north, east);

    return NextResponse.json({
      TRAFFIC_ITEMS: {
        TRAFFIC_ITEM: mockIncidents,
      },
    });
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

// Fonction pour générer des données de test pour les incidents
function generateMockIncidents(south, west, north, east) {
  const numIncidents = Math.floor(Math.random() * 5) + 2; // 2-6 incidents
  const incidents = [];

  const latSpan = north - south;
  const lngSpan = east - west;

  const types = ["ACCIDENT", "CONSTRUCTION", "CONGESTION", "ROAD_CLOSED"];
  const descriptions = [
    "Accident impliquant plusieurs véhicules",
    "Travaux routiers en cours",
    "Embouteillage important",
    "Route fermée pour travaux",
    "Incident sur la chaussée",
    "Manifestation",
  ];

  for (let i = 0; i < numIncidents; i++) {
    const lat = south + Math.random() * latSpan;
    const lng = west + Math.random() * lngSpan;
    const type = types[Math.floor(Math.random() * types.length)];
    const description =
      descriptions[Math.floor(Math.random() * descriptions.length)];

    incidents.push({
      id: `incident-${i}`,
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
    });
  }

  return incidents;
}
