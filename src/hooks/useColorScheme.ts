import { useState, useEffect, useCallback } from 'react';

export type ColorPalette = 'terracotta' | 'ocean' | 'forest' | 'lavender' | 'sunset';

export interface PaletteMeta {
  id: ColorPalette;
  label: string;
  primary: string;
  secondary: string;
  tertiary: string;
  surface: string;
}

export const PALETTES: PaletteMeta[] = [
  { id: 'terracotta', label: 'Terracotta', primary: '#9c5c3a', secondary: '#765849', tertiary: '#64704b', surface: '#fff8f6' },
  { id: 'ocean', label: 'Ocean', primary: '#006a6a', secondary: '#4a6267', tertiary: '#4b607c', surface: '#f4fbfb' },
  { id: 'forest', label: 'Forest', primary: '#3a6a2a', secondary: '#55624c', tertiary: '#386666', surface: '#f8faf0' },
  { id: 'lavender', label: 'Lavender', primary: '#6750a4', secondary: '#625b71', tertiary: '#7d5260', surface: '#fef7ff' },
  { id: 'sunset', label: 'Sunset', primary: '#c2553a', secondary: '#775652', tertiary: '#7c5635', surface: '#fff8f6' },
];

const LS_KEY = 'flashdrobe_color_scheme';

function applyPalette(id: ColorPalette) {
  document.documentElement.setAttribute('data-palette', id);
}

export function useColorScheme() {
  const [palette, setPaletteState] = useState<ColorPalette>(() => {
    try {
      return (localStorage.getItem(LS_KEY) as ColorPalette) || 'terracotta';
    } catch {
      return 'terracotta';
    }
  });

  useEffect(() => {
    applyPalette(palette);
  }, [palette]);

  const setPalette = useCallback((id: ColorPalette) => {
    setPaletteState(id);
    try {
      localStorage.setItem(LS_KEY, id);
    } catch { /* ignore */ }
  }, []);

  return { palette, setPalette, palettes: PALETTES };
}
