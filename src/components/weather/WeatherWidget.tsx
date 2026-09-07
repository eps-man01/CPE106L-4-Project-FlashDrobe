import React, { useState } from 'react';
import {
  Sun,
  CloudSun,
  CloudRain,
  CloudLightning,
  Snowflake,
  Wind,
  Droplets,
  MapPin,
  MapPinOff,
  Umbrella,
  ChevronDown,
  ChevronUp,
  Navigation,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';

export const WeatherWidget: React.FC = () => {
  const {
    weather,
    isWeatherLoading,
    isLocationOff,
    requestGPSWeather,
  } = useWardrobe();

  const [showDetails, setShowDetails] = useState(false);

  const getWeatherIcon = (iconStr?: string) => {
    switch (iconStr) {
      case 'sun':
        return <Sun className="w-6 h-6 text-amber-300 animate-spin-slow" />;
      case 'cloud-sun':
        return <CloudSun className="w-6 h-6 text-amber-200" />;
      case 'cloud-rain':
        return <CloudRain className="w-6 h-6 text-sky-200" />;
      case 'cloud-lightning':
        return <CloudLightning className="w-6 h-6 text-purple-200" />;
      case 'snowflake':
        return <Snowflake className="w-6 h-6 text-cyan-200" />;
      default:
        return <Sun className="w-6 h-6 text-amber-300" />;
    }
  };

  // Outfit-focused styling tips based on live GPS weather
  const getOutfitDressingBadge = () => {
    if (!weather) return { title: 'Weather Inactive', tag: 'Standard Layering' };
    if (weather.rainChance > 50 || weather.condition.toLowerCase().includes('rain')) {
      return { title: 'Rain Expected', tag: 'Waterproof Outerwear & Durable Footwear' };
    }
    if (weather.tempC >= 31) {
      return { title: 'Hot Tropical', tag: 'Breathable Cotton / Linen & Lightweight Tops' };
    }
    if (weather.tempC >= 25) {
      return { title: 'Warm & Sunny', tag: 'Lightweight Tops & Versatile Bottoms' };
    }
    if (weather.tempC <= 19) {
      return { title: 'Chilly / Cool', tag: 'Sweater, Hoodie & Warm Layering' };
    }
    return { title: 'Mild & Pleasant', tag: 'Smart Casual & Breathable Layers' };
  };

  // 1. Loading State
  if (isWeatherLoading && !weather) {
    return (
      <div
        id="weather-widget-loading"
        className="bg-gradient-to-r from-[#8c5836] via-[#9e6741] to-[#784a2c] text-white rounded-3xl p-4 shadow-sm flex items-center justify-between transition-all mb-3 animate-pulse"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-2xl bg-white/15">
            <RefreshCw className="w-5 h-5 text-amber-200 animate-spin" />
          </div>
          <div>
            <p className="text-xs font-bold text-white">Connecting to GPS...</p>
            <p className="text-[11px] text-stone-200">Detecting local weather & temperature</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Location Off / Weather Unavailable State (No weather showing)
  if (!weather || isLocationOff) {
    return (
      <div
        id="weather-widget-location-off"
        className="bg-white border border-[#e7e2d9] rounded-3xl p-3.5 shadow-xs flex items-center justify-between mb-3 text-stone-800 transition-all"
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1 pr-2">
          <div className="w-10 h-10 rounded-2xl bg-[#f5ede3] border border-[#e5dec9] flex items-center justify-center text-[#8c5836] flex-shrink-0">
            <MapPinOff className="w-5 h-5 text-[#8c5836]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold text-stone-900">GPS Location Off</span>
              <span className="w-2 h-2 rounded-full bg-stone-300"></span>
            </div>
            <p className="text-[11px] text-stone-500 truncate">
              Enable location for real-time temperature & styling
            </p>
          </div>
        </div>

        <button
          id="btn-enable-gps-weather"
          onClick={requestGPSWeather}
          disabled={isWeatherLoading}
          className="flex items-center space-x-1.5 px-3 py-2 bg-[#8c5836] hover:bg-[#784a2c] active:scale-95 text-white font-bold rounded-2xl text-xs shadow-xs transition-all flex-shrink-0 disabled:opacity-50"
        >
          <Navigation className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin' : ''}`} />
          <span>{isWeatherLoading ? 'Locating...' : 'Enable GPS'}</span>
        </button>
      </div>
    );
  }

  const outfitAdvice = getOutfitDressingBadge();

  // 3. Active Live GPS Weather State
  return (
    <div id="weather-widget-active" className="mb-3">
      {/* Main Temperature & Weather Card */}
      <div className="bg-gradient-to-br from-[#8c5836] via-[#9e6741] to-[#784a2c] text-white rounded-3xl p-4 shadow-md transition-all relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Top Row: GPS City Badge & Temperature display */}
        <div className="flex items-center justify-between relative z-10">
          {/* Left: GPS Location Pill */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-2xl bg-black/25 backdrop-blur-md border border-white/20 shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <MapPin className="w-3.5 h-3.5 text-amber-200" />
              <span className="text-xs font-black tracking-wide text-white truncate max-w-[130px] sm:max-w-[180px]">
                {weather.city}
              </span>
            </div>

            <button
              id="btn-refresh-gps"
              onClick={requestGPSWeather}
              title="Refresh GPS Weather"
              className="p-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors border border-white/20 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isWeatherLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Right: Big Crisp Temperature */}
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <div className="text-2xl font-black tracking-tight leading-none text-white">
                {weather.tempC}°C
              </div>
              <div className="text-[10px] font-semibold text-amber-100/90 mt-0.5">
                Feels {weather.feelsLikeC}°C • H:{weather.highTempC}° L:{weather.lowTempC}°
              </div>
            </div>
            <div className="p-1.5 rounded-2xl bg-black/20 border border-white/15">
              {getWeatherIcon(weather.icon)}
            </div>
          </div>
        </div>

        {/* Bottom Row: Dressing Guidance Chip & Micro Metrics Toggle */}
        <div className="mt-3 pt-2.5 border-t border-white/20 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-1.5 min-w-0 flex-1 pr-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-white/15 backdrop-blur-xs border border-white/20 text-white min-w-0">
              <Sparkles className="w-3 h-3 text-amber-300 flex-shrink-0" />
              <span className="text-[11px] font-bold text-white truncate">
                <span className="text-amber-200">{outfitAdvice.title}:</span> {outfitAdvice.tag}
              </span>
            </div>
          </div>

          {/* Toggle details chevron */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center space-x-1 px-2 py-1 rounded-xl bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition-colors border border-white/20 flex-shrink-0"
          >
            <span>{showDetails ? 'Less' : 'Details'}</span>
            {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {/* Expandable Micro-Metrics Row */}
        {showDetails && (
          <div className="mt-2.5 pt-2.5 border-t border-white/15 grid grid-cols-3 gap-2 text-center text-xs animate-in fade-in duration-150 relative z-10">
            <div className="bg-black/20 rounded-xl p-1.5 border border-white/10">
              <div className="flex items-center justify-center space-x-1 text-amber-200">
                <Umbrella className="w-3 h-3" />
                <span className="text-[10px] uppercase font-bold">Rain</span>
              </div>
              <span className="text-xs font-black text-white">{weather.rainChance}%</span>
            </div>

            <div className="bg-black/20 rounded-xl p-1.5 border border-white/10">
              <div className="flex items-center justify-center space-x-1 text-amber-200">
                <Droplets className="w-3 h-3" />
                <span className="text-[10px] uppercase font-bold">Humidity</span>
              </div>
              <span className="text-xs font-black text-white">{weather.humidity}%</span>
            </div>

            <div className="bg-black/20 rounded-xl p-1.5 border border-white/10">
              <div className="flex items-center justify-center space-x-1 text-amber-200">
                <Wind className="w-3 h-3" />
                <span className="text-[10px] uppercase font-bold">Wind</span>
              </div>
              <span className="text-xs font-black text-white">{weather.windSpeedKmH} km/h</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
