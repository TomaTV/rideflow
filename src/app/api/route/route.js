import { NextResponse } from 'next/server';
import { API_KEYS, API_ENDPOINTS, ROUTE_PROFILES } from '@/utils/apiConfig';

export async function POST(request) {
  try {
    const { startCoords, endCoords, routeType = 'FAST' } = await request.json();
    
    if (!startCoords || !endCoords) {
      return NextResponse.json(
        { error: 'Les coordonnées de départ et d\'arrivée sont requises' },
        { status: 400 }
      );
    }
    
    // Vérifier que la clé API est disponible
    if (!API_KEYS.OPENROUTE_SERVICE) {
      console.error('Erreur: Clé API OpenRouteService manquante. Vérifiez votre fichier .env.local');
      return NextResponse.json(
        { error: 'Configuration API manquante' },
        { status: 500 }
      );
    }
    
    const profile = ROUTE_PROFILES[routeType];
    console.log(`Calcul d'itinéraire ${routeType} de [${startCoords}] à [${endCoords}]`);
    
    // Construire le corps de la requête
    const requestBody = {
      coordinates: [startCoords, endCoords],
      preference: profile.preference,
      format: 'geojson',
      instructions: true,
      units: 'km'
    };
    
    // Ajouter les options spécifiques au profil si elles existent
    if (profile.options) {
      Object.assign(requestBody, profile.options);
    }
    
    console.log('URL de la requête:', `${API_ENDPOINTS.ORS_DIRECTIONS}/${profile.profile}`);
    console.log('Params de la requête:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(
      `${API_ENDPOINTS.ORS_DIRECTIONS}/${profile.profile}`,
      {
        method: 'POST',
        headers: {
          'Authorization': API_KEYS.OPENROUTE_SERVICE,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Erreur API OpenRouteService: ${response.status}`, errorText);
      
      // Essayer avec un profil alternatif si la requête échoue
      // Quelle que soit la raison de l'échec ou le type d'itinéraire
      console.log('Tentative avec un profil alternatif générique');
      
      try {
        const alternativeResponse = await fetch(
          `${API_ENDPOINTS.ORS_DIRECTIONS}/driving-car`,
          {
            method: 'POST',
            headers: {
              'Authorization': API_KEYS.OPENROUTE_SERVICE,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              coordinates: [startCoords, endCoords],
              preference: routeType === 'CURVY' ? 'shortest' : 'fastest',
              format: 'geojson',
              instructions: true,
              units: 'km'
            })
          }
        );
        
        if (!alternativeResponse.ok) {
          const altErrorText = await alternativeResponse.text();
          console.error(`Échec du profil alternatif: ${alternativeResponse.status}`, altErrorText);
          throw new Error(`OpenRouteService API error: ${response.status} ${errorText}`);
        }
        
        const alternativeData = await alternativeResponse.json();
        console.log('Succès avec le profil alternatif');
        return NextResponse.json(alternativeData);
      } catch (fallbackError) {
        console.error('Erreur avec le profil alternatif:', fallbackError);
        throw new Error(`OpenRouteService API error: ${response.status} ${errorText}`);
      }
    }
    
    const data = await response.json();
    console.log('Réponse API reçue avec succès');
    
    // Ne pas transformer le format, renvoyer tel quel pour que le client puisse décoder
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur lors du calcul d\'itinéraire:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors du calcul d\'itinéraire' },
      { status: 500 }
    );
  }
}
