/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { WardrobeProvider, useWardrobe } from './context/WardrobeContext';
import { AndroidHeader } from './components/android/AndroidHeader';
import { AndroidBottomNav } from './components/android/AndroidBottomNav';
import { WardrobeView } from './components/wardrobe/WardrobeView';
import { SavedOutfitsView } from './components/favorites/SavedOutfitsView';
import { ProfileView } from './components/profile/ProfileView';
import { VirtualTryOnView } from './components/tryon/VirtualTryOnView';
import { AuthScreen } from './components/auth/AuthScreen';
import { useDeviceLayout } from './hooks/useDeviceLayout';

function AppContent() {
  const { activeTab, isAuthenticated } = useWardrobe();
  const device = useDeviceLayout();

  // Purely dynamic, automatic detection of tablet and orientation
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
        {/* Top App Bar with Tablet Navigation & Device Controls */}
        <AndroidHeader />

        {/* Main Content Stage */}
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

        {/* Bottom Navigation Bar */}
        <AndroidBottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <WardrobeProvider>
      <AppContent />
    </WardrobeProvider>
  );
}

