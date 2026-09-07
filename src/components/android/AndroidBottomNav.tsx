import React from 'react';
import { motion } from 'motion/react';
import { Shirt, Sparkles, Shuffle, BookmarkCheck, User, Layers } from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { ActiveTab } from '../../types';

export const AndroidBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, outfits, wardrobe } = useWardrobe();

  const favoriteCount = outfits.filter((o) => o.isFavorite).length;

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: any;
    highlight?: boolean;
    badge?: number;
  }[] = [
    {
      id: 'tryon',
      label: 'Mix & Match',
      icon: Sparkles,
      highlight: true,
    },
    {
      id: 'wardrobe',
      label: 'Wardrobe',
      icon: Shirt,
      badge: wardrobe.length,
    },
    {
      id: 'favorites',
      label: 'Saved',
      icon: BookmarkCheck,
      badge: favoriteCount > 0 ? favoriteCount : undefined,
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
  ];

  return (
    <nav
      id="android-bottom-navigation"
      className="fixed bottom-0 left-0 right-0 max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto bg-white/95 backdrop-blur-xl border-t md:border-x border-[#e7e2d9] md:rounded-t-3xl px-2 pt-2 pb-5 z-40 shadow-[0_-4px_25px_rgba(41,37,36,0.08)] transition-all"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
              className="flex flex-col items-center justify-center flex-1 py-1 group relative outline-none"
            >
              {/* Material 3 Active Pill Indicator */}
              <div
                className={`relative px-3 sm:px-4 py-1 rounded-full transition-all duration-300 flex items-center justify-center ${
                  isActive
                    ? item.highlight
                      ? 'bg-gradient-to-r from-[#8c5836] to-[#b47043] text-white shadow-md shadow-[#8c5836]/25'
                      : 'bg-[#f0e9df] text-[#784a2c] shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 hover:bg-stone-100/70'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.75]'
                  }`}
                />

                {/* Optional Badge */}
                {item.badge !== undefined && (
                  <span
                    className={`absolute -top-1.5 -right-1 text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center ${
                      isActive
                        ? 'bg-stone-900 text-white'
                        : 'bg-[#8c5836] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Text Label */}
              <span
                className={`text-[11px] mt-1 tracking-tight transition-colors duration-200 ${
                  isActive
                    ? item.highlight
                      ? 'text-[#8c5836] font-extrabold'
                      : 'text-stone-900 font-extrabold'
                    : 'text-stone-500 font-medium group-hover:text-stone-800'
                }`}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Android System Gesture Navigation Pill */}
      <div className="w-32 h-1 bg-stone-300 rounded-full mx-auto mt-2"></div>
    </nav>
  );
};
