import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const west = searchParams.get('west');
    const south = searchParams.get('south');
    const east = searchParams.get('east');
    const north = searchParams.get('north');
    
    if (!west || !south || !east || !north) {
      return NextResponse.json(
        { error: 'Tous les paramètres de bounding box sont requis (west, south, east, north)' },
        { status: 400 }
      );
    }
    
    // Pour le moment, comme l'API externe ne fonctionne pas, retournons des données de test
    // Plus tard, vous pourrez remplacer cela par une véritable API ou votre propre base de données
    const mockRadars = generateMockRadars(
      parseFloat(south), 
      parseFloat(west), 
      parseFloat(north), 
      parseFloat(east)
    );
    
    return NextResponse.json({ radars: mockRadars });
  } catch (error) {
    console.error('Erreur lors de la récupération des radars:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la récupération des radars' },
      { status: 500 }
    );
  }
}

// Fonction pour générer des données de test pour les radars
function generateMockRadars(south, west, north, east) {
  const numRadars = Math.floor(Math.random() * 5) + 3; // 3-7 radars
  const radars = [];
  
  const latSpan = north - south;
  const lngSpan = east - west;
  
  const types = ['Fixe', 'Mobile', 'Feu rouge', 'Tronçon'];
  const speeds = [30, 50, 70, 90, 110, 130];
  
  for (let i = 0; i < numRadars; i++) {
    const lat = south + Math.random() * latSpan;
    const lng = west + Math.random() * lngSpan;
    const type = types[Math.floor(Math.random() * types.length)];
    const speed = speeds[Math.floor(Math.random() * speeds.length)];
    
    radars.push({
      id: `radar-${i}`,
      lat,
      lng,
      type,
      speed
    });
  }
  
  return radars;
}
