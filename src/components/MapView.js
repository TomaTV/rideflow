"use client";

import { useEffect, useState, useRef } from "react";
import useRideFlowStore from "@/utils/store";
import { MAP_CONFIG } from "@/utils/apiConfig";
import MapLegend from "@/components/MapLegend";
import "leaflet/dist/leaflet.css";
import { decode } from "@mapbox/polyline";

export default function MapView({ onLoad }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const routeLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const incidentsLayerRef = useRef(null);
  const radarsLayerRef = useRef(null);
  const poisLayerRef = useRef(null);
  const {
    map,
    route,
    mapData,
    userSettings,
    setMapBounds,
    toggleSetting,
    handleMapClick,
  } = useRideFlowStore();

  useEffect(() => {
    const resetCursor = () => {
      if (!userSettings.pointPlacementMode && mapRef.current) {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.style.cursor = 'grab';
            console.log("Curseur réinitialisé par le gestionnaire global");
          }
        }, 10);
      }
    };

    const unsubscribe = useRideFlowStore.subscribe(
      (state) => state.userSettings.pointPlacementMode,
      (pointPlacementMode) => {
        if (!pointPlacementMode) resetCursor();
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let L;

    const loadLeaflet = async () => {
      try {
        L = (await import("leaflet")).default;

        if (!mapRef.current || mapInstanceRef.current) return;

        const instance = L.map(mapRef.current, {
          center: MAP_CONFIG.defaultCenter,
          zoom: MAP_CONFIG.defaultZoom,
          zoomControl: false,
          attributionControl: true,
          scrollWheelZoom: true,
          dragging: true,
          doubleClickZoom: false,
          boxZoom: true,
        });

        L.tileLayer(MAP_CONFIG.tileLayer.url, {
          attribution: MAP_CONFIG.tileLayer.attribution,
          maxZoom: 19,
          tileSize: 512,
          zoomOffset: -1,
        }).addTo(instance);

        routeLayerRef.current = L.layerGroup().addTo(instance);
        markersLayerRef.current = L.layerGroup().addTo(instance);
        incidentsLayerRef.current = L.layerGroup().addTo(instance);
        radarsLayerRef.current = L.layerGroup().addTo(instance);
        poisLayerRef.current = L.layerGroup().addTo(instance);

        mapInstanceRef.current = instance;

        if (onLoad) onLoad();

        instance.on("moveend", () => {
          const bounds = instance.getBounds();
          setMapBounds([
            bounds.getWest(), // minLon
            bounds.getSouth(), // minLat
            bounds.getEast(), // maxLon
            bounds.getNorth(), // maxLat
          ]);
        });

        instance.on("click", async (e) => {
          const result = await handleMapClick(e.latlng);

          if (result && mapRef.current) {
            const state = useRideFlowStore.getState();
            const isSelectingStart = state.isSelectingStartPoint;

            const cursorStyle = isSelectingStart
              ? 'url("/cursor-start.svg"), crosshair'
              : 'url("/cursor-end.svg"), pointer';
            
            mapRef.current.style.cursor = cursorStyle;
            console.log("Curseur mis à jour manuellement après clic, maintenant:", 
              isSelectingStart ? "Point de départ" : "Point d'arrivée");
          }
        });

        instance.fire("moveend");
      } catch (error) {
        console.error("Erreur lors de l'initialisation de la carte:", error);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const updateRoute = async () => {
      if (!mapInstanceRef.current || !routeLayerRef.current) return;

      const L = (await import("leaflet")).default;

      routeLayerRef.current.clearLayers();

      if (!route.routeData) return;

      try {
        console.log("Données d'itinéraire reçues:", route.routeData);

        const routeStyle =
          route.routeType === "FAST"
            ? MAP_CONFIG.routeStyle.fast
            : MAP_CONFIG.routeStyle.curvy;

        let routeLayer = null;

        if (route.routeData.type && route.routeData.features) {
          routeLayer = L.geoJSON(route.routeData, {
            style: routeStyle,
          });
        } else if (
          route.routeData.type === "Feature" &&
          route.routeData.geometry
        ) {
          routeLayer = L.geoJSON(route.routeData, {
            style: routeStyle,
          });
        } else if (route.routeData.routes && route.routeData.routes[0]) {
          const routeInfo = route.routeData.routes[0];

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
          else if (typeof routeInfo.geometry === "string") {
            try {
              const decodedCoordinates = decode(routeInfo.geometry);

              const latlngs = decodedCoordinates.map((coord) => [
                coord[0],
                coord[1],
              ]);

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

        routeLayer.addTo(routeLayerRef.current);

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

  useEffect(() => {
    const updateMarkers = async () => {
      if (!mapInstanceRef.current || !markersLayerRef.current) return;

      const L = (await import("leaflet")).default;

      markersLayerRef.current.clearLayers();

      const startIcon = L.divIcon({
        className: "custom-marker-icon",
        html: `<div class="w-8 h-8 bg-[#FF6A00] rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white transform transition-transform hover:scale-110">A</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const endIcon = L.divIcon({
        className: "custom-marker-icon",
        html: `<div class="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg border-2 border-white transform transition-transform hover:scale-110">B</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

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

  useEffect(() => {
    const updateIncidents = async () => {
      if (!mapInstanceRef.current || !incidentsLayerRef.current) return;

      const L = (await import("leaflet")).default;

      incidentsLayerRef.current.clearLayers();

      if (!userSettings.showIncidents || !mapData.incidents.length) return;

      const incidentIcon = L.divIcon({
        className: "custom-incident-icon",
        html: '<div class="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center text-white">⚠️</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      mapData.incidents.forEach((incident) => {
        try {
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

  useEffect(() => {
    const updateRadars = async () => {
      if (!mapInstanceRef.current || !radarsLayerRef.current) return;

      const L = (await import("leaflet")).default;

      radarsLayerRef.current.clearLayers();

      if (!userSettings.showRadars || !mapData.radars.length) return;

      const radarIcon = L.divIcon({
        className: "custom-radar-icon",
        html: '<div class="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white">📷</div>',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

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

  useEffect(() => {
    const updatePOIs = async () => {
      if (!mapInstanceRef.current || !poisLayerRef.current) return;

      const L = (await import("leaflet")).default;

      poisLayerRef.current.clearLayers();

      if (!userSettings.showPOIs || !mapData.pois.length) return;

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

      mapData.pois.forEach((poi) => {
        try {
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

  useEffect(() => {
    if (!mapRef.current) return;
    
    if (userSettings.pointPlacementMode) {
      const state = useRideFlowStore.getState();
      const isSelectingStart = state.isSelectingStartPoint;

      const cursorStyle = isSelectingStart
        ? 'url("/cursor-start.svg"), crosshair'
        : 'url("/cursor-end.svg"), pointer';
      mapRef.current.style.cursor = cursorStyle;
      
      console.log("Mode de sélection actif, curseur:", 
        isSelectingStart ? "Point de départ" : "Point d'arrivée");
    } else {
      mapRef.current.style.cursor = 'grab';
      console.log("Mode de sélection désactivé, curseur normal.");
    }
  }, [userSettings.pointPlacementMode, userSettings.darkMode]);
  
  const [debugMode, setDebugMode] = useState({
    isSelectingStart: true,
    lastUpdated: new Date().toISOString()
  });
  
  useEffect(() => {
    const checkInterval = setInterval(() => {
      const state = useRideFlowStore.getState();
      setDebugMode({
        isSelectingStart: state.isSelectingStartPoint,
        lastUpdated: new Date().toISOString()
      });
    }, 500);
    
    return () => clearInterval(checkInterval);
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const updateDarkMode = async () => {
      const L = (await import("leaflet")).default;

      const tileConfig = userSettings.darkMode
        ? MAP_CONFIG.darkModeTileLayer
        : MAP_CONFIG.tileLayer;

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

      const rootElement = document.documentElement;
      if (userSettings.darkMode) {
        rootElement.classList.add("dark-map-popups");
      } else {
        rootElement.classList.remove("dark-map-popups");
      }
    };

    updateDarkMode();
  }, [userSettings.darkMode]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full relative overflow-hidden"
      style={{ zIndex: 0, height: "100vh" }}
    >

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

      <div className="absolute bottom-4 right-4 z-999">
        <MapLegend userSettings={userSettings} toggleSetting={toggleSetting} />
      </div>
      
      {userSettings.pointPlacementMode && (
        <div className="absolute top-20 left-4 bg-white/80 p-2 rounded shadow z-50">
          <div className="text-xs font-mono">
            <div>Mode: {debugMode.isSelectingStart ? "Point A (départ)" : "Point B (arrivée)"}</div>
            <div className="text-gray-500 text-[10px]">{debugMode.lastUpdated}</div>
          </div>
        </div>
      )}
    </div>
  );
}
