import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  ClothingItem,
  OutfitCategory,
  Outfit,
  WeatherData,
  UserProfile,
  ClothingClassification,
  BiologicalSex,
  BodyTypeInfo,
  ActiveTab,
  DeviceOrientationMode,
  GeminiOutfitResult,
  RecommendationSet,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_WARDROBE,
  INITIAL_USER_PROFILE,
} from '../data/initialWardrobe';
import { useConnectivity } from './ConnectivityContext';

interface StoredAccount extends UserProfile {
  password?: string;
}

const DEFAULT_ACCOUNTS: StoredAccount[] = [
  {
    ...INITIAL_USER_PROFILE,
    password: 'password123',
  },
];

interface WardrobeContextType {
  // Auth state
  isAuthenticated: boolean;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  signup: (data: {
    name: string;
    email: string;
    password?: string;
    sex: BiologicalSex;
    bodyType: BodyTypeInfo;
    uploadedTryOnPhoto?: string;
  }) => { success: boolean; error?: string };
  logout: () => void;
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

const STORAGE_KEYS = {
  WARDROBE: 'flashdrobe_items_v2',
  CATEGORIES: 'flashdrobe_categories_v2',
  OUTFITS: 'flashdrobe_outfits_v2',
  USER: 'flashdrobe_user_v2',
  AUTH_SESSION: 'flashdrobe_auth_session_v2',
  ACCOUNTS: 'flashdrobe_accounts_v2',
};

export const WardrobeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isOnline } = useConnectivity();
  const wasOfflineRef = useRef(false);

  // Accounts state
  const [accounts, setAccounts] = useState<StoredAccount[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return saved ? JSON.parse(saved) : DEFAULT_ACCOUNTS;
    } catch {
      return DEFAULT_ACCOUNTS;
    }
  });

  // User Profile state
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : INITIAL_USER_PROFILE;
    } catch {
      return INITIAL_USER_PROFILE;
    }
  });

  // Auth session state: one-time login/signup until user explicitly logs out
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_SESSION) === 'true';
    } catch {
      return false;
    }
  });

  // Wardrobe state
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WARDROBE);
      return saved ? JSON.parse(saved) : INITIAL_WARDROBE;
    } catch {
      return INITIAL_WARDROBE;
    }
  });

  // Categories state
  const [categories, setCategories] = useState<OutfitCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });

  // Outfits state - clean empty default
  const [outfits, setOutfits] = useState<Outfit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.OUTFITS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Weather state - strictly dynamic with GPS
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [isLocationOff, setIsLocationOff] = useState<boolean>(false);

  // App UI navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('tryon');
  const [isPhoneMockupView, setIsPhoneMockupView] = useState<boolean>(false);
  const [deviceMode, setDeviceMode] = useState<DeviceOrientationMode>('auto');

  // Virtual Try-On state
  const [tryOnItemIds, setTryOnItemIds] = useState<string[]>(() => {
    // Default to the first top, bottom, footwear if available
    const top = INITIAL_WARDROBE.find((i) => i.classification === 'Tops');
    const bottom = INITIAL_WARDROBE.find((i) => i.classification === 'Bottoms');
    const shoe = INITIAL_WARDROBE.find((i) => i.classification === 'Footwear');
    return [top?.id, bottom?.id, shoe?.id].filter(Boolean) as string[];
  });

  const [selectedTryOnModelId, setSelectedTryOnModelId] = useState<string>(() => {
    return userProfile.sex === 'female' ? 'model_fem_01' : 'model_male_01';
  });

  // Keep default model gender aligned with user profile
  useEffect(() => {
    if (userProfile.sex === 'female' && selectedTryOnModelId.startsWith('model_male')) {
      setSelectedTryOnModelId('model_fem_01');
    } else if (userProfile.sex === 'male' && selectedTryOnModelId.startsWith('model_fem')) {
      setSelectedTryOnModelId('model_male_01');
    }
  }, [userProfile.sex, selectedTryOnModelId]);

  // Dedicated action to open Virtual Try-On with specific items
  const openVirtualTryOn = useCallback((itemIds?: string[], outfitTitle?: string) => {
    if (itemIds && itemIds.length > 0) {
      setTryOnItemIds(itemIds);
    }
    setActiveTab('tryon');
  }, []);

  const uploadCustomTryOnPhoto = useCallback((photoBase64: string) => {
    updateUserProfile({ uploadedTryOnPhoto: photoBase64 });
  }, []);

  // AI generation state
  const [isGeneratingAI, setIsGeneratingAI] = useState<boolean>(false);
  const [currentAIRecommendation, setCurrentAIRecommendation] = useState<GeminiOutfitResult | null>(null);

  // Batch recommendations state (for carousel)
  const [recommendations, setRecommendations] = useState<GeminiOutfitResult[]>([]);
  const [isGeneratingRecommendations, setIsGeneratingRecommendations] = useState<boolean>(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WARDROBE, JSON.stringify(wardrobe));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [wardrobe]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.OUTFITS, JSON.stringify(outfits));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [outfits]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userProfile));
    } catch (e) {
      console.warn('LocalStorage save error', e);
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.warn('LocalStorage save accounts error', e);
    }
  }, [accounts]);

  // Weather fetching with GPS coordinates
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
      // When GPS or weather fetch fails, no weather showing
      setWeather(null);
      setIsLocationOff(true);
    } finally {
      setIsWeatherLoading(false);
    }
  }, [isOnline]);

  // Dedicated function to query device GPS location
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

  // Initial GPS check on mount
  useEffect(() => {
    requestGPSWeather();
  }, [requestGPSWeather]);

  // Auto-retry weather when connection is restored after being offline
  useEffect(() => {
    if (isOnline && wasOfflineRef.current) {
      wasOfflineRef.current = false;
      requestGPSWeather();
    }
  }, [isOnline, requestGPSWeather]);

  // Clothing Item Operations
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
    // Also remove from any outfit that contains it
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

  // Category Operations
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

  // Outfit Operations
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

  // User Profile & Authentication
  const updateUserProfile = (updates: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...prev, ...updates };
      setAccounts((prevAccounts) =>
        prevAccounts.map((acc) => (acc.id === prev.id ? { ...acc, ...updates } : acc))
      );
      return next;
    });
  };

  const login = (email: string, password?: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    const account = accounts.find((a) => a.email.toLowerCase() === trimmedEmail);

    if (!account) {
      return {
        success: false,
        error: 'No account found with this email. Please check your credentials or create an account.',
      };
    }

    if (password && account.password && account.password !== password) {
      return {
        success: false,
        error: 'Incorrect password. Please verify and try again.',
      };
    }

    setUserProfile(account);
    setIsAuthenticated(true);
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(account));
    } catch (e) {
      console.warn(e);
    }
    return { success: true };
  };

  const signup = (data: {
    name: string;
    email: string;
    password?: string;
    sex: BiologicalSex;
    bodyType: BodyTypeInfo;
    uploadedTryOnPhoto?: string;
  }) => {
    const trimmedEmail = data.email.trim().toLowerCase();
    if (accounts.some((a) => a.email.toLowerCase() === trimmedEmail)) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please log in instead.',
      };
    }

    const newAccount: StoredAccount = {
      id: `user_${Date.now()}`,
      name: data.name.trim(),
      email: trimmedEmail,
      password: data.password || 'password123',
      avatar:
        data.uploadedTryOnPhoto ||
        (data.sex === 'female'
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80'),
      sex: data.sex,
      bodyType: data.bodyType,
      customNotes: '',
      uploadedTryOnPhoto: data.uploadedTryOnPhoto,
    };

    setAccounts((prev) => [...prev, newAccount]);
    setUserProfile(newAccount);
    setIsAuthenticated(true);
    setActiveTab('tryon');
    try {
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newAccount));
    } catch (e) {
      console.warn(e);
    }
    return { success: true };
  };

  const logout = () => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    } catch (e) {
      console.warn(e);
    }
    setActiveTab('tryon');
  };

  // Gemini AI Generation
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

  // Generate multiple outfit recommendations for carousel
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

  // Swap an item within a specific recommendation
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

  const resetAllData = () => {
    setWardrobe(INITIAL_WARDROBE);
    setCategories(INITIAL_CATEGORIES);
    setUserProfile(INITIAL_USER_PROFILE);
    setOutfits([]);
    localStorage.removeItem(STORAGE_KEYS.WARDROBE);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.OUTFITS);
    localStorage.removeItem(STORAGE_KEYS.USER);
  };

  return (
    <WardrobeContext.Provider
      value={{
        isAuthenticated,
        login,
        signup,
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
