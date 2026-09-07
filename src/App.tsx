/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ConnectivityProvider, useConnectivity } from './context/ConnectivityContext';
import { ConnectivityOverlay } from './components/ConnectivityOverlay';
import { WardrobeProvider, useWardrobe } from './context/WardrobeContext';
import { AndroidHeader } from './components/android/AndroidHeader';
import { AndroidBottomNav } from './components/android/AndroidBottomNav';
import { WardrobeView } from './components/wardrobe/WardrobeView';
import { SavedOutfitsView } from './components/favorites/SavedOutfitsView';
import { ProfileView } from './components/profile/ProfileView';
import { VirtualTryOnView } from './components/tryon/VirtualTryOnView';
import { AuthScreen } from './components/auth/AuthScreen';
import { useDeviceLayout } from './hooks/useDeviceLayout';
import { Loader2, WifiOff } from 'lucide-react';

function ConnectivityGate({ children }: { children: React.ReactNode }) {
  const { isOnline, isChecking } = useConnectivity();

  if (isChecking) {
    return (
      <div className="min-h-screen bg-[#f9f6f0] flex flex-col items-center justify-center">
        <div className="bg-white border border-[#e7e2d9] rounded-3xl p-8 shadow-lg flex flex-col items-center text-center max-w-xs mx-4">
          <Loader2 className="w-8 h-8 text-[#8c5836] animate-spin mb-3" />
          <h2 className="text-sm font-extrabold text-stone-900 font-['Space_Grotesk']">
            Checking connection...
          </h2>
          <p className="text-[11px] text-stone-500 mt-1">
            Flashdrobe needs internet to run
          </p>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="min-h-screen bg-[#f9f6f0] flex flex-col items-center justify-center">
        <div className="bg-white border border-[#e7e2d9] rounded-3xl p-8 shadow-lg flex flex-col items-center text-center max-w-xs mx-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
            <WifiOff className="w-7 h-7 text-red-500" />
          </div>
          <h2 className="text-base font-extrabold text-stone-900 mb-1 font-['Space_Grotesk']">
            No Internet Connection
          </h2>
          <p className="text-xs text-stone-500 mb-4">
            Flashdrobe requires an active internet connection. Please check your network and try again.
          </p>
          <div className="flex items-center space-x-2 text-[11px] text-stone-400 font-medium">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Waiting for connection...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const { activeTab, isAuthenticated } = useWardrobe();
  const { isOnline } = useConnectivity();
  const device = useDeviceLayout();

  const isTablet = device.effectiveIsTablet;
  const isLandscape = device.effectiveOrientation === 'landscape';

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen bg-[#f9f6f0] text-stone-900 flex flex-col mx-auto relative transition-all duration-300 ${
        isTablet ? 'w-full max-w-4xl py-6 px-4' : 'w-full max-w-lg border-x border-[#e7e2d9]'
      }`}>
        <AuthScreen />
      </div>
    );
  }

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'wardrobe':
        return <WardrobeView />;
      case 'stylist':
      case 'canvas':
      case 'tryon':
        return <VirtualTryOnView />;
      case 'favorites':
        return <SavedOutfitsView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <VirtualTryOnView />;
    }
  };

  return (
    <div
      id="app-root-container"
      className={`min-h-screen bg-[#f9f6f0] text-stone-900 flex flex-col mx-auto relative transition-all duration-200 ${
        isTablet
          ? isLandscape
            ? 'w-full max-w-7xl'
            : 'w-full max-w-4xl'
          : 'w-full max-w-lg border-x border-[#e7e2d9] shadow-xs'
      }`}
    >
      <div className="flex flex-col flex-1 min-h-screen relative w-full overflow-x-hidden">
        <AndroidHeader />

        <main className={`flex-1 overflow-y-auto no-scrollbar bg-[#f9f6f0] ${
          isTablet ? 'px-4 sm:px-6 md:px-8 pt-4' : 'px-4 pt-3'
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              {renderActiveScreen()}
            </motion.div>
          </AnimatePresence>
        </main>

        <AndroidBottomNav />
      </div>

      {!isOnline && <ConnectivityOverlay />}
    </div>
  );
}

export default function App() {
  return (
    <ConnectivityProvider>
      <ConnectivityGate>
        <WardrobeProvider>
          <AppContent />
        </WardrobeProvider>
      </ConnectivityGate>
    </ConnectivityProvider>
  );
}
