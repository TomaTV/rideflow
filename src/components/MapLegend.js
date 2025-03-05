import React, { useState } from "react";
import {
  Camera,
  AlertTriangle,
  CloudSun,
  MapPin,
  ChevronRight,
  Moon,
  ChevronLeft,
} from "lucide-react";

export default function MapLegend({ userSettings, toggleSetting }) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const LegendItem = ({ label, icon, isActive, toggle }) => (
    <div
      className={`
        flex items-center justify-between 
        px-3 py-2 rounded-lg 
        transition-all duration-300 ease-in-out
        ${
          isActive
            ? "bg-[#FF6A00]/20 text-[#FF6A00] dark:text-[#FF8C3C]"
            : "bg-white/80 dark:bg-stone-700/80 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-stone-600"
        }
        cursor-pointer
        border border-black/10
      `}
      onClick={toggle}
    >
      <div className="flex items-center space-x-3">
        {icon}
        {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
      </div>
      {!isCollapsed && (
        <div
          className={`
            w-5 h-5 rounded-full flex items-center justify-center
            ${
              isActive ? "bg-[#FF6A00] text-white" : "bg-gray-200 text-gray-500"
            }
          `}
        >
          {isActive ? "✓" : ""}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`
        fixed top-4 right-4 z-50
        bg-white/90 dark:bg-stone-800/90 backdrop-blur-sm 
        rounded-xl shadow-lg 
        transition-all duration-300 ease-in-out
        ${isCollapsed ? "w-16" : "w-64"}
        overflow-hidden
        border border-black/10 dark:border-white/10
      `}
    >
      <div
        className="
          flex items-center 
          px-4 py-2 
          bg-[#FF6A00] text-white
          cursor-pointer
          justify-between
        "
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {!isCollapsed && <h3 className="font-bold text-sm">Légendes</h3>}
        {isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </div>

      <div className="p-3 space-y-2">
        <LegendItem
          label="Radars"
          icon={<Camera size={18} className="text-current" />}
          isActive={userSettings.showRadars}
          toggle={() => toggleSetting("showRadars")}
        />
        <LegendItem
          label="Incidents"
          icon={<AlertTriangle size={18} className="text-current" />}
          isActive={userSettings.showIncidents}
          toggle={() => toggleSetting("showIncidents")}
        />
        <LegendItem
          label="Météo"
          icon={<CloudSun size={18} className="text-current" />}
          isActive={userSettings.showWeather}
          toggle={() => toggleSetting("showWeather")}
        />
        <LegendItem
          label="Points d'Intérêt"
          icon={<MapPin size={18} className="text-current" />}
          isActive={userSettings.showPOIs}
          toggle={() => toggleSetting("showPOIs")}
        />
        <LegendItem
          label="DarkMode"
          icon={<Moon size={18} className="text-current" />}
          isActive={userSettings.darkMode}
          toggle={() => {
            console.log("MapLegend: Bouton DarkMode cliqué");
            toggleSetting("darkMode");
            console.log("MapLegend: Valeur darkMode après clic =", !userSettings.darkMode);
          }}
        />
      </div>
    </div>
  );
}
