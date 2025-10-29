/**
 * GlobalContext.tsx
 * @author Francis
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Interface GlobalData
interface GlobalData {
  [key: string]: any;
}

// Interface Context value
interface GlobalContextType {
  globalData: GlobalData;
  setGlobalData: React.Dispatch<React.SetStateAction<GlobalData>>;
  handleLoginSuccess?: () => void;
}

// Interface Provider props
interface GlobalProviderProps {
  children: ReactNode;
  handleLoginSuccess?: () => void;
}

// Create Context
const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// Provider Component
export const GlobalProvider: React.FC<GlobalProviderProps> = ({ children, handleLoginSuccess }) => {
  const [globalData, setGlobalData] = useState<GlobalData>({});

  const value: GlobalContextType = {
    globalData,
    setGlobalData,
    handleLoginSuccess
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook
export const useGlobal = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobal must be used within GlobalProvider');
  }
  return context;
};

export type { GlobalData, GlobalContextType };