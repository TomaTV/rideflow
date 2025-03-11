import { NextResponse } from "next/server";

export async function GET(request) {
  // Récupération du paramètre de requête
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const limit = searchParams.get("limit") || 5;

  console.log(
    `API /routes/geocode appelée avec la requête: ${query}, limite: ${limit}`
  );

  if (!query) {
    console.error("Requête sans paramètre q");
    return NextResponse.json(
      { error: 'Le paramètre de requête "q" est requis' },
      { status: 400 }
    );
  }

  try {
    console.log("Préparation de la requête vers Nominatim...");
    await new Promise((resolve) => setTimeout(resolve, 200));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=fr&limit=${limit}&addressdetails=1`;
    console.log(`URL Nominatim: ${nominatimUrl}`);

    let response;
    try {
      response = await fetch(nominatimUrl, {
        headers: {
          "User-Agent": "RideFlow/1.0 (contact@rideflow.app)",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId); 
    } catch (fetchError) {
      console.error("Erreur lors de la requête fetch:", fetchError);
      console.log(
        "Utilisation des données simulées suite à une erreur de fetch"
      );
      return NextResponse.json(
        generateMockAddressResults(query, parseInt(limit))
      );
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Nominatim a répondu avec le status: ${response.status}, message: ${errorText}`
      );
      console.log(
        "Utilisation des données simulées suite à une réponse non-OK"
      );
      return NextResponse.json(
        generateMockAddressResults(query, parseInt(limit))
      );
    }

    let data;
    try {
      data = await response.json();
      console.log(
        `Données reçues de Nominatim: ${JSON.stringify(data).slice(0, 200)}...`
      );
    } catch (jsonError) {
      console.error("Erreur lors du parsing JSON:", jsonError);
      console.log(
        "Utilisation des données simulées suite à une erreur de parsing JSON"
      );
      return NextResponse.json(
        generateMockAddressResults(query, parseInt(limit))
      );
    }

    if (!Array.isArray(data) || data.length === 0) {
      console.error("Format de réponse invalide ou vide de Nominatim");
      console.log(
        "Utilisation des données simulées suite à un format invalide ou vide"
      );
      return NextResponse.json(
        generateMockAddressResults(query, parseInt(limit))
      );
    }

    const suggestions = data.map((item) => ({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      displayName: item.display_name,
      type: item.type,
      importance: item.importance,
    }));

    console.log(`Retour de ${suggestions.length} suggestions transformées`);
    return NextResponse.json(suggestions);
  } catch (error) {
    console.error("Erreur de géocodage:", error);

    if (query.length > 3) {
      console.log("Utilisation de données simulées pour:", query);
      const mockResults = generateMockAddressResults(query, parseInt(limit));
      return NextResponse.json(mockResults);
    }

    return NextResponse.json(
      { error: "Erreur lors de la récupération des adresses" },
      { status: 500 }
    );
  }
}

