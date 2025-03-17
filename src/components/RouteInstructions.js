import React from "react";
import { ArrowRight, CornerDownRight, RotateCw, CornerUpRight, CornerUpLeft, ArrowUp, Flag, MapPin } from "lucide-react";
import useRideFlowStore from "@/utils/store";

export default function RouteInstructions() {
  const { route, userSettings } = useRideFlowStore();
    const { instructions } = route;
    
    if (!userSettings.showInstructions) {
        return null;
    }
  
  console.log("Instructions avec directions:", instructions);

  if (!instructions || instructions.length === 0) {
    return (
      <div className="p-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
          Instructions
        </h2>
        <div className="flex flex-col items-center justify-center h-32 rounded-lg">
          <p className="text-white dark:text-gray-400 mb-2 text-center">
            Aucun itinéraire calculé
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-400 text-center">
            Définissez un itinéraire pour voir les instructions étape par étape
          </p>
        </div>
      </div>
    );
  }

  const getInstructionIcon = (instruction) => {
    console.log("Instruction:", instruction.instruction, "Direction:", instruction.direction, "Type:", instruction.type);
    
    const text = instruction.instruction.toLowerCase();
    
    if (instruction.type === "depart") {
      return <Flag size={20} className="text-green-500" />;
    }
    
    if (instruction.type === "arrive" || instruction.type === "destination") {
      return <MapPin size={20} className="text-red-500" />;
    }
    
    if (instruction.type === "roundabout" || 
        text.includes("rond-point") || 
        text.includes("giratoire") ||
        text.includes("sortie")) {
      return <RotateCw size={20} className="text-[#FF6A00]" />;
    }
    
    if (text.includes("tournez à gauche") || 
        text.includes("bifurquez à gauche") || 
        text.includes("gauche")) {
      return <CornerUpLeft size={20} className="text-[#FF6A00]" />;
    }
    
    if (text.includes("tournez à droite") || 
        text.includes("bifurquez à droite") || 
        text.includes("droite")) {
      return <CornerUpRight size={20} className="text-[#FF6A00]" />;
    }
    
    if (text.includes("tout droit") || 
        text.includes("continuez") || 
        text.includes("continuer")) {
      return <ArrowUp size={20} className="text-[#FF6A00]" />;
    }
    
    if (text.includes("demi-tour")) {
      return <RotateCw size={20} className="text-[#FF6A00]" />;
    }
    
    return <ArrowRight size={20} className="text-[#FF6A00]" />;
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center">
        Instructions
      </h2>
      
      <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
        {instructions.map((instruction, index) => (
            <div
                key={instruction.id || index}
                className={`
                flex items-start p-3 rounded-lg shadow-sm
                ${instruction.type === "depart" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : 
                    instruction.type === "arrive" ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800" : 
                    "bg-white dark:bg-gray-100/10"}
                `}
            >
            <div className="mr-3 mt-1">
              {getInstructionIcon(instruction)}
            </div>
            <div className="flex-1">
              <p className="text-gray-800 dark:text-white font-medium">
                {instruction.instruction}
              </p>
              {instruction.name && (
                <p className="text-sm text-gray-500 dark:text-gray-300 mt-1">
                  {instruction.name}
                </p>
              )}
              <p className="text-xs text-gray-400 dark:text-gray-400 mt-1">
                {formatDistance(instruction.distance)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}