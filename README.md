# 🏍️ RideFlow - GPS intelligent pour motards

RideFlow est une application web dédiée aux motards, qui calcule le meilleur itinéraire en tenant compte des spécificités de la route et des dangers en temps réel. Contrairement aux GPS classiques, il ne se contente pas de donner le chemin le plus rapide : il privilégie les routes adaptées aux motos et informe des risques pour une conduite plus sûre.

## 🔹 Fonctionnalités

- ✅ **Itinéraires optimisés** : choix entre routes rapides ou sinueuses
- ✅ **Radars fixes et mobiles** affichés sur la carte
- ✅ **Accidents et bouchons signalés en temps réel**
- ✅ **Conditions météo actuelles et prévisions sur votre trajet**
- ✅ **Affichage dynamique sur une carte interactive**

## 🛠️ Technologies et APIs

### Stack technique

- **Frontend** : Next.js + Tailwind CSS
- **Carte interactive** : Leaflet.js avec OpenStreetMap
- **Gestion des états** : Zustand
- **Requêtes HTTP** : Axios

### APIs utilisées

1. **OpenRouteService** – Calcul des itinéraires avec option "sinueux"
2. **HERE Maps API** – Infos trafic et accidents
3. **OpenWeatherMap** – Conditions météo et alertes
4. **Overpass API (OSM)** – Points d'intérêt pour motards (stations, garages...)

## 🚀 Installation

```bash
# Cloner le dépôt
git clone https://github.com/votre-utilisateur/rideflow.git
cd rideflow

# Installer les dépendances
npm install

# Configurer les clés API
# Modifiez le fichier src/utils/apiConfig.js avec vos propres clés API

# Lancer le serveur de développement
npm run dev
```

## 📋 Configuration des APIs

Pour utiliser RideFlow, vous devez obtenir des clés API pour les services suivants :

1. **OpenRouteService** : [S'inscrire](https://openrouteservice.org/dev/#/signup)
2. **HERE Maps API** : [S'inscrire](https://developer.here.com/sign-up)
3. **OpenWeatherMap** : [S'inscrire](https://openweathermap.org/api)

Une fois vos clés obtenues, modifiez le fichier `src/utils/apiConfig.js` :

```javascript
export const API_KEYS = {
  OPENROUTE_SERVICE: "VOTRE_CLÉ_OPENROUTESERVICE",
  HERE_API: "VOTRE_CLÉ_HERE",
  OPENWEATHER_MAP: "VOTRE_CLÉ_OPENWEATHERMAP",
};
```

## 🔥 Avantages du projet

- Utile pour les motards 🏍️
- Utilise plusieurs APIs intéressantes 📡
- Techniquement challengeant mais réalisable 💡
- Design simple mais efficace

## 📱 Captures d'écran

(À venir)

## 📜 Licence

MIT

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou à soumettre une pull request.