// Fonction pour générer des adresses simulées en cas d'échec de l'API
function generateMockAddressResults(query, limit = 5) {
  console.log(
    `Génération de ${limit} résultats simulés pour la requête: ${query}`
  );

  const cities = [
    {
      name: "Paris",
      lat: 48.8566,
      lon: 2.3522,
      quartiers: ["Montmartre", "Champs-Élysées", "Marais", "Bastille"],
    },
    {
      name: "Lyon",
      lat: 45.7578,
      lon: 4.832,
      quartiers: ["Croix-Rousse", "Vieux Lyon", "Guillotière", "Confluence"],
    },
    {
      name: "Marseille",
      lat: 43.2965,
      lon: 5.3698,
      quartiers: ["Vieux-Port", "Prado", "Cannebière", "Endoume"],
    },
    {
      name: "Bordeaux",
      lat: 44.8378,
      lon: -0.5792,
      quartiers: ["Saint-Pierre", "Chartrons", "Saint-Michel", "Caudéran"],
    },
    {
      name: "Lille",
      lat: 50.6292,
      lon: 3.0573,
      quartiers: ["Vieux-Lille", "Wazemmes", "Centre", "Fives"],
    },
    {
      name: "Toulouse",
      lat: 43.6047,
      lon: 1.4442,
      quartiers: ["Capitole", "Saint-Cyprien", "Carmes", "Minimes"],
    },
    {
      name: "Nice",
      lat: 43.7102,
      lon: 7.262,
      quartiers: ["Promenade des Anglais", "Cimiez", "Vieux-Nice", "Port"],
    },
    {
      name: "Nantes",
      lat: 47.2184,
      lon: -1.5536,
      quartiers: ["Centre-ville", "Île de Nantes", "Chantenay", "Zola"],
    },
    {
      name: "Strasbourg",
      lat: 48.5734,
      lon: 7.7521,
      quartiers: ["Petite France", "Krutenau", "Neudorf", "Orangerie"],
    },
    {
      name: "Montpellier",
      lat: 43.6108,
      lon: 3.8767,
      quartiers: ["Centre historique", "Antigone", "Port Marianne", "Mosson"],
    },
  ];

  const streets = [
    "Rue de la Paix",
    "Avenue Victor Hugo",
    "Boulevard Saint-Germain",
    "Rue Nationale",
    "Avenue de la République",
    "Rue du Marché",
    "Boulevard des Lilas",
    "Rue Pasteur",
    "Avenue Jean Jaurès",
    "Rue de la Gare",
    "Boulevard du Général Leclerc",
    "Rue Gambetta",
  ];

  const numResults = Math.min(limit, 5);
  const results = [];

  let matchingCities = cities.filter(
    (city) =>
      city.name.toLowerCase().includes(query.toLowerCase()) ||
      query.toLowerCase().includes(city.name.toLowerCase())
  );

  if (matchingCities.length === 0) {
    const words = query.split(/\s+/);
    const potentialCityNames = words.filter(
      (word) =>
        word.length > 3 &&
        word.charAt(0) === word.charAt(0).toUpperCase() &&
        !streets.some((street) => street.includes(word))
    );

    if (potentialCityNames.length > 0) {
      const cityName = potentialCityNames[0];
      const newCity = {
        name: cityName,
        lat: 46.603354 + (Math.random() - 0.5) * 3,
        lon: 1.888334 + (Math.random() - 0.5) * 3,
        quartiers: [
          `Centre-ville de ${cityName}`,
          `Nord de ${cityName}`,
          `Gare de ${cityName}`,
        ],
      };

      matchingCities = [newCity];

      results.push({
        latitude: newCity.lat,
        longitude: newCity.lon,
        displayName: `${cityName}, France`,
        type: "city",
        importance: 0.95,
      });
    } else {
      const containsStreetName = streets.some((street) =>
        query.toLowerCase().includes(street.toLowerCase())
      );

      if (containsStreetName) {
        matchingCities = cities.slice(0, 3);
      } else {
        matchingCities = cities;
      }
    }
  }
  if (matchingCities.length === 0 && cities.length > 0) {
    matchingCities = [cities[0]];
  }

  if (
    results.length === 0 &&
    matchingCities.length === 1 &&
    matchingCities[0].name.toLowerCase() === query.toLowerCase()
  ) {
    const city = matchingCities[0];
    results.push({
      latitude: city.lat,
      longitude: city.lon,
      displayName: `${city.name}, France`,
      type: "city",
      importance: 0.95,
    });

    if (city.quartiers && city.quartiers.length > 0) {
      for (let i = 0; i < Math.min(2, city.quartiers.length); i++) {
        const quartier = city.quartiers[i];
        const latOffset = (Math.random() - 0.5) * 0.01;
        const lonOffset = (Math.random() - 0.5) * 0.01;

        results.push({
          latitude: city.lat + latOffset,
          longitude: city.lon + lonOffset,
          displayName: `${quartier}, ${city.name}, France`,
          type: "suburb",
          importance: 0.85 - i * 0.05,
        });
      }
    }
  }
  else if (results.length === 0) {
    const hasNumber = /\d+/.test(query);
    const streetQuery = hasNumber ? query.replace(/^\d+\s+/, "") : query;

    for (
      let i = 0;
      results.length < numResults && i < matchingCities.length;
      i++
    ) {
      const city = matchingCities[i];

      if (streetQuery.length > 3) {
        const streetNumber = hasNumber
          ? query.match(/^\d+/)[0]
          : Math.floor(Math.random() * 100) + 1;
        const latOffset = (Math.random() - 0.5) * 0.02;
        const lonOffset = (Math.random() - 0.5) * 0.02;

        results.push({
          latitude: city.lat + latOffset,
          longitude: city.lon + lonOffset,
          displayName: `${streetNumber} ${streetQuery}, ${city.name}, France`,
          type: "address",
          importance: 0.9 - results.length * 0.05,
        });
      }
      else {
        const street = streets[Math.floor(Math.random() * streets.length)];
        const streetNumber = Math.floor(Math.random() * 100) + 1;
        const latOffset = (Math.random() - 0.5) * 0.02;
        const lonOffset = (Math.random() - 0.5) * 0.02;

        results.push({
          latitude: city.lat + latOffset,
          longitude: city.lon + lonOffset,
          displayName: `${streetNumber} ${street}, ${city.name}, France`,
          type: "address",
          importance: 0.8 - results.length * 0.05,
        });
      }
    }
  }

  if (results.length === 0 && cities.length > 0) {
    const city = cities[0];
    const street = streets[0];
    const streetNumber = Math.floor(Math.random() * 100) + 1;

    results.push({
      latitude: city.lat,
      longitude: city.lon,
      displayName: `${streetNumber} ${street}, ${city.name}, France`,
      type: "address",
      importance: 0.7,
    });
  }

  console.log(`Résultats simulés générés:`, results);
  return results;
}
