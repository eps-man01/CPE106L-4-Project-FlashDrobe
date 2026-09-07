import React from 'react';
import {
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';

interface AndroidHeaderProps {
  onOpenAddModal?: () => void;
}

export const AndroidHeader: React.FC<AndroidHeaderProps> = () => {
  const {
    activeTab,
    isWeatherLoading,
    requestGPSWeather,
  } = useWardrobe();

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
        return 'Style & Settings';
      default:
        return 'Flashdrobe';
    }
  };

  return (
    <header
      id="android-top-app-bar"
      className="sticky top-0 bg-[#f9f6f0]/95 backdrop-blur-md px-4 md:px-6 py-2.5 z-30 border-b border-[#e7e2d9] flex items-center justify-between transition-all"
    >
      <div className="flex items-center space-x-3">
        {/* App Logo */}
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#8c5836] via-[#a16b47] to-[#784a2c] flex items-center justify-center shadow-md shadow-[#8c5836]/20 flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center space-x-1.5">
            <span className="font-extrabold text-sm tracking-tight text-stone-900 font-['Space_Grotesk']">
              Flashdrobe
            </span>
            <span className="text-[10px] uppercase tracking-wider font-bold px-1.5 py-0.2 bg-[#f0e9df] text-[#784a2c] border border-[#ddcfbe] rounded">
              D-PWA
            </span>
          </div>
          <p className="text-[11px] text-stone-500 font-medium -mt-0.5">{getTabTitle()}</p>
        </div>
      </div>

      {/* Right Controls: Weather Refresh */}
      <div className="flex items-center space-x-2">
        {/* Live GPS Weather Refresh Button */}
        <button
          id="btn-refresh-weather"
          onClick={requestGPSWeather}
          title="Refresh GPS Weather"
          className="p-2 rounded-xl bg-white border border-[#e7e2d9] text-stone-600 hover:text-[#8c5836] hover:bg-stone-50 shadow-2xs transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin text-[#8c5836]' : ''}`} />
        </button>
      </div>
    </header>
  );
};
