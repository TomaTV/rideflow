"use client";

import { useEffect, useRef } from "react";
import useRideFlowStore from "@/utils/store";
import { MAP_CONFIG } from "@/utils/apiConfig";
import MapLegend from "@/components/MapLegend";
import "leaflet/dist/leaflet.css";
// Importation pour décoder les polylines
import { decode } from "@mapbox/polyline";

export default function MapView({ onLoad }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const incidentsLayerRef = useRef(null);
  const radarsLayerRef = useRef(null);
  const poisLayerRef = useRef(null);

  const { map, route, mapData, userSettings, setMapBounds, toggleSetting } =
    useRideFlowStore();

  // Initialisation de la carte
  useEffect(() => {
    let L;

    // Chargement dynamique de Leaflet (côté client uniquement)
    const loadLeaflet = async () => {
      try {
        // Importer dynamiquement Leaflet
        L = (await import("leaflet")).default;

        // S'assurer que l'élément DOM existe et que la carte n'est pas déjà initialisée
        if (!mapRef.current || mapInstanceRef.current) return;

        // Créer la carte
        const instance = L.map(mapRef.current, {
          center: MAP_CONFIG.defaultCenter,
          zoom: MAP_CONFIG.defaultZoom,
          zoomControl: true,
          attributionControl: true,
          scrollWheelZoom: true,
          dragging: true,
          doubleClickZoom: true,
          boxZoom: true,
        });

        // Ajouter le fond de carte MapTiler Basic
        L.tileLayer(MAP_CONFIG.tileLayer.url, {
          attribution: MAP_CONFIG.tileLayer.attribution,
          maxZoom: 19,
          tileSize: 512,
          zoomOffset: -1,
        }).addTo(instance);

        // Initialiser les groupes de couches pour les différents éléments
        routeLayerRef.current = L.layerGroup().addTo(instance);
        markersLayerRef.current = L.layerGroup().addTo(instance);
        incidentsLayerRef.current = L.layerGroup().addTo(instance);
        radarsLayerRef.current = L.layerGroup().addTo(instance);
        poisLayerRef.current = L.layerGroup().addTo(instance);

        // Stocker l'instance de la carte
        mapInstanceRef.current = instance;

        // Informer le parent que la carte est chargée
        if (onLoad) onLoad();

        // Événement de changement de vue pour mettre à jour les bounds
        instance.on("moveend", () => {
          const bounds = instance.getBounds();
          setMapBounds([
            bounds.getWest(), // minLon
            bounds.getSouth(), // minLat
            bounds.getEast(), // maxLon
            bounds.getNorth(), // maxLat
          ]);
        });

        // Déclencher l'événement moveend au démarrage pour initialiser les bounds
        instance.fire("moveend");
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la carte:", error);
      }
    };

    loadLeaflet();

    // Nettoyage à la suppression du composant
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Mise à jour de l'itinéraire sur la carte
  useEffect(() => {
    const updateRoute = async () => {
      if (!mapInstanceRef.current || !routeLayerRef.current) return;

      // Importer dynamiquement Leaflet
      const L = (await import("leaflet")).default;

      // Effacer l'ancien itinéraire
      routeLayerRef.current.clearLayers();

      // Si pas de données d'itinéraire, ne rien faire
      if (!route.routeData) return;

      try {
        console.log("Données d'itinéraire reçues:", route.routeData);

        // Créer une couche GeoJSON pour l'itinéraire
        const routeStyle =
          route.routeType === "FAST"
            ? MAP_CONFIG.routeStyle.fast
            : MAP_CONFIG.routeStyle.curvy;

        let routeLayer = null;

        // Traiter les différents formats possibles
        if (route.routeData.type && route.routeData.features) {
          // Format GeoJSON FeatureCollection standard
          routeLayer = L.geoJSON(route.routeData, {
            style: routeStyle,
          });
        } else if (
          route.routeData.type === "Feature" &&
          route.routeData.geometry
        ) {
          // Format GeoJSON Feature simple
          routeLayer = L.geoJSON(route.routeData, {
            style: routeStyle,
          });
        } else if (route.routeData.routes && route.routeData.routes[0]) {
          const routeInfo = route.routeData.routes[0];

          // Vérifier si la géométrie est déjà au format GeoJSON
          if (
            routeInfo.geometry &&
            routeInfo.geometry.type === "LineString" &&
            Array.isArray(routeInfo.geometry.coordinates)
          ) {
            const geoJson = {
              type: "Feature",
              properties: {
                summary: routeInfo.summary,
              },
              geometry: routeInfo.geometry,
            };

            routeLayer = L.geoJSON(geoJson, {
              style: routeStyle,
            });
          }
          // Vérifier si c'est une polyline encodée (format typique d'OpenRouteService)
          else if (typeof routeInfo.geometry === "string") {
            try {
              // Décoder la polyline en coordonnées
              const decodedCoordinates = decode(routeInfo.geometry);

              // Transformer les coordonnées au format attendu par Leaflet (inversion lat/lng)
              const latlngs = decodedCoordinates.map((coord) => [
                coord[0],
                coord[1],
              ]);

              // Créer une polyline Leaflet
              routeLayer = L.polyline(latlngs, routeStyle);
            } catch (e) {
              console.error("Erreur lors du décodage de la polyline:", e);
            }
          }
        }

        if (!routeLayer) {
          console.error(
            "Format de données d'itinéraire non reconnu ou invalide:",
            route.routeData
          );
          return;
        }

        // Ajouter à la couche d'itinéraire
        routeLayer.addTo(routeLayerRef.current);

        // Ajuster la vue pour voir tout l'itinéraire avec un délai pour s'assurer que la couche est prête
        setTimeout(() => {
          try {
            if (routeLayer.getBounds) {
              mapInstanceRef.current.fitBounds(routeLayer.getBounds(), {
                padding: [50, 50],
              });
            }
          } catch (e) {
            console.error("Erreur lors de l'ajustement de la vue:", e);
          }
        }, 300);
      } catch (error) {
        console.error("Erreur lors de l'affichage de l'itinéraire:", error);
      }
    };

    updateRoute();
  }, [route.routeData, route.routeType]);

  // Mise à jour des marqueurs de départ et d'arrivée
  useEffect(() => {
    const updateMarkers = async () => {
      if (!mapInstanceRef.current || !markersLayerRef.current) return;

      // Importer dynamiquement Leaflet
      const L = (await import("leaflet")).default;

      // Effacer les anciens marqueurs
      markersLayerRef.current.clearLayers();

      // Créer icône de départ (verte)
      const startIcon = L.divIcon({
        className: "custom-marker-icon",
        html: `<div class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white transform transition-transform hover:scale-110">A</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      // Créer icône d'arrivée (rouge)
      const endIcon = L.divIcon({
        className: "custom-marker-icon",
        html: `<div class="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white transform transition-transform hover:scale-110">B</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      // Ajouter marqueur de départ si défini
      if (route.start) {
        L.marker([route.start.latitude, route.start.longitude], {
          icon: startIcon,
        })
          .bindPopup(
            `
          <div class="p-2">
            <h3 class="font-bold text-green-600 mb-1">Point de départ</h3>
            <p class="text-sm text-gray-700">${route.start.displayName}</p>
          </div>
        `,
            {
              className: "custom-popup",
              maxWidth: 300,
            }
          )
          .addTo(markersLayerRef.current);
      }

      // Ajouter marqueur d'arrivée si défini
      if (route.end) {
        L.marker([route.end.latitude, route.end.longitude], { icon: endIcon })
          .bindPopup(
            `
          <div class="p-2">
            <h3 class="font-bold text-red-600 mb-1">Point d'arrivée</h3>
            <p class="text-sm text-gray-700">${route.end.displayName}</p>
          </div>
        `,
            {
              className: "custom-popup",
              maxWidth: 300,
            }
          )
          .addTo(markersLayerRef.current);
      }
    };

    updateMarkers();
  }, [route.start, route.end]);

  // Mise à jour des incidents sur la carte
  useEffect(() => {
    const updateIncidents = async () => {
      if (!mapInstanceRef.current || !incidentsLayerRef.current) return;

      // Importer dynamiquement Leaflet
      const L = (await import("leaflet")).default;

      // Effacer les incidents précédents
      incidentsLayerRef.current.clearLayers();

      // Ne rien faire si les incidents sont désactivés
      if (!userSettings.showIncidents || !mapData.incidents.length) return;

      // Icône pour les incidents
      const incidentIcon = L.divIcon({
        className: "custom-incident-icon",
        html: '<div class="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white">⚠️</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Ajouter chaque incident sur la carte
      mapData.incidents.forEach((incident) => {
        try {
          // Adapter selon le format spécifique de HERE Maps
          const coords = incident.LOCATION.GEOLOC.COORDINATES;
          const lat = coords.LATITUDE;
          const lng = coords.LONGITUDE;
          const description =
            incident.TRAFFIC_ITEM_DESCRIPTION?.value || "Incident de trafic";

          L.marker([lat, lng], { icon: incidentIcon })
            .bindPopup(`<strong>${description}</strong>`)
            .addTo(incidentsLayerRef.current);
        } catch (error) {
          console.warn("Erreur avec un incident:", error);
        }
      });
    };

    updateIncidents();
  }, [mapData.incidents, userSettings.showIncidents]);

  // Mise à jour des radars sur la carte
  useEffect(() => {
    const updateRadars = async () => {
      if (!mapInstanceRef.current || !radarsLayerRef.current) return;

      // Importer dynamiquement Leaflet
      const L = (await import("leaflet")).default;

      // Effacer les radars précédents
      radarsLayerRef.current.clearLayers();

      // Ne rien faire si les radars sont désactivés
      if (!userSettings.showRadars || !mapData.radars.length) return;

      // Icône pour les radars
      const radarIcon = L.divIcon({
        className: "custom-radar-icon",
        html: '<div class="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white">📷</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      // Ajouter chaque radar sur la carte
      mapData.radars.forEach((radar) => {
        try {
          const lat = radar.lat;
          const lng = radar.lng;
          const type = radar.type || "Radar";
          const speed = radar.speed
            ? `${radar.speed} km/h`
            : "Vitesse inconnue";

          L.marker([lat, lng], { icon: radarIcon })
            .bindPopup(`<strong>${type}</strong><br>Limitation: ${speed}`)
            .addTo(radarsLayerRef.current);
        } catch (error) {
          console.warn("Erreur avec un radar:", error);
        }
      });
    };

    updateRadars();
  }, [mapData.radars, userSettings.showRadars]);

  // Mise à jour des POIs sur la carte
  useEffect(() => {
    const updatePOIs = async () => {
      if (!mapInstanceRef.current || !poisLayerRef.current) return;

      // Importer dynamiquement Leaflet
      const L = (await import("leaflet")).default;

      // Effacer les POIs précédents
      poisLayerRef.current.clearLayers();

      // Ne rien faire si les POIs sont désactivés
      if (!userSettings.showPOIs || !mapData.pois.length) return;

      // Fonction pour obtenir l'icône en fonction du type de POI
      const getPoiIcon = (tags) => {
        let iconHtml = "";

        if (tags.amenity === "fuel") {
          iconHtml =
            '<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">⛽</div>';
        } else if (
          tags.shop === "motorcycle" ||
          tags.shop === "motorcycle_repair"
        ) {
          iconHtml =
            '<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">🔧</div>';
        } else if (tags.amenity === "parking" && tags.motorcycle === "yes") {
          iconHtml =
            '<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">🅿️</div>';
        } else if (tags.amenity === "restaurant" || tags.amenity === "cafe") {
          iconHtml =
            '<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">🍴</div>';
        } else {
          iconHtml =
            '<div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white">📍</div>';
        }

        return L.divIcon({
          className: "custom-poi-icon",
          html: iconHtml,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
      };

      // Ajouter chaque POI sur la carte
      mapData.pois.forEach((poi) => {
        try {
          // Format spécifique d'Overpass API
          const lat = poi.lat;
          const lng = poi.lon;
          const tags = poi.tags || {};
          const name = tags.name || getPoiType(tags);

          L.marker([lat, lng], { icon: getPoiIcon(tags) })
            .bindPopup(`<strong>${name}</strong><br>${getPoiType(tags)}`)
            .addTo(poisLayerRef.current);
        } catch (error) {
          console.warn("Erreur avec un POI:", error);
        }
      });
    };

    // Fonction pour obtenir le type de POI à partir des tags
    const getPoiType = (tags) => {
      if (tags.amenity === "fuel") return "Station-service";
      if (tags.shop === "motorcycle") return "Magasin moto";
      if (tags.shop === "motorcycle_repair") return "Réparation moto";
      if (tags.amenity === "parking" && tags.motorcycle === "yes")
        return "Parking moto";
      if (tags.amenity === "restaurant") return "Restaurant";
      if (tags.amenity === "cafe") return "Café";
      return "Point d'intérêt";
    };

    updatePOIs();
  }, [mapData.pois, userSettings.showPOIs]);

  // Gestion du mode sombre
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateDarkMode = async () => {
      // Importer dynamiquement Leaflet
      const L = (await import("leaflet")).default;

      // Utiliser le tileset MapTiler en fonction du mode
      const tileConfig = userSettings.darkMode
        ? MAP_CONFIG.darkModeTileLayer
        : MAP_CONFIG.tileLayer;

      // Supprimer l'ancien tileset et ajouter le nouveau
      mapInstanceRef.current.eachLayer((layer) => {
        if (layer instanceof L.TileLayer) {
          mapInstanceRef.current.removeLayer(layer);
        }
      });

      L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        maxZoom: 19,
        tileSize: 512,
        zoomOffset: -1,
      }).addTo(mapInstanceRef.current);
    };

    updateDarkMode();
  }, [userSettings.darkMode]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full relative overflow-hidden"
      style={{ zIndex: 0, height: "100vh" }}
    >
      {/* Superposition pour le chargement */}
      {(route.isLoading ||
        mapData.isLoading.incidents ||
        mapData.isLoading.radars ||
        mapData.isLoading.pois) && (
        <div className="absolute inset-0 bg-black bg-opacity-25 flex items-center justify-center z-10">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg">
            <p className="text-center">Chargement des données...</p>
          </div>
        </div>
      )}

      {/* Légendes */}
      <div className="absolute bottom-4 right-4 z-999">
        <MapLegend userSettings={userSettings} toggleSetting={toggleSetting} />
      </div>
    </div>
  );
}
