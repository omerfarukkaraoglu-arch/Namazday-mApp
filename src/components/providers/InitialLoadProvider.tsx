'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SplashScreen } from '../ui/SplashScreen';
import { AnimatePresence } from 'framer-motion';

const InitialLoadContext = createContext({ isLoaded: false });

export const InitialLoadProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Toplam 2.8 saniye (Animasyon + Kısa bekleme + Geçiş)
    const timer = setTimeout(() => {
      setShowSplash(false);
      setIsLoaded(true);
    }, 2800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <InitialLoadContext.Provider value={{ isLoaded }}>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>
      <div style={{ 
        opacity: isLoaded ? 1 : 0, 
        visibility: isLoaded ? 'visible' : 'hidden',
        transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1)' 
      }}>
        {children}
      </div>
    </InitialLoadContext.Provider>
  );
};

export const useInitialLoad = () => useContext(InitialLoadContext);
