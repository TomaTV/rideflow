"use client";

import { useEffect } from "react";
import { Geist } from "next/font/google";
import MapView from "@/components/MapView";
import RoutePanel from "@/components/RoutePanel";
import WeatherWidget from "@/components/WeatherWidget";
import useRideFlowStore from "@/utils/store";

const geist = Geist({ subsets: ["latin"] });

export default function Home() {
  const { setMapLoaded } = useRideFlowStore();

  useEffect(() => {
    // Initialiser l'application
    console.log("Initialisation de RideFlow");
  }, []);

  return (
    <main className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* Panneau latéral */}
        <div className="w-96 bg-white dark:bg-gray-800 shadow-xl z-10 flex flex-col overflow-y-auto">
          <RoutePanel />
          <WeatherWidget />
        </div>

        {/* Carte principale */}
        <div className="flex-1 relative">
          <MapView onLoad={() => setMapLoaded(true)} />
        </div>
      </div>
    </main>
  );
}
