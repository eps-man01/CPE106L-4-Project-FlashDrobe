import React, { useEffect } from 'react';
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
import { useColorScheme } from './hooks/useColorScheme';
import { Loader2, WifiOff } from 'lucide-react';

function ConnectivityGate({ children }: { children: React.ReactNode }) {
  const { isOnline, isChecking } = useConnectivity();

  if (isChecking) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: 'var(--md-surface)' }}
      >
        <div
          className="rounded-3xl p-8 flex flex-col items-center text-center max-w-xs mx-4 md-elevation-3"
          style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
        >
          <Loader2
            className="w-8 h-8 animate-spin mb-3"
            style={{ color: 'var(--md-primary)' }}
          />
          <h2
            className="text-base font-bold font-display"
            style={{ color: 'var(--md-on-surface)' }}
          >
            Checking connection...
          </h2>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            Flashdrobe needs internet to run
          </p>
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: 'var(--md-surface)' }}
      >
        <div
          className="rounded-3xl p-8 flex flex-col items-center text-center max-w-xs mx-4 md-elevation-3"
          style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              backgroundColor: 'var(--md-error-container)',
              color: 'var(--md-on-error-container)',
            }}
          >
            <WifiOff className="w-7 h-7" />
          </div>
          <h2
            className="text-lg font-bold font-display mb-1"
            style={{ color: 'var(--md-on-surface)' }}
          >
            No Internet Connection
          </h2>
          <p
            className="text-xs mb-4"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            Flashdrobe requires an active internet connection. Please check your network and try again.
          </p>
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--md-warning)' }}
            />
            <span>Waiting for connection...</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function AppContent() {
  const { activeTab, isAuthenticated, isAuthLoading } = useWardrobe();
  const { isOnline } = useConnectivity();
  const device = useDeviceLayout();
  useColorScheme(); // Initialize palette from localStorage

  const isTablet = device.effectiveIsTablet;
  const isLandscape = device.effectiveOrientation === 'landscape';

  if (isAuthLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ backgroundColor: 'var(--md-surface)' }}
      >
        <div
          className="rounded-3xl p-8 flex flex-col items-center text-center max-w-xs mx-4 md-elevation-3"
          style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
        >
          <Loader2
            className="w-8 h-8 animate-spin mb-3"
            style={{ color: 'var(--md-primary)' }}
          />
          <h2
            className="text-base font-bold font-display"
            style={{ color: 'var(--md-on-surface)' }}
          >
            Loading Flashdrobe...
          </h2>
          <p
            className="text-xs mt-1"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            Setting up your wardrobe
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div
        className={`min-h-screen text-stone-900 flex flex-col mx-auto relative transition-all duration-300 ${
          isTablet ? 'w-full max-w-4xl py-6 px-4' : 'w-full max-w-lg'
        }`}
        style={{ backgroundColor: 'var(--md-surface)' }}
      >
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
      className={`min-h-screen text-stone-900 flex flex-col mx-auto relative transition-all duration-200 ${
        isTablet
          ? isLandscape
            ? 'w-full max-w-7xl'
            : 'w-full max-w-4xl'
          : 'w-full max-w-lg'
      }`}
      style={{ backgroundColor: 'var(--md-surface)' }}
    >
      <div className="flex flex-col flex-1 min-h-screen relative w-full overflow-x-hidden">
        <AndroidHeader />

        <main className={`flex-1 overflow-y-auto no-scrollbar ${
          isTablet ? 'px-4 sm:px-6 md:px-8 pt-4' : 'px-4 pt-3'
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
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
