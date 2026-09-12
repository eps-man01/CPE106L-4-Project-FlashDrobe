import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import {
  ClothingItem,
  OutfitCategory,
  Outfit,
  WeatherData,
  UserProfile,
  ActiveTab,
  DeviceOrientationMode,
  GeminiOutfitResult,
  BodyAnalysisResult,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_WARDROBE,
  INITIAL_USER_PROFILE,
} from '../data/initialWardrobe';
import { FirestoreService } from '../services/FirestoreService';
import { useConnectivity } from './ConnectivityContext';

interface WardrobeContextType {
  // Auth state
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  authLoading: boolean;
  authError: string | null;
  userId: string | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  wardrobe: ClothingItem[];
  categories: OutfitCategory[];
  outfits: Outfit[];
  weather: WeatherData | null;
  isWeatherLoading: boolean;
  isLocationOff: boolean;
  requestGPSWeather: () => void;
  userProfile: UserProfile;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  // Virtual Try-On
  tryOnItemIds: string[];
  setTryOnItemIds: (ids: string[]) => void;
  selectedTryOnModelId: string;
  setSelectedTryOnModelId: (id: string) => void;
  openVirtualTryOn: (itemIds?: string[], outfitTitle?: string) => void;
  uploadCustomTryOnPhoto: (photoBase64: string) => void;
  customTryOnPhoto: string | null;
  setCustomTryOnPhoto: (photo: string | null) => void;
  // Device & Orientation mode
  deviceMode: DeviceOrientationMode;
  setDeviceMode: (mode: DeviceOrientationMode) => void;
  // Item actions
  addClothingItem: (item: Omit<ClothingItem, 'id' | 'dateAdded' | 'wearCount'>) => void;
  updateClothingItem: (id: string, updates: Partial<ClothingItem>) => void;
  deleteClothingItem: (id: string) => void;
  toggleFavoriteItem: (id: string) => void;
  markItemWorn: (id: string) => void;
  // Category actions
  addCategory: (category: Omit<OutfitCategory, 'id' | 'isCustom'>) => void;
  updateCategory: (id: string, updates: Partial<OutfitCategory>) => void;
  deleteCategory: (id: string) => void;
  restoreDefaultCategories: () => void;
  // Outfit actions
  saveOutfit: (outfit: Omit<Outfit, 'id' | 'createdAt'>) => Outfit;
  deleteOutfit: (id: string) => void;
  toggleFavoriteOutfit: (id: string) => void;
  markOutfitWorn: (id: string) => void;
  // User profile
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  // Body Analysis
  analyzeBodyPhoto: (photoDataUrl: string) => Promise<BodyAnalysisResult | null>;
  isAnalyzingBody: boolean;
  // Weather
  refreshWeather: (lat?: number, lon?: number) => Promise<void>;
  // AI Stylist
  generateAIOutfit: (categoryId: string, notes?: string) => Promise<GeminiOutfitResult | null>;
  isGeneratingAI: boolean;
  currentAIRecommendation: GeminiOutfitResult | null;
  clearCurrentAIRecommendation: () => void;
  // Batch Recommendations (Carousel)
  recommendations: GeminiOutfitResult[];
  isGeneratingRecommendations: boolean;
  generateRecommendations: (categoryId: string, count?: number, notes?: string) => Promise<GeminiOutfitResult[]>;
  swapItemInRecommendation: (recIndex: number, oldItemId: string, newItemId: string) => void;
  // View mode
  isPhoneMockupView: boolean;
  setIsPhoneMockupView: (val: boolean) => void;
  resetAllData: () => void;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

const LS_KEYS = {
  WARDROBE: 'flashdrobe_items_v2',
  CATEGORIES: 'flashdrobe_categories_v2',
  OUTFITS: 'flashdrobe_outfits_v2',
  USER: 'flashdrobe_user_v2',
  AUTH_SESSION: 'flashdrobe_auth_session_v2',
};

export const WardrobeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = useConnectivity();
  const wasOfflineRef = useRef(false);

