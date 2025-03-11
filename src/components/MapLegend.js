import React from "react";
import {
  Camera,
  AlertTriangle,
  CloudSun,
  MapPin,
  Moon,
  Waypoints,
  Map,
} from "lucide-react";
import useRideFlowStore from "@/utils/store";

export default function MapLegend({ userSettings, toggleSetting }) {
  // Utiliser le store directement pour le mode de placement des points
  const { togglePointPlacementMode } = useRideFlowStore();
  const handleToggle = (setting) => {
    toggleSetting(setting);
  };

  const LegendItem = ({ icon, isActive, toggle }) => (
    <div
      className={`
        w-12 h-12 flex items-center justify-center rounded-lg cursor-pointer
        transition-all duration-300 ease-in-out
        ${
          isActive
            ? "bg-[#FF6A00]/30 text-[#FF6A00] dark:text-[#FF8C3C]"
            : "hover:bg-gray-100 dark:hover:bg-stone-600 text-gray-700 dark:text-gray-200"
        }
      `}
      onClick={(e) => {
        // Empêcher la propagation du clic vers la carte
        e.stopPropagation();
        toggle();
      }}
    >
      {icon}
    </div>
  );

  return (
    <div
      className={`
        fixed top-4 right-4 z-40
        bg-white/95 dark:bg-stone-800/95 backdrop-blur-md
        rounded-xl shadow-lg 
        w-16
        overflow-hidden
        border border-black/10 dark:border-white/10
        transform hover:shadow-xl
      `}
      onClick={(e) => e.stopPropagation()} // Empêcher la propagation des clics sur le conteneur
    >
      <div className="p-3 flex flex-col items-center space-y-2.5">
        <LegendItem
          icon={<Camera size={18} className="text-current" />}
          isActive={userSettings.showRadars}
          toggle={() => handleToggle("showRadars")}
        />
        <LegendItem
          icon={<AlertTriangle size={18} className="text-current" />}
          isActive={userSettings.showIncidents}
          toggle={() => handleToggle("showIncidents")}
        />
        <LegendItem
          icon={<CloudSun size={18} className="text-current" />}
          isActive={userSettings.showWeather}
          toggle={() => handleToggle("showWeather")}
        />
        <LegendItem
          icon={<MapPin size={18} className="text-current" />}
          isActive={userSettings.showPOIs}
          toggle={() => handleToggle("showPOIs")}
        />
        <div className="border-t border-gray-200 dark:border-white my-1 w-8"></div>
        <LegendItem
          icon={<Moon size={18} className="text-current" />}
          isActive={userSettings.darkMode}
          toggle={() => handleToggle("darkMode")}
        />
        <LegendItem
          label="Instructions"
          icon={<Waypoints size={18} className="text-current" />}
          isActive={userSettings.showInstructions}
          toggle={() => toggleSetting("showInstructions")}
          tooltipKey="instructions"
        />
        <LegendItem
          icon={<Map size={18} className="text-current" />}
          isActive={userSettings.pointPlacementMode}
          toggle={() => togglePointPlacementMode()}
        />
      </div>
    </div>
  );
}
