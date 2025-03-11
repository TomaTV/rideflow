import { useState, useEffect, useRef, useCallback } from "react";
import useRideFlowStore from "@/utils/store";
import image from 'next/image'

export default function RoutePanel() {
  const { route, setRouteStart, setRouteEnd, setRouteType, calculateRoute } =
    useRideFlowStore();

  const [startAddress, setStartAddress] = useState("");
  const [endAddress, setEndAddress] = useState("");
  const [isAddressSearching, setIsAddressSearching] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [startSuggestions, setStartSuggestions] = useState([]);
  const [endSuggestions, setEndSuggestions] = useState([]);
  const [showStartSuggestions, setShowStartSuggestions] = useState(false);
  const [showEndSuggestions, setShowEndSuggestions] = useState(false);
  const [manualEntryMode, setManualEntryMode] = useState(false); // Mode saisie manuelle

  // Refs pour les timeouts de debounce
  const startDebounceTimerRef = useRef(null);
  const endDebounceTimerRef = useRef(null);

  // Fonction pour créer manuellement un point à partir d'une adresse saisie
  const createManualLocation = (address, isStart) => {
    console.log(`Création manuelle d'un point pour: ${address}`);

    // Coordonnées approximatives de la France
    let lat = 46.603354;
    let lon = 1.888334;

    // Vérifier pour quelques grandes villes
    const lowerAddress = address.toLowerCase();
    if (lowerAddress.includes("paris")) {
      lat = 48.8566;
      lon = 2.3522;
    } else if (lowerAddress.includes("lyon")) {
      lat = 45.7578;
      lon = 4.832;
    } else if (lowerAddress.includes("marseille")) {
      lat = 43.2965;
      lon = 5.3698;
    } else if (lowerAddress.includes("bordeaux")) {
      lat = 44.8378;
      lon = -0.5792;
    } else if (lowerAddress.includes("lille")) {
      lat = 50.6292;
      lon = 3.0573;
    }

    const customLocation = {
      latitude: lat,
      longitude: lon,
      displayName: address,
      type: "manual_address",
    };

    if (isStart) {
      setRouteStart(customLocation);
    } else {
      setRouteEnd(customLocation);
    }

    console.log(`Point créé manuellement:`, customLocation);
    setAddressError(""); // Effacer les messages d'erreur
    return customLocation;
  };

  // Fonction de debounce pour limiter les requêtes API
  const debounce = (func, delay, timerRef) => {
    return (...args) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        func(...args);
      }, delay);
    };
  };

  // Fonction pour obtenir des suggestions d'adresses via notre API proxy
  const getSuggestions = async (query, isStart = true) => {
    if (!query.trim() || query.length < 3) {
      if (isStart) {
        setStartSuggestions([]);
        setShowStartSuggestions(false);
      } else {
        setEndSuggestions([]);
        setShowEndSuggestions(false);
      }
      return;
    }

    setIsAddressSearching(true);
    setAddressError("");

    try {
      // Utiliser notre API proxy pour éviter les problèmes CORS
      console.log(`Recherche d'adresses pour: ${query}`);
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        console.error(`Erreur API: ${response.status}`);
        throw new Error(`Erreur API: ${response.status}`);
      }

      const suggestions = await response.json();
      console.log("Suggestions reçues:", suggestions);

      if (!suggestions || suggestions.length === 0 || suggestions.error) {
        console.log("Aucune suggestion trouvée ou erreur reçue");
        if (isStart) {
          setStartSuggestions([]);
          setShowStartSuggestions(false);
        } else {
          setEndSuggestions([]);
          setShowEndSuggestions(false);
        }
        if (suggestions.error) {
          setAddressError(suggestions.error);
        }
        return;
      }

      if (isStart) {
        setStartSuggestions(suggestions);
        setShowStartSuggestions(true);
      } else {
        setEndSuggestions(suggestions);
        setShowEndSuggestions(true);
      }
    } catch (error) {
      console.error("Erreur de géocodage:", error);
      setAddressError("Erreur lors de la recherche d'adresses");
    } finally {
      setIsAddressSearching(false);
    }
  };

  // Fonction pour géocoder une adresse (transforme texte en coordonnées)
  const geocodeAddress = async (address) => {
    setIsAddressSearching(true);
    setAddressError("");

    try {
      // Utiliser notre API proxy pour éviter les problèmes CORS
      console.log(`Géocodage de l'adresse: ${address}`);
      const response = await fetch(
        `/api/geocode?q=${encodeURIComponent(address)}&limit=1`
      );

      if (!response.ok) {
        console.error(`Erreur API: ${response.status}`);
        throw new Error(`Erreur API: ${response.status}`);
      }

      const suggestions = await response.json();
      console.log("Résultat du géocodage:", suggestions);

      if (!suggestions || suggestions.length === 0 || suggestions.error) {
        console.log("Aucune suggestion trouvée ou erreur reçue");
        setAddressError(suggestions.error || "Adresse non trouvée");
        return null;
      }

      return suggestions[0];
    } catch (error) {
      console.error("Erreur de géocodage:", error);
      setAddressError("Erreur lors de la recherche de l'adresse");
      return null;
    } finally {
      setIsAddressSearching(false);
    }
  };

  // Fonction pour sélectionner une adresse de départ partir des suggestions
  const selectStartAddress = (suggestion) => {
    console.log("Sélection de l'adresse de départ:", suggestion);

    // Créer une copie propre de l'objet suggestion pour éviter les champs inutiles
    const cleanSuggestion = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      displayName: suggestion.displayName,
      type: suggestion.type || "address",
    };

    setRouteStart(cleanSuggestion);
    setStartAddress(suggestion.displayName);
    setShowStartSuggestions(false);
  };

  // Fonction pour sélectionner une adresse d'arrivée partir des suggestions
  const selectEndAddress = (suggestion) => {
    console.log("Sélection de l'adresse d'arrivée:", suggestion);

    // Créer une copie propre de l'objet suggestion pour éviter les champs inutiles
    const cleanSuggestion = {
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
      displayName: suggestion.displayName,
      type: suggestion.type || "address",
    };

    setRouteEnd(cleanSuggestion);
    setEndAddress(suggestion.displayName);
    setShowEndSuggestions(false);
  };

  // Fonction mémorisée pour obtenir des suggestions de départ
  const debouncedGetStartSuggestions = useCallback(
    debounce(
      (value) => getSuggestions(value, true),
      500,
      startDebounceTimerRef
    ),
    []
  );

  // Fonction mémorisée pour obtenir des suggestions d'arrivée
  const debouncedGetEndSuggestions = useCallback(
    debounce((value) => getSuggestions(value, false), 500, endDebounceTimerRef),
    []
  );

  // Fonction pour gérer le changement d'adresse de départ
  const handleStartAddressChange = (e) => {
    const value = e.target.value;
    setStartAddress(value);

    // Effacer les suggestions si le champ est vide
    if (!value.trim() || value.length < 3) {
      setStartSuggestions([]);
      setShowStartSuggestions(false);
      return;
    }

    // Réinitialiser toute erreur précédente
    setAddressError("");
    debouncedGetStartSuggestions(value);
  };

  // Fonction pour gérer le changement d'adresse d'arrivée
  const handleEndAddressChange = (e) => {
    const value = e.target.value;
    setEndAddress(value);

    // Effacer les suggestions si le champ est vide
    if (!value.trim() || value.length < 3) {
      setEndSuggestions([]);
      setShowEndSuggestions(false);
      return;
    }

    // Réinitialiser toute erreur précédente
    setAddressError("");
    debouncedGetEndSuggestions(value);
  };

  // Fonction pour gérer le calcul d'itinéraire
  const handleCalculateRoute = () => {
    console.log("Calcul d'itinéraire avec:", {
      start: route.start,
      end: route.end,
    });

    if (!route.start || !route.end) {
      setAddressError("Veuillez définir les points de départ et d'arrivée");
      return;
    }

    // Vérification supplémentaire pour assurer que les coordonnées sont valides
    if (
      !isValidCoordinate(route.start.latitude, route.start.longitude) ||
      !isValidCoordinate(route.end.latitude, route.end.longitude)
    ) {
      setAddressError(
        "Coordonnées invalides, veuillez rechercher des adresses valides"
      );
      return;
    }

    calculateRoute();

    // Ajouter un log pour vérifier la structure des données après le calcul (asynchrone)
    setTimeout(() => {
      if (route.routeData) {
        console.log(
          "Structure des données d'itinéraire reçues:",
          JSON.stringify(route.routeData, null, 2)
        );
      }
    }, 2000);
  };

  // Fonction pour vérifier la validité des coordonnées
  const isValidCoordinate = (lat, lon) => {
    return (
      typeof lat === "number" &&
      !isNaN(lat) &&
      typeof lon === "number" &&
      !isNaN(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    );
  };

  return (
    <div className="flex flex-col p-4 space-y-4 bg-white dark:bg-stone-800 border-b border-gray-200 dark:border-stone-800">
      <h1 className="flex items-center gap-4">
        <img src="/logo-png.svg" className="w-12 h-12" alt="logo" />
        <span className="text-3xl font-bold text-stone-800 dark:text-white">
          RideFlow
        </span>
      </h1>
      <h2 className="text-xl font-bold text-[#FF6A00] dark:text-white">
        Planifier votre trajet
      </h2>

      {/* Point de départ */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-800 dark:text-white/80">
          Point de départ
        </label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={startAddress}
              onChange={handleStartAddressChange}
              placeholder="Adresse de départ"
              className="w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-[#FF6A00] focus:border-[#FF6A00] dark:bg-white dark:text-stone-800"
            />
            {showStartSuggestions && startSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-stone-400 border border-gray-300 dark:border-stone-400 rounded-md shadow-lg max-h-60 overflow-auto">
                {startSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => selectStartAddress(suggestion)}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-stone-400 text-sm text-stone-800 dark:text-white truncate"
                  >
                    {suggestion.displayName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Point d'arrivée */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-800 dark:text-white/80">
          Point d&apos;arrivée
        </label>
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={endAddress}
              onChange={handleEndAddressChange}
              placeholder="Adresse d'arrivée"
              className="w-full px-3 py-2 rounded-md shadow-sm focus:outline-none focus:ring-[#FF6A00] focus:border-[#FF6A00] dark:bg-white dark:text-stone-800"
            />
            {showEndSuggestions && endSuggestions.length > 0 && (
              <ul className="absolute z-10 w-full mt-1 bg-white dark:bg-stone-400 border border-gray-300 dark:border-stone-800 rounded-md shadow-lg max-h-60 overflow-auto">
                {endSuggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => selectEndAddress(suggestion)}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-stone-400 text-sm text-stone-800 dark:text-white truncate"
                  >
                    {suggestion.displayName}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Type d'itinéraire */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-stone-800 dark:text-gray-300">
          Type d&apos;itinéraire
        </label>
        <div className="flex space-x-2">
          <button
            onClick={() => setRouteType("FAST")}
            className={`flex-1 px-3 py-2 rounded-md ${
              route.routeType === "FAST"
                ? "bg-[#FF6A00]/30 text-[#FF6A00] dark:text-[#FF8C3C]"
                : "hover:bg-gray-100 dark:hover:bg-stone-600 text-gray-700 dark:text-gray-200"
            } transition duration-200`}
          >
            Rapide
          </button>
          <button
            onClick={() => setRouteType("CURVY")}
            className={`flex-1 px-3 py-2 rounded-md ${
              route.routeType === "CURVY"
                ? "bg-[#FF6A00]/30 text-[#FF6A00] dark:text-[#FF8C3C]"
                : "hover:bg-gray-100 dark:hover:bg-stone-600 text-gray-700 dark:text-gray-200"
            } transition duration-200`}
          >
            Sinueux
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {(addressError || route.error) && (
        <div className="text-danger text-sm">{addressError || route.error}</div>
      )}

      {/* Bouton de calcul d'itinéraire */}
      <button
        onClick={handleCalculateRoute}
        disabled={route.isLoading || !route.start || !route.end}
        className={`w-full mt-4 px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
          route.isLoading
            ? "bg-[#FF6A00]/30 text-[#FF6A00] dark:text-[#FF8C3C]"
            : "hover:bg-gray-100 dark:hover:bg-stone-600 text-gray-700 dark:text-gray-200"
        } relative overflow-hidden transition-all duration-300 ${
          route.isLoading ? "pl-10" : ""
        }`}
      >
        {route.isLoading && (
          <div className="absolute inset-y-0 left-0 flex items-center justify-center w-10 bg-gray-500">
            <svg
              className="animate-spin h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        )}
        {route.isLoading ? "Calcul en cours..." : "Calculer l'itinéraire"}
      </button>

      {/* Informations sur l'itinéraire calculé */}
      {route.routeData ? (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-stone-800 rounded-md border border-gray-200 dark:border-stone-800">
          <h3 className="font-semibold text-[#FF6A00] dark:text-[#FF8C3C] flex items-center">Itinéraire calculé</h3>
          <div className="mt-3 text-sm space-y-2">
            <p className="flex justify-between bg-stone-700 rounded-md p-2">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Distance:
              </span>
              <span className="font-bold text-stone-800 dark:text-white">
                {getRouteDistance(route.routeData)} km
              </span>
            </p>
            <p className="flex justify-between bg-stone-700 rounded-md p-2">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Durée estimée:
              </span>
              <span className="font-bold text-stone-800 dark:text-white">
                {getRouteDuration(route.routeData)}
              </span>
            </p>
            <p className="flex justify-between bg-stone-700 rounded-md p-2">
              <span className="font-medium text-gray-600 dark:text-gray-300">
                Type:
              </span>
              <span className="font-bold text-stone-800 dark:text-white">
                {route.routeType === "FAST" ? "Rapide" : "Sinueux"}
              </span>
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-stone-800 border border-dashed border-gray-300 dark:border-white rounded-md text-center">
          <p className="text-gray-500 dark:text-white/60 text-sm">
            Définissez un point de départ et d&apos;arrivée puis cliquez sur
            &quot;Calculer l&apos;itinéraire&quot; pour obtenir votre parcours
          </p>
        </div>
      )}
    </div>
  );
}

// Fonction pour récupérer la distance d'un itinéraire quel que soit le format de données
function getRouteDistance(routeData) {
  if (!routeData) return "--";

  // Vérifier les différentes structures possibles de routeData
  let distance = null;

  // Format 1: GeoJSON direct avec propriétés
  if (
    routeData.properties &&
    routeData.properties.summary &&
    routeData.properties.summary.distance
  ) {
    distance = routeData.properties.summary.distance;
  }
  // Format 2: Routes array avec summary
  else if (
    routeData.routes &&
    routeData.routes[0] &&
    routeData.routes[0].summary
  ) {
    distance = routeData.routes[0].summary.distance;
  }
  // Format 3: Features array de GeoJSON
  else if (
    routeData.features &&
    routeData.features[0] &&
    routeData.features[0].properties &&
    routeData.features[0].properties.summary
  ) {
    distance = routeData.features[0].properties.summary.distance;
  }

  // Si la distance est en mètres, convertir en kilomètres
  if (distance && distance > 1000) {
    return (distance / 1000).toFixed(1);
  }

  // Si on n'a pas trouvé de distance valide ou si elle est déjà en kilomètres
  return distance ? distance.toFixed(1) : "--";
}

// Fonction pour récupérer la durée d'un itinéraire quel que soit le format de données
function getRouteDuration(routeData) {
  if (!routeData) return "Inconnue";

  // Vérifier les différentes structures possibles de routeData
  let duration = null;

  // Format 1: GeoJSON direct avec propriétés
  if (
    routeData.properties &&
    routeData.properties.summary &&
    routeData.properties.summary.duration
  ) {
    duration = routeData.properties.summary.duration;
  }
  // Format 2: Routes array avec summary
  else if (
    routeData.routes &&
    routeData.routes[0] &&
    routeData.routes[0].summary
  ) {
    duration = routeData.routes[0].summary.duration;
  }
  // Format 3: Features array de GeoJSON
  else if (
    routeData.features &&
    routeData.features[0] &&
    routeData.features[0].properties &&
    routeData.features[0].properties.summary
  ) {
    duration = routeData.features[0].properties.summary.duration;
  }

  // Formater la durée si on l'a trouvée
  if (duration !== null) {
    return formatDuration(duration);
  }

  return "Inconnue";
}

// Fonction pour formater la durée en heures et minutes
function formatDuration(seconds) {
  if (!seconds) return "Inconnue";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} h ${minutes} min`;
  } else {
    return `${minutes} min`;
  }
}
