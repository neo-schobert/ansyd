"use client";
import React, { createContext, ReactNode, useContext, useState } from "react";

// Définition du type pour le contexte
type NavigationHeightContextType = {
  height: number;
  setHeight: (height: number) => void;
};

// Créer le contexte avec une valeur par défaut
const NavigationHeightContext = createContext<
  NavigationHeightContextType | undefined
>(undefined);

// Fournisseur de contexte
export const NavigationHeightProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [height, setHeight] = useState<number>(0);

  return (
    <NavigationHeightContext.Provider value={{ height, setHeight }}>
      {children}
    </NavigationHeightContext.Provider>
  );
};

// Custom hook pour utiliser le contexte
export const useNavigationHeight = () => {
  const context = useContext(NavigationHeightContext);
  if (!context) {
    throw new Error(
      "useSector doit être utilisé dans un NavigationHeightProvider"
    );
  }
  return context;
};
