import { NextResponse } from "next/server";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const west = searchParams.get("west");
    const south = searchParams.get("south");
    const east = searchParams.get("east");
    const north = searchParams.get("north");

    if (!west || !south || !east || !north) {
      return NextResponse.json(
        {
          error:
            "Tous les paramètres de bounding box sont requis (west, south, east, north)",
        },
        { status: 400 }
      );
    }

    // Utiliser l'API publique data.gouv.fr pour les radars en France
    // Format de bbox: minLon,minLat,maxLon,maxLat
    const bboxParam = `${west},${south},${east},${north}`;

    // Construire l'URL de l'API pour les radars automatiques
    // Utilisant l'API Overpass pour interroger OpenStreetMap qui contient des données sur les radars
    const overpassQuery = `
      [out:json];
      (
        // Radars fixes
        node["highway"="speed_camera"]["camera:type"="fixed"](${south},${west},${north},${east});
        // Radars tronçon
        node["highway"="speed_camera"]["camera:type"="section"](${south},${west},${north},${east});
        // Radars feu rouge
        node["highway"="speed_camera"]["camera:type"="red_light"](${south},${west},${north},${east});
        // Tous les autres radars
        node["highway"="speed_camera"](${south},${west},${north},${east});
      );
      out body;
    `;

    // URL encodée pour l'API Overpass
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(
      overpassQuery
    )}`;

    console.log("Requête Overpass URL:", overpassUrl);

    try {
      const response = await fetch(overpassUrl, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "User-Agent": "RideFlow/1.0",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Erreur de l'API Overpass: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Transformer les données OSM en format utilisable par notre application
      const radars = transformOverpassData(data);

      return NextResponse.json({ radars });
    } catch (apiError) {
      console.error("Erreur lors de la requête API:", apiError);
      return NextResponse.json({ radars: fallbackRadars, source: "fallback" });
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des radars:", error);
    return NextResponse.json(
      {
        error: error.message || "Erreur lors de la récupération des radars",
        source: "error",
      },
      { status: 500 }
    );
  }
}

// Transformer les données OSM en format standard pour notre application
function transformOverpassData(osmData) {
  if (!osmData || !osmData.elements || !Array.isArray(osmData.elements)) {
    return [];
  }

  return osmData.elements.map((element, index) => {
    const tags = element.tags || {};

    // Déterminer le type de radar
    let type = "Fixe"; // Par défaut
    if (tags["camera:type"] === "section") {
      type = "Tronçon";
    } else if (tags["camera:type"] === "red_light") {
      type = "Feu rouge";
    } else if (tags["camera:type"] === "mobile") {
      type = "Mobile";
    }

    // Déterminer la limitation de vitesse
    let speed = 50; // Valeur par défaut
    if (tags["maxspeed"]) {
      const maxspeedStr = String(tags["maxspeed"]).replace(/\D/g, "");
      if (maxspeedStr) {
        speed = parseInt(maxspeedStr, 10);
      }
    }

    // Déterminer l'emplacement
    const location =
      tags.name ||
      tags.description ||
      (tags.road ? `${tags.road}, ${tags.city || ""}` : "Emplacement inconnu");

    return {
      id: `osm-${element.id || index}`,
      lat: element.lat,
      lng: element.lon,
      type,
      speed,
      location,
      source: "osm",
    };
  });
}
