export type ClothingClassification =
  | 'Tops'
  | 'Bottoms'
  | 'Footwear'
  | 'Outerwear'
  | 'Accessories';

export type SeasonSuitability = 'Warm' | 'Cold' | 'Rainy' | 'All-weather';

export interface ClothingItem {
  id: string;
  name: string;
  classification: ClothingClassification;
  subType: string;
  color: string;
  colorName: string;
  secondaryColor?: string;
  warmthLevel: number; // 1 to 5
  seasonSuitability: SeasonSuitability;
  brand?: string;
  tags: string[];
  imageUrl: string;
  dateAdded: string;
  lastWorn?: string;
  wearCount: number;
  isFavorite?: boolean;
  notes?: string;
}

export interface OutfitCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  isCustom?: boolean;
  colorAccent: string;
  defaultOccasion?: string;
}

export interface Outfit {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  itemIds: string[];
  weatherScore?: number;
  weatherSnapshot?: {
    tempC: number;
    condition: string;
    city: string;
    rainChance?: number;
  };
  rationale?: string;
  stylingTips?: string[];
  colorHarmony?: string;
  createdAt: string;
  isFavorite: boolean;
  lastWorn?: string;
}

export interface WeatherData {
  city: string;
  lat: number;
  lon: number;
  tempC: number;
  feelsLikeC: number;
  humidity: number;
  precipitation: number;
  rainChance: number;
  windSpeedKmH: number;
  condition: string;
  icon: string;
  summary: string;
  highTempC: number;
  lowTempC: number;
  timestamp: string;
}

export type BiologicalSex = 'male' | 'female';

export interface BodyTypeInfo {
  code: string; // '01'-'09' for male, '10'-'18' for female
  label: string;
  category: string;
  description: string;
  stylingTip: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  sex?: BiologicalSex;
  bodyType?: BodyTypeInfo;
  customNotes?: string;
  uploadedTryOnPhoto?: string;
}

export type ActiveTab = 'wardrobe' | 'stylist' | 'canvas' | 'tryon' | 'favorites' | 'profile';

export interface VirtualTryOnModel {
  id: string;
  name: string;
  gender: BiologicalSex;
  bodyTypeCode: string;
  bodyTypeLabel: string;
  imageUrl: string;
  heightCm?: number;
  description: string;
}

export interface VirtualTryOnResult {
  fitScore: number;
  silhouetteAnalysis: string;
  proportionsFeedback: string;
  garmentBreakdown: Array<{
    classification: string;
    itemTitle: string;
    fitType: string;
    commentary: string;
  }>;
  bodyTypeFlatterRating: number;
  tailoringAdvice: string[];
  styleVibe: string;
  tryOnImageUrl?: string;
  engine?: string;
}

export type DeviceOrientationMode = 'auto' | 'tablet-portrait' | 'tablet-landscape' | 'mobile';

export type BodyViewType = 'front' | 'left' | 'right' | 'back';

export interface ImageQualityValidationResult {
  isValid: boolean;
  brightnessScore: number; // 0 - 100
  isTooDark: boolean;
  isTooBright: boolean;
  blurScore: number; // 0 - 100
  isBlurry: boolean;
  framingScore: number; // 0 - 100
  isProperAspectRatio: boolean;
  aspectRatio: number;
  issues: string[];
  feedbackMessage: string;
}

export interface BodyViewImage {
  viewType: BodyViewType;
  imageUrl: string;
  validation: ImageQualityValidationResult;
  capturedAt: string;
}

export interface UserBodyProfile {
  id: string;
  userId: string;
  views: {
    front?: BodyViewImage;
    left?: BodyViewImage;
    right?: BodyViewImage;
    back?: BodyViewImage;
  };
  bodyMetrics: {
    heightCm?: number;
    generalProportions?: string;
    detectedAspect?: number;
  };
  status: 'incomplete' | 'ready';
  createdAt: string;
  updatedAt: string;
}

export interface TryOnGenerationProgress {
  stage: string;
  percent: number;
  subtext: string;
}

export interface TryOnGenerationResult {
  success: boolean;
  generatedImageUrl: string;
  viewAngle: BodyViewType;
  fitScore: number;
  garmentBreakdown: Array<{
    classification: string;
    itemTitle: string;
    fitType: string;
    commentary: string;
  }>;
  silhouetteAnalysis: string;
  proportionsFeedback: string;
  tailoringAdvice: string[];
  styleVibe: string;
  engine: string;
  provider: string;
  disclaimer: string;
  cachedAt?: string;
}

export interface GeminiOutfitResult {
  outfitName: string;
  selectedItemIds: string[];
  categoryMatch: string;
  weatherCompatibility: string;
  weatherScore: number;
  colorHarmony: string;
  stylingTips: string[];
  alternativeSuggestions?: string[];
  engine?: string;
}

export interface RecommendationSet {
  id: string;
  recommendations: GeminiOutfitResult[];
  generatedAt: string;
  categoryId: string;
  weatherSnapshot?: {
    tempC: number;
    condition: string;
    city: string;
  };
}