  // Firebase Auth state
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // User Profile state (initialized from localStorage, synced to Firestore)
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.USER);
      return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
    } catch {
      return INITIAL_USER_PROFILE;
    }
  });

  // Wardrobe state (localStorage only)
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.WARDROBE);
      return saved ? JSON.parse(saved) : INITIAL_WARDROBE;
    } catch {
      return INITIAL_WARDROBE;
    }
  });

  // Categories state (localStorage only)
  const [categories, setCategories] = useState<OutfitCategory[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  // Outfits state (localStorage only)
  const [outfits, setOutfits] = useState<Outfit[]>(() => {
    try {
      const saved = localStorage.getItem(LS_KEYS.OUTFITS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Weather state
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [isLocationOff, setIsLocationOff] = useState<boolean>(false);

  // App UI navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('tryon');
  const [isPhoneMockupView, setIsPhoneMockupView] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<DeviceOrientationMode>('auto');

  // Virtual Try-On state
  const [tryOnItemIds, setTryOnItemIds] = useState<string[]>(() => {
    const top = INITIAL_WARDROBE.find((i) => i.classification === 'Tops');
    const bottom = INITIAL_WARDROBE.find((i) => i.classification === 'Bottoms');
    const shoe = INITIAL_WARDROBE.find((i) => i.classification === 'Footwear');
    return [top?.id, bottom?.id, shoe?.id].filter(Boolean) as string[];
  });

  const [selectedTryOnModelId, setSelectedTryOnModelId] = useState<string>(() => {
    return userProfile.sex === 'female' ? 'model_fem_01' : 'model_male_01';
  });

  // AI generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [currentAIRecommendation, setCurrentAIRecommendation] = useState<GeminiOutfitResult | null>(null);

  // Batch recommendations state
  const [recommendations, setRecommendations] = useState<GeminiOutfitResult[]>([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState<boolean>(false);

  // Body analysis state
  const [isAnalyzingBody, setIsAnalyzingBody] = useState<boolean>(false);

  // ─── Firebase Auth Listener ─────────────────────────────
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setIsAuthLoading(false);

      if (user) {
        // Load profile from Firestore
        const existingProfile = await FirestoreService.loadUserProfile(user.uid);
        if (existingProfile) {
          setUserProfile((prev) => ({ ...existingProfile, uploadedTryOnPhoto: prev.uploadedTryOnPhoto }));
        } else {
          // New user — create profile from Google account
          const newProfile: UserProfile = {
            id: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            avatar: user.photoURL || INITIAL_USER_PROFILE.avatar,
            sex: undefined,
            bodyType: undefined,
            customNotes: '',
          };
          await FirestoreService.initializeUserData(user.uid, newProfile);
          setUserProfile(newProfile);
        }
        // Mark session active
        try {
          localStorage.setItem(LS_KEYS.AUTH_SESSION, 'true');
        } catch { /* ignore */ }
      } else {
        // User signed out — reset
        setUserProfile(INITIAL_USER_PROFILE);
        setWardrobe(INITIAL_WARDROBE);
        setCategories(INITIAL_CATEGORIES);
        setOutfits([]);
        try {
          localStorage.removeItem(LS_KEYS.AUTH_SESSION);
        } catch { /* ignore */ }
      }
    });

    return () => unsubscribe();
  }, []);

  // ─── Firebase Auth ──────────────────────────────────────
  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setAuthError(err.message || 'Sign-in failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setActiveTab('tryon');
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  const isAuthenticated = !!firebaseUser;
  const userId = firebaseUser?.uid || null;

  // ─── Sync to localStorage ───────────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.WARDROBE, JSON.stringify(wardrobe));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [wardrobe]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.OUTFITS, JSON.stringify(outfits));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [outfits]);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEYS.USER, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [userProfile]);

  // ─── Sync profile to Firestore (debounced) ──────────────
  const profileTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!userId) return;
    if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
    profileTimeoutRef.current = setTimeout(() => {
      FirestoreService.saveUserProfile(userId, userProfile);
    }, 2000);
    return () => {
      if (profileTimeoutRef.current) clearTimeout(profileTimeoutRef.current);
    };
  }, [userProfile, userId]);

  // ─── Model gender sync ──────────────────────────────────
  useEffect(() => {
    if (userProfile.sex === 'female' && selectedTryOnModelId.startsWith('model_male')) {
      setSelectedTryOnModelId('model_fem_01');
    } else if (userProfile.sex === 'male' && selectedTryOnModelId.startsWith('model_fem')) {
      setSelectedTryOnModelId('model_male_01');
    }
  }, [userProfile.sex, selectedTryOnModelId]);

  // ─── Virtual Try-On ─────────────────────────────────────
  const openVirtualTryOn = useCallback((itemIds?: string[], _outfitTitle?: string) => {
    if (itemIds && itemIds.length > 0) {
      setTryOnItemIds(itemIds);
    }
    setActiveTab('tryon');
  }, []);

  const uploadCustomTryOnPhoto = useCallback((photoBase64: string) => {
    updateUserProfile({ uploadedTryOnPhoto: photoBase64 });
  }, []);

  // ─── Body Analysis ───────────────────────────────────
  const analyzeBodyPhoto = useCallback(async (photoDataUrl: string): Promise<BodyAnalysisResult | null> => {
    setIsAnalyzingBody(true);
    try {
      const response = await fetch('/api/analyze-body', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ frontPhotoDataUrl: photoDataUrl }),
      });
      if (!response.ok) throw new Error('Body analysis failed');
      const result = await response.json();
      if (result.success && result.analysis) {
        const analysis: BodyAnalysisResult = result.analysis;
        updateUserProfile({
          heightCm: analysis.heightCm,
          weightKg: analysis.weightKg,
          sex: analysis.sex,
          bodyType: {
            code: analysis.bodyTypeCode,
            label: analysis.bodyTypeLabel,
            category: analysis.buildCategory,
            description: analysis.bodyProportions,
            stylingTip: analysis.stylingRules.join(' '),
          },
          bodyAnalysis: analysis,
        });
        return analysis;
      }
      return null;
    } catch (err) {
      console.error('Body analysis failed:', err);
      return null;
    } finally {
      setIsAnalyzingBody(false);
    }
  }, []);

  // ─── Weather ────────────────────────────────────────────
  const refreshWeather = useCallback(async (lat?: number, lon?: number) => {
    if (lat === undefined || lon === undefined) {
      setWeather(null);
      setIsLocationOff(true);
      return;
    }

    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }

    setIsWeatherLoading(true);
    try {
      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!response.ok) throw new Error('Failed to fetch weather');
      const data: WeatherData = await response.json();
      setWeather(data);
      setIsLocationOff(false);
    } catch (error) {
      console.error('Weather error:', error);
      setWeather(null);
      setIsLocationOff(true);
    } finally {
      setIsWeatherLoading(false);
    }
  }, [isOnline]);

  const requestGPSWeather = useCallback(() => {
    if (!navigator.geolocation) {
      setWeather(null);
      setIsLocationOff(true);
      return;
    }

    setIsWeatherLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        refreshWeather(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        console.warn('Geolocation error / disabled:', err);
        setWeather(null);
        setIsLocationOff(true);
        setIsWeatherLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [refreshWeather]);

  useEffect(() => {
    requestGPSWeather();
  }, [requestGPSWeather]);

  useEffect(() => {
    if (isOnline && wasOfflineRef.current) {
      wasOfflineRef.current = false;
      requestGPSWeather();
    }
  }, [isOnline, requestGPSWeather]);

  // ─── Clothing Item Operations ───────────────────────────
  const addClothingItem = (itemData: Omit<ClothingItem, 'id' | 'dateAdded' | 'wearCount'>) => {
    const newItem: ClothingItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      dateAdded: new Date().toISOString().split('T')[0],
      wearCount: 0,
    };
    setWardrobe((prev) => [newItem, ...prev]);
  };

  const updateClothingItem = (id: string, updates: Partial<ClothingItem>) => {
    setWardrobe((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const deleteClothingItem = (id: string) => {
    setWardrobe((prev) => prev.filter((item) => item.id !== id));
    setOutfits((prev) =>
      prev.map((outfit) => ({
        ...outfit,
        itemIds: outfit.itemIds.filter((itemId) => itemId !== id),
      }))
    );
  };

  const toggleFavoriteItem = (id: string) => {
    setWardrobe((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    );
  };

  const markItemWorn = (id: string) => {
    setWardrobe((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              wearCount: item.wearCount + 1,
              lastWorn: new Date().toISOString(),
            }
          : item
      )
    );
  };

  // ─── Category Operations ────────────────────────────────
  const addCategory = (catData: Omit<OutfitCategory, 'id' | 'isCustom'>) => {
    const newCat: OutfitCategory = {
      ...catData,
      id: `cat_custom_${Date.now()}`,
      isCustom: true,
    };
    setCategories((prev) => [...prev, newCat]);
  };

  const updateCategory = (id: string, updates: Partial<OutfitCategory>) => {
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? { ...cat, ...updates } : cat))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((cat) => cat.id !== id));
  };

  const restoreDefaultCategories = () => {
    setCategories(INITIAL_CATEGORIES);
  };

  // ─── Outfit Operations ──────────────────────────────────
  const saveOutfit = (outfitData: Omit<Outfit, 'id' | 'createdAt'>): Outfit => {
    const newOutfit: Outfit = {
      ...outfitData,
      id: `outfit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setOutfits((prev) => [newOutfit, ...prev]);
    return newOutfit;
  };

  const deleteOutfit = (id: string) => {
    setOutfits((prev) => prev.filter((o) => o.id !== id));
  };

  const toggleFavoriteOutfit = (id: string) => {
    setOutfits((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isFavorite: !o.isFavorite } : o))
    );
  };

  const markOutfitWorn = (id: string) => {
    const target = outfits.find((o) => o.id === id);
    if (target) {
      target.itemIds.forEach((itemId) => markItemWorn(itemId));
      setOutfits((prev) =>
        prev.map((o) => (o.id === id ? { ...o, lastWorn: new Date().toISOString() } : o))
      );
    }
  };

  // ─── User Profile ───────────────────────────────────────
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => ({ ...prev, ...updates }));
  };

  // ─── AI Generation ──────────────────────────────────────
  const generateAIOutfit = async (categoryId: string, notes?: string): Promise<GeminiOutfitResult | null> => {
    if (!isOnline) return null;

    const targetCategory = categories.find((c) => c.id === categoryId);
    const categoryName = targetCategory ? targetCategory.name : 'Casual Wear';

    setIsGeneratingAI(true);
    try {
      const response = await fetch('/api/recommend-outfit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardrobe,
          category: categoryName,
          weather,
          userPreferences: {
            notes: userProfile.customNotes,
            sex: userProfile.sex,
            bodyType: userProfile.bodyType
              ? `${userProfile.bodyType.label} (Type ${userProfile.bodyType.code} - ${userProfile.bodyType.category})`
              : undefined,
            bodyTypeDescription: userProfile.bodyType?.description,
            bodyTypeStylingTip: userProfile.bodyType?.stylingTip,
            heightCm: userProfile.heightCm,
            weightKg: userProfile.weightKg,
            bodyProportions: userProfile.bodyAnalysis?.bodyProportions,
            stylingRules: userProfile.bodyAnalysis?.stylingRules,
          },
          occasionNotes: notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.recommendation) {
        const fullRec: GeminiOutfitResult = {
          ...result.recommendation,
          engine: result.engine || 'Flashdrobe AI Stylist',
        };
        setCurrentAIRecommendation(fullRec);
        return fullRec;
      }
      return null;
    } catch (error) {
      console.error('AI generation failed:', error);
      return null;
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const clearCurrentAIRecommendation = () => {
    setCurrentAIRecommendation(null);
  };

  const generateRecommendations = async (
    categoryId: string,
    count: number = 3,
    notes?: string
  ): Promise<GeminiOutfitResult[]> => {
    if (!isOnline) return [];

    const targetCategory = categories.find((c) => c.id === categoryId);
    const categoryName = targetCategory ? targetCategory.name : 'Casual Wear';

    setIsGeneratingRecommendations(true);
    try {
      const response = await fetch('/api/recommend-outfit/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wardrobe,
          category: categoryName,
          weather,
          userPreferences: {
            notes: userProfile.customNotes,
            sex: userProfile.sex,
            bodyType: userProfile.bodyType
              ? `${userProfile.bodyType.label} (Type ${userProfile.bodyType.code} - ${userProfile.bodyType.category})`
              : undefined,
            bodyTypeDescription: userProfile.bodyType?.description,
            bodyTypeStylingTip: userProfile.bodyType?.stylingTip,
            heightCm: userProfile.heightCm,
            weightKg: userProfile.weightKg,
            bodyProportions: userProfile.bodyAnalysis?.bodyProportions,
            stylingRules: userProfile.bodyAnalysis?.stylingRules,
          },
          occasionNotes: notes,
          count,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const result = await response.json();
      if (result.success && result.recommendations) {
        const recs: GeminiOutfitResult[] = result.recommendations.map((r: any) => ({
          ...r,
          engine: result.engine || 'Flashdrobe AI Stylist',
        }));
        setRecommendations(recs);
        return recs;
      }
      return [];
    } catch (error) {
      console.error('Batch recommendation failed:', error);
      return [];
    } finally {
      setIsGeneratingRecommendations(false);
    }
  };

  const swapItemInRecommendation = (recIndex: number, oldItemId: string, newItemId: string) => {
    setRecommendations((prev) => {
      const updated = [...prev];
      if (!updated[recIndex]) return prev;
      const rec = { ...updated[recIndex] };
      rec.selectedItemIds = rec.selectedItemIds.map((id) =>
        id === oldItemId ? newItemId : id
      );
      updated[recIndex] = rec;
      return updated;
    });
  };

  // ─── Reset All Data ─────────────────────────────────────
  const resetAllData = () => {
    setWardrobe(INITIAL_WARDROBE);
    setCategories(INITIAL_CATEGORIES);
    setOutfits([]);
    localStorage.removeItem(LS_KEYS.WARDROBE);
    localStorage.removeItem(LS_KEYS.CATEGORIES);
    localStorage.removeItem(LS_KEYS.OUTFITS);
  };

  return (
    <WardrobeContext.Provider
      value={{
        isAuthenticated,
        isAuthLoading,
        authLoading: isAuthLoading,
        authError,
        userId,
        loginWithGoogle,
        logout,
        wardrobe,
        categories,
        outfits,
        weather,
        isWeatherLoading,
        isLocationOff,
        requestGPSWeather,
        userProfile,
        activeTab,
        setActiveTab,
        tryOnItemIds,
        setTryOnItemIds,
        selectedTryOnModelId,
        setSelectedTryOnModelId,
        openVirtualTryOn,
        uploadCustomTryOnPhoto,
        customTryOnPhoto: userProfile.uploadedTryOnPhoto || null,
        setCustomTryOnPhoto: (photo: string | null) =>
          updateUserProfile({ uploadedTryOnPhoto: photo || undefined }),
        analyzeBodyPhoto,
        isAnalyzingBody,
        deviceMode,
        setDeviceMode,
        addClothingItem,
        updateClothingItem,
        deleteClothingItem,
        toggleFavoriteItem,
        markItemWorn,
        addCategory,
        updateCategory,
        deleteCategory,
        restoreDefaultCategories,
        saveOutfit,
        deleteOutfit,
        toggleFavoriteOutfit,
        markOutfitWorn,
        updateUserProfile,
        refreshWeather,
        generateAIOutfit,
        isGeneratingAI,
        currentAIRecommendation,
        clearCurrentAIRecommendation,
        recommendations,
        isGeneratingRecommendations,
        generateRecommendations,
        swapItemInRecommendation,
        isPhoneMockupView,
        setIsPhoneMockupView,
        resetAllData,
      }}
    >
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = () => {
  const context = useContext(WardrobeContext);
  if (!context) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
};
