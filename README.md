# RideFlow 🏍️

![RideFlow Banner](./assets/banner.png)

![RideFlow Logo](./assets/logo.png)  
🚀 *L'itinéraire moto intelligent : routes sinueuses, dangers en temps réel et météo intégrée !*

---

## 📌 Description
RideFlow est une application web conçue pour les motards, offrant le **meilleur itinéraire moto** en prenant en compte :
- **Routes sinueuses ou rapides**, selon la préférence du motard 🛣️
- **Radars fixes et mobiles** 🚨
- **Accidents signalés et bouchons en temps réel** ⚠️
- **Conditions météo sur tout le trajet** ☀️🌧️
- **Points d’intérêt moto** : stations essence, garages 🏍️⛽

💡 *Fini les trajets ennuyeux et dangereux, RideFlow t'accompagne en toute sécurité !*

---

## 🚀 Fonctionnalités principales
✅ Calcul d'itinéraire intelligent (rapide ou sinueux)  
✅ Affichage des **radars**, **accidents**, et bientôt **bouchons**  
✅ Carte interactive avec les détails de l’itinéraire  
✅ Météo **en direct sur tout le trajet**  
✅ Points d'intérêt : **stations essence, garages**  

---

## 🛠️ Technologies utilisées

- **Frontend** : Next.js + Tailwind CSS ⚡
- **Carte interactive** : Mapbox ou Leaflet.js 🗺️
- **Gestion des états** : Zustand/Redux

### 🌍 APIs utilisées
- **OpenRouteService** → Calcul des itinéraires 🛣️
- **TomTom Traffic** → Radars, accidents, bouchons 🚦
- **Waze API** → Signalements en temps réel 🚗
- **OpenWeatherMap** → Conditions météo 🌦️
- **Overpass API (OSM)** → Points d’intérêt (stations essence, garages) ⛽

---

## 🔧 Installation & Exécution

```sh
# 1️⃣ Clone le repo
git clone https://github.com/TonPseudo/RideFlow.git
cd RideFlow

# 2️⃣ Installe les dépendances
npm install

# 3️⃣ Configure les variables d'environnement
# Crée un fichier .env à la racine et ajoute tes clés API
cp .env.example .env

# 4️⃣ Lance l'application
npm run dev
```

L'application sera disponible sur `http://localhost:3000` 🚀

---

## 🎯 Roadmap & Améliorations
🔲 Ajout des bouchons en temps réel  
🔲 Conseils météo plus précis  
🔲 Optimisation des requêtes API  
🔲 Ajout d’une version mobile-friendly  

---

## 📩 Contribuer
Tu veux améliorer RideFlow ? Fork le projet, propose tes améliorations et ouvre une PR ! Toutes les suggestions sont les bienvenues. 🚀

```sh
# Fork et clone le repo
# Crée une branche feature
# Push et ouvre une Pull Request
```

---

## 📜 Licence
RideFlow est sous licence MIT. Tu peux l'utiliser librement en respectant les conditions de la licence.

---

🚀 **RideFlow – Conçu par et pour les motards** 🏍️🔥
