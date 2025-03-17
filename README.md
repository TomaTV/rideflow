# RideFlow 🏍️

![RideFlow Banner](/public/Banner.png)
🚀 *L'itinéraire moto intelligent : routes sinueuses, dangers en temps réel et météo intégrée !*

---

## 📌 Description
RideFlow est une application web conçue pour les motards, offrant le **meilleur itinéraire moto** en prenant en compte :
- **Routes sinueuses ou rapides**, selon la préférence du motard 🛣️
- **Radars fixes** 🚨
- **Accidents signalés et bouchons en temps réel** ⚠️
- **Conditions météo sur tout le trajet** ☀️🌧️
- **Points d’intérêt moto** : stations essence, garages 🏍️⛽

💡 *Fini les trajets ennuyeux et dangereux, RideFlow t'accompagne en toute sécurité !*

---

## 🚀 Fonctionnalités principales
✅ Calcul d'itinéraire intelligent (rapide ou sinueux)  
✅ Affichage des **radars**, **accidents** et **bouchons**  
✅ Carte interactive avec les détails de l’itinéraire  
✅ Météo **en direct sur tout le trajet**  
✅ Points d'intérêt : **stations essence, garages**  
✅ Instructions du trajet

---

## 🛠️ Technologies utilisées

- **Frontend** : Next.js + Tailwind CSS ⚡
- **Carte interactive** : Leaflet.js 🗺️
- **Gestion des états** : Zustand

### 🌍 APIs utilisées
- **OpenRouteService** → Calcul des itinéraires 🛣️
- **TomTom Traffic** → Radars (data gouv), accidents, bouchons 🚦
- **OpenWeatherMap** → Conditions météo 🌦️
- **Overpass API (OSM)** → Points d’intérêt (stations essence, garages) ⛽

---

## 🔧 Installation & Exécution

```sh
# 1️⃣ Clone le repo
git clone https://github.com/TomaTV/RideFlow.git
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

## 📩 Contribuer
Tu veux améliorer RideFlow ? Fork le projet, propose tes améliorations et ouvre une PR ! Toutes les suggestions sont les bienvenues. 🚀

```sh
# Fork et clone le repo
# Crée une branche feature
# Push et ouvre une Pull Request
```

---

## ⚠️ Utilisation personnelle uniquement

- 🚨 Ce projet est à des fins personnelles et ne doit en aucun cas être utilisé par le grand public.
- 🚫 Les données affichées (radars, trafic, météo) ne sont pas garanties comme étant exactes et ne doivent pas être utilisées pour la conduite.
- 💡 RideFlow est un projet expérimental et n'est pas destiné à une diffusion publique.

---

## 📜 Licence
RideFlow est sous licence MIT. Tu peux l'utiliser librement en respectant les conditions de la licence.

---

🚀 **RideFlow – Conçu par et pour les motards** 🏍️🔥
