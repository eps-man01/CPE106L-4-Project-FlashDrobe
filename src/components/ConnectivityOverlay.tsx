import React from 'react';
import { WifiOff } from 'lucide-react';

export const ConnectivityOverlay: React.FC = () => {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#f9f6f0]/98 backdrop-blur-sm"
      role="alert"
      aria-live="assertive"
    >
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
          <span>Attempting to reconnect...</span>
        </div>
      </div>
    </div>
  );
};
