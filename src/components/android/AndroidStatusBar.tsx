import React, { useState, useEffect } from 'react';
import { Wifi, Battery, CloudSun, Signal } from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';

export const AndroidStatusBar: React.FC = () => {
  const [time, setTime] = useState<string>('');
  const { weather } = useWardrobe();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      id="android-status-bar"
      className="w-full bg-[#f8fafc]/90 backdrop-blur-md px-5 pt-2.5 pb-1.5 flex items-center justify-between text-xs text-slate-700 font-medium select-none z-50 border-b border-slate-200/80"
    >
      {/* Left: Time & Weather snapshot */}
      <div className="flex items-center space-x-2">
        <span className="font-bold text-slate-900 tracking-tight text-[13px]">{time || '10:45'}</span>
        {weather && (
          <div className="flex items-center space-x-1 text-[11px] text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
            <CloudSun className="w-3 h-3 text-sky-600" />
            <span className="font-semibold">{weather.tempC}°C</span>
          </div>
        )}
      </div>

      {/* Center: Camera Punch-Hole Simulation */}
      <div className="w-3.5 h-3.5 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center shadow-inner">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-900"></div>
      </div>

      {/* Right: Android System Indicators */}
      <div className="flex items-center space-x-2 text-slate-600">
        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">5G</span>
        <Signal className="w-3.5 h-3.5 text-slate-700" />
        <Wifi className="w-3.5 h-3.5 text-slate-700" />
        <div className="flex items-center space-x-1">
          <span className="text-[10px] font-semibold text-slate-700">92%</span>
          <Battery className="w-4 h-4 text-emerald-600 fill-emerald-600" />
        </div>
      </div>
    </div>
  );
};
