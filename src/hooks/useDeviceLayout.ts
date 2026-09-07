import { useState, useEffect } from 'react';
import { DeviceOrientationMode } from '../types';

export interface DeviceLayoutInfo {
  windowWidth: number;
  windowHeight: number;
  isTabletOrLarger: boolean;
  isLandscape: boolean;
  aspectRatio: number;
  deviceMode: DeviceOrientationMode;
  setDeviceMode: (mode: DeviceOrientationMode) => void;
  effectiveOrientation: 'portrait' | 'landscape';
  effectiveIsTablet: boolean;
}

export function useDeviceLayout(): DeviceLayoutInfo {
  const getWindowDimensions = () => {
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 };
    }
    return {
      width: window.innerWidth || document.documentElement.clientWidth || 1024,
      height: window.innerHeight || document.documentElement.clientHeight || 768,
    };
  };

  const [windowSize, setWindowSize] = useState(getWindowDimensions);
  const [deviceMode, setDeviceMode] = useState<DeviceOrientationMode>('auto');

  useEffect(() => {
    const handleResize = () => {
      setWindowSize(getWindowDimensions());
    };

    // Standard resize and orientation change events
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Modern Screen Orientation API
    if (typeof window !== 'undefined' && window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleResize);
    }

    // Media query listener for orientation
    let mql: MediaQueryList | null = null;
    if (typeof window !== 'undefined' && window.matchMedia) {
      mql = window.matchMedia('(orientation: landscape)');
      try {
        mql.addEventListener('change', handleResize);
      } catch {
        mql.addListener(handleResize);
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (typeof window !== 'undefined' && window.screen && window.screen.orientation) {
        window.screen.orientation.removeEventListener('change', handleResize);
      }
      if (mql) {
        try {
          mql.removeEventListener('change', handleResize);
        } catch {
          mql.removeListener(handleResize);
        }
      }
    };
  }, []);

  // Dynamically determine landscape from screen width vs height or matchMedia
  const hasLandscapeQuery =
    typeof window !== 'undefined' && window.matchMedia
      ? window.matchMedia('(orientation: landscape)').matches
      : false;
  const naturalIsLandscape = hasLandscapeQuery || windowSize.width > windowSize.height;

  // Tablet threshold: standard tablet minimum width (iPad/Android tablets 768px+)
  // or landscape phone/tablet with ample viewport width
  const naturalIsTablet = windowSize.width >= 768 || (Math.min(windowSize.width, windowSize.height) >= 600 && Math.max(windowSize.width, windowSize.height) >= 900);
  const aspectRatio = windowSize.width / (windowSize.height || 1);

  // Dynamic derivation: unless an explicit override is configured, automatically use the real device metrics
  let effectiveOrientation: 'portrait' | 'landscape' = naturalIsLandscape ? 'landscape' : 'portrait';
  let effectiveIsTablet = naturalIsTablet;

  if (deviceMode === 'tablet-landscape') {
    effectiveOrientation = 'landscape';
    effectiveIsTablet = true;
  } else if (deviceMode === 'tablet-portrait') {
    effectiveOrientation = 'portrait';
    effectiveIsTablet = true;
  } else if (deviceMode === 'mobile') {
    effectiveOrientation = 'portrait';
    effectiveIsTablet = false;
  }

  return {
    windowWidth: windowSize.width,
    windowHeight: windowSize.height,
    isTabletOrLarger: naturalIsTablet,
    isLandscape: naturalIsLandscape,
    aspectRatio,
    deviceMode,
    setDeviceMode,
    effectiveOrientation,
    effectiveIsTablet,
  };
}
