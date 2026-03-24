"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type IlBaskanligiScopeMode = "all" | "hat";

type IlBaskanligiSidebarContextValue = {
  scopeMode: IlBaskanligiScopeMode;
  selectedHatId: number | null;
  selectedHatName: string | null;
  setAllIstanbul: () => void;
  selectHat: (id: number, name: string) => void;
};

const IlBaskanligiSidebarContext =
  createContext<IlBaskanligiSidebarContextValue | null>(null);

export function IlBaskanligiSidebarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [scopeMode, setScopeMode] = useState<IlBaskanligiScopeMode>("all");
  const [selectedHatId, setSelectedHatId] = useState<number | null>(null);
  const [selectedHatName, setSelectedHatName] = useState<string | null>(null);

  const setAllIstanbul = useCallback(() => {
    setScopeMode("all");
    setSelectedHatId(null);
    setSelectedHatName(null);
  }, []);

  const selectHat = useCallback((id: number, name: string) => {
    setScopeMode("hat");
    setSelectedHatId(id);
    setSelectedHatName(name);
  }, []);

  const value = useMemo(
    () => ({
      scopeMode,
      selectedHatId,
      selectedHatName,
      setAllIstanbul,
      selectHat,
    }),
    [
      scopeMode,
      selectedHatId,
      selectedHatName,
      setAllIstanbul,
      selectHat,
    ],
  );

  return (
    <IlBaskanligiSidebarContext.Provider value={value}>
      {children}
    </IlBaskanligiSidebarContext.Provider>
  );
}

export function useIlBaskanligiSidebar(): IlBaskanligiSidebarContextValue | null {
  return useContext(IlBaskanligiSidebarContext);
}
