import React from 'react';
import { motion } from 'motion/react';
import { Shirt, Sparkles, BookmarkCheck, User } from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { ActiveTab } from '../../types';

export const AndroidBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, outfits, wardrobe } = useWardrobe();

  const favoriteCount = outfits.filter((o) => o.isFavorite).length;

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: any;
    badge?: number;
  }[] = [
    {
      id: 'tryon',
      label: 'Mix & Match',
      icon: Sparkles,
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
      className="fixed bottom-0 left-0 right-0 max-w-lg md:max-w-3xl lg:max-w-4xl mx-auto px-3 pt-1.5 pb-4 z-40 transition-all"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--md-surface-container) 90%, transparent)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid var(--md-outline-variant)',
      }}
    >
      <div className="flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 600, damping: 18 }}
              className="flex flex-col items-center justify-center flex-1 py-1.5 group relative outline-none"
            >
              {/* Active Indicator — Wide Pill */}
              <div
                className="relative px-5 sm:px-6 py-1.5 rounded-full transition-all duration-300 flex items-center justify-center"
                style={{
                  backgroundColor: isActive
                    ? 'var(--md-secondary-container)'
                    : 'transparent',
                }}
              >
                <Icon
                  className="w-5 h-5 transition-all duration-300"
                  style={{
                    color: isActive
                      ? 'var(--md-on-secondary-container)'
                      : 'var(--md-on-surface-variant)',
                    strokeWidth: isActive ? 2.4 : 1.75,
                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                  }}
                />

                {/* Badge */}
                {item.badge !== undefined && (
                  <span
                    className="absolute -top-1 -right-0.5 text-[9px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--md-primary)',
                      color: 'var(--md-on-primary)',
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className="text-[11px] mt-1 tracking-tight transition-colors duration-200 font-medium"
                style={{
                  color: isActive
                    ? 'var(--md-on-surface)'
                    : 'var(--md-on-surface-variant)',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {item.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
