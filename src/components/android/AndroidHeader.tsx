import React from 'react';
import {
  Sparkles,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { useConnectivity } from '../../context/ConnectivityContext';

interface AndroidHeaderProps {
  onOpenAddModal?: () => void;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = () => {
  const {
    activeTab,
    isWeatherLoading,
    requestGPSWeather,
  } = useWardrobe();
  const { isOnline } = useConnectivity();

  const getTabTitle = () => {
    switch (activeTab) {
      case 'tryon':
        return 'AI Outfit Stylist';
      case 'wardrobe':
        return 'My Digital Closet';
      case 'stylist':
        return 'AI Outfit Stylist';
      case 'canvas':
        return 'AI Outfit Stylist';
      case 'favorites':
        return 'Saved Collections';
      case 'profile':
        return 'My Profile';
      default:
        return 'Flashdrobe';
    }
  };

  return (
    <header
      id="android-top-app-bar"
      className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 transition-all"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--md-surface) 85%, transparent)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--md-outline-variant)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* App Logo — Tonal Primary */}
        <div
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--md-primary-container)' }}
        >
          <Sparkles
            className="w-5 h-5 stroke-[2.5]"
            style={{ color: 'var(--md-on-primary-container)' }}
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span
              className="font-bold text-base tracking-tight font-display"
              style={{ color: 'var(--md-on-surface)' }}
            >
              Flashdrobe
            </span>
            <span
              className="text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--md-surface-container-high)',
                color: 'var(--md-on-surface-variant)',
              }}
            >
              D-PWA
            </span>
            {!isOnline && (
              <span
                className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
                style={{
                  backgroundColor: 'var(--md-error-container)',
                  color: 'var(--md-on-error-container)',
                }}
              >
                <WifiOff className="w-2.5 h-2.5" />
                <span>Offline</span>
              </span>
            )}
          </div>
          <p
            className="text-xs font-medium -mt-0.5"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            {getTabTitle()}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        <button
          id="btn-refresh-weather"
          onClick={requestGPSWeather}
          title="Refresh GPS Weather"
          className="md-ripple w-10 h-10 rounded-full flex items-center justify-center transition-colors"
          style={{
            backgroundColor: 'var(--md-surface-container-high)',
            color: 'var(--md-on-surface-variant)',
          }}
        >
          <RefreshCw
            className={`w-4 h-4 ${isWeatherLoading ? 'animate-spin' : ''}`}
            style={isWeatherLoading ? { color: 'var(--md-primary)' } : undefined}
          />
        </button>
      </div>
    </header>
  );
};
