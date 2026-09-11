import React from 'react';
import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { useColorScheme, PALETTES, ColorPalette } from '../../hooks/useColorScheme';

export const ColorSchemePicker: React.FC = () => {
  const { palette, setPalette } = useColorScheme();

  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ backgroundColor: 'var(--md-surface-container)' }}
    >
      <div className="flex items-center justify-between">
        <h4
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: 'var(--md-on-surface-variant)' }}
        >
          Color Scheme
        </h4>
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: 'var(--md-primary-container)',
            color: 'var(--md-on-primary-container)',
          }}
        >
          {PALETTES.find((p) => p.id === palette)?.label}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {PALETTES.map((p) => {
          const isActive = palette === p.id;
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => setPalette(p.id)}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 600, damping: 18 }}
              className="relative flex-1 flex flex-col items-center gap-1.5 py-2 rounded-xl transition-all"
              style={{
                backgroundColor: isActive ? 'var(--md-surface-container-high)' : 'transparent',
                outline: isActive ? `2px solid ${p.primary}` : '2px solid transparent',
                outlineOffset: '-2px',
              }}
            >
              {/* Color dots */}
              <div className="flex items-center gap-1">
                <div
                  className="w-5 h-5 rounded-full"
                  style={{ backgroundColor: p.primary }}
                />
                <div
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ backgroundColor: p.secondary }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: p.tertiary }}
                />
              </div>

              {/* Label */}
              <span
                className="text-[10px] font-semibold"
                style={{
                  color: isActive ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)',
                }}
              >
                {p.label}
              </span>

              {/* Check indicator */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                  className="w-4 h-4 rounded-full flex items-center justify-center absolute -top-1 -right-1"
                  style={{
                    backgroundColor: p.primary,
                  }}
                >
                  <Check className="w-2.5 h-2.5" style={{ color: '#fff' }} strokeWidth={3} />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
