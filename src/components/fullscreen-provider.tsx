"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

interface FullscreenContextType {
  isFullscreen: boolean;
  setFullscreen: (value: boolean) => void;
}

const FullscreenContext = createContext<FullscreenContextType>({
  isFullscreen: false,
  setFullscreen: () => {},
});

export function FullscreenProvider({ children }: { children: ReactNode }) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const setFullscreen = useCallback((value: boolean) => {
    setIsFullscreen(value);
  }, []);

  return (
    <FullscreenContext.Provider value={{ isFullscreen, setFullscreen }}>
      {children}
    </FullscreenContext.Provider>
  );
}

export function useFullscreen() {
  return useContext(FullscreenContext);
}
