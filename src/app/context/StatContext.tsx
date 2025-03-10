// src/context/StatContext.tsx
import { createContext, useContext, useState } from "react";

interface StatContextType {
  stat: number;
  setStat: (value: number) => void;
}

const StatContext = createContext<StatContextType | null>(null);

export function StatProvider({ children }: { children: React.ReactNode }) {
  const [stat, setStat] = useState(0);
  return (
    <StatContext.Provider value={{ stat, setStat }}>
      {children}
    </StatContext.Provider>
  );
}

export function useStat() {
  const context = useContext(StatContext);
  if (!context) {
    throw new Error("useStat must be used within a StatProvider");
  }
  return context;
}
