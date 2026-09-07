import React, { useState } from 'react';
import {
  Sparkles,
  Sun,
  CloudRain,
  Heart,
  Bookmark,
  CheckCircle2,
  RefreshCw,
  Sliders,
  ChevronRight,
  Info,
  GraduationCap,
  Coffee,
  Briefcase,
  Dumbbell,
  Building2,
  Plane,
  Palmtree,
  Calendar,
  Layers,
  Thermometer,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { WeatherWidget } from '../weather/WeatherWidget';
import { ClothingItem } from '../../types';
import { ManageCategoriesModal } from '../categories/ManageCategoriesModal';

export const AIStylistView: React.FC = () => {
  const {
    categories,
    wardrobe,
    weather,
    generateAIOutfit,
    isGeneratingAI,
    currentAIRecommendation,
    saveOutfit,
    markOutfitWorn,
    setActiveTab,
    openVirtualTryOn,
    userProfile,
  } = useWardrobe();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    categories[0]?.id || ''
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [occasionNotes, setOccasionNotes] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);
  const [isMarkedWorn, setIsMarkedWorn] = useState(false);
  const [lastSavedOutfitId, setLastSavedOutfitId] = useState<string | null>(null);

  // Keep selectedCategoryId in sync if categories are added or removed
  React.useEffect(() => {
    if (categories.length > 0) {
      if (!categories.some((c) => c.id === selectedCategoryId)) {
        setSelectedCategoryId(categories[0].id);
      }
    } else {
      setSelectedCategoryId('');
    }
  }, [categories, selectedCategoryId]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

  const getCategoryIcon = (iconName: string) => {
    switch (iconName) {
      case 'GraduationCap':
        return <GraduationCap className="w-4 h-4" />;
      case 'Coffee':
        return <Coffee className="w-4 h-4" />;
      case 'Briefcase':
        return <Briefcase className="w-4 h-4" />;
      case 'Dumbbell':
        return <Dumbbell className="w-4 h-4" />;
      case 'Building2':
        return <Building2 className="w-4 h-4" />;
      case 'Plane':
        return <Plane className="w-4 h-4" />;
      case 'Palmtree':
        return <Palmtree className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const handleGenerate = async () => {
    setIsSaved(false);
    setIsMarkedWorn(false);
    await generateAIOutfit(selectedCategoryId, occasionNotes);
  };

  const handleSaveToFavorites = () => {
    if (!currentAIRecommendation) return;
    const newOutfit = saveOutfit({
      name: currentAIRecommendation.outfitName,
      categoryId: selectedCategory.id,
      categoryName: selectedCategory.name,
      itemIds: currentAIRecommendation.selectedItemIds,
      weatherScore: currentAIRecommendation.weatherScore,
      weatherSnapshot: weather
        ? {
            tempC: weather.tempC,
            condition: weather.condition,
            city: weather.city,
            rainChance: weather.rainChance,
          }
        : undefined,
      rationale: currentAIRecommendation.weatherCompatibility,
      stylingTips: currentAIRecommendation.stylingTips,
      colorHarmony: currentAIRecommendation.colorHarmony,
      isFavorite: true,
    });
    setLastSavedOutfitId(newOutfit.id);
    setIsSaved(true);
  };

  const handleWearToday = () => {
    if (lastSavedOutfitId) {
      markOutfitWorn(lastSavedOutfitId);
    } else if (currentAIRecommendation) {
      const saved = saveOutfit({
        name: currentAIRecommendation.outfitName,
        categoryId: selectedCategory.id,
        categoryName: selectedCategory.name,
        itemIds: currentAIRecommendation.selectedItemIds,
        weatherScore: currentAIRecommendation.weatherScore,
        weatherSnapshot: weather
          ? {
              tempC: weather.tempC,
              condition: weather.condition,
              city: weather.city,
              rainChance: weather.rainChance,
            }
          : undefined,
        rationale: currentAIRecommendation.weatherCompatibility,
        stylingTips: currentAIRecommendation.stylingTips,
        colorHarmony: currentAIRecommendation.colorHarmony,
        isFavorite: false,
      });
      setLastSavedOutfitId(saved.id);
      markOutfitWorn(saved.id);
    }
    setIsMarkedWorn(true);
  };

  // Find the actual clothing items from the recommendation
  const recommendedItems = (currentAIRecommendation?.selectedItemIds || [])
    .map((id) => wardrobe.find((i) => i.id === id))
    .filter(Boolean) as ClothingItem[];

  return (
    <div id="ai-stylist-view-root" className="space-y-4 pb-24 text-stone-900">
      {/* Live Weather Widget */}
      <WeatherWidget />

      {/* Outfit Category Selector Section */}
      <div className="bg-white border border-[#e7e2d9] rounded-3xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
              1. Select Outfit Category
            </span>
          </div>
          <button
            onClick={() => setIsCategoryModalOpen(true)}
            className="text-[11px] text-[#8c5836] hover:text-[#784a2c] font-bold flex items-center space-x-0.5"
          >
            <span>Manage Categories</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Categories Carousel or Empty State */}
        {categories.length > 0 ? (
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
            {categories.map((cat) => {
              const isSelected = selectedCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  id={`btn-cat-${cat.id}`}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`flex flex-col items-center p-3 rounded-2xl min-w-[102px] border transition-all duration-200 flex-shrink-0 text-left ${
                    isSelected
                      ? 'bg-[#f5ede3] border-[#8c5836] shadow-xs ring-1 ring-[#8c5836]/30'
                      : 'bg-stone-50 border-[#e7e2d9] hover:bg-stone-100 text-stone-600'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#8c5836] text-white shadow-xs'
                        : 'bg-white border border-[#e7e2d9] text-stone-700'
                    }`}
                  >
                    {getCategoryIcon(cat.icon)}
                  </div>
                  <span
                    className={`text-xs font-bold truncate w-full text-center ${
                      isSelected ? 'text-[#784a2c]' : 'text-stone-800'
                    }`}
                  >
                    {cat.name}
                  </span>
                  <span className="text-[9px] text-stone-500 line-clamp-1 text-center w-full mt-0.5">
                    {cat.defaultOccasion || 'Personalized'}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-stone-50 rounded-2xl border border-dashed border-[#ddcfbe] text-center space-y-2 my-1">
            <p className="text-xs text-stone-500 font-medium">No outfit categories available.</p>
            <button
              type="button"
              onClick={() => setIsCategoryModalOpen(true)}
              className="px-3.5 py-1.5 bg-[#8c5836] hover:bg-[#784a2c] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
            >
              Add or Restore Categories
            </button>
          </div>
        )}

        {/* Occasion / Context Notes Input */}
        <div className="mt-3 pt-3 border-t border-[#e7e2d9]">
          <label className="block text-xs font-bold text-stone-700 mb-1">
            2. Specific Activity / Notes (Optional)
          </label>
          <input
            type="text"
            id="input-occasion-notes"
            value={occasionNotes}
            onChange={(e) => setOccasionNotes(e.target.value)}
            placeholder="e.g., Cold classroom presentation, gym leg day, outdoor lunch..."
            className="w-full bg-stone-50 border border-[#e7e2d9] rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8c5836] focus:bg-white"
          />
        </div>

        {/* User Body Silhouette Calibration Indicator */}
        {userProfile.bodyType && (
          <div className="mt-2.5 p-2.5 bg-[#fbf9f5] border border-[#eee9df] rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-[#f5ede3] text-[#784a2c] border border-[#e5dec9]">
                {userProfile.sex === 'female' ? 'Female' : 'Male'}
              </span>
              <span className="font-bold text-stone-800">
                Type {userProfile.bodyType.code}: {userProfile.bodyType.label}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className="text-[11px] font-bold text-[#8c5836] hover:text-[#784a2c] hover:underline"
            >
              Adjust
            </button>
          </div>
        )}

        {/* Generate Button with Earthy Warm Terracotta Styling */}
        <div className="mt-4">
          <button
            id="btn-generate-ai-outfit"
            onClick={handleGenerate}
            disabled={isGeneratingAI || wardrobe.length === 0}
            className="w-full py-3.5 bg-[#8c5836] hover:bg-[#784a2c] text-white font-extrabold rounded-2xl text-sm shadow-md shadow-[#8c5836]/20 flex items-center justify-center space-x-2 transition-all active:scale-98 disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin text-white" />
                <span>Styling your personalized outfit...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-white stroke-[2.5]" />
                <span>Generate Weather-Smart Outfit</span>
              </>
            )}
          </button>

          {wardrobe.length === 0 && (
            <div className="mt-3 p-4 bg-[#f5ede3]/70 border border-[#e5dec9] rounded-2xl text-center space-y-2">
              <p className="text-xs font-bold text-stone-800">
                Your digital closet is empty
              </p>
              <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                Snap photos of your clothes with your camera or upload from gallery to start generating weather-matched outfits.
              </p>
              <button
                onClick={() => setActiveTab('wardrobe')}
                className="mt-1 px-4 py-2 bg-[#8c5836] hover:bg-[#784a2c] text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
              >
                Go to Closet & Add Clothes
              </button>
            </div>
          )}
        </div>
      </div>

      {/* AI Recommendation Result Card */}
      {currentAIRecommendation && (
        <div
          id="ai-recommendation-card"
          className="bg-white border border-[#e7e2d9] rounded-3xl p-5 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-300 relative overflow-hidden"
        >
          {/* Subtle Ambient Background Highlight */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#f5ede3]/50 rounded-full blur-3xl pointer-events-none"></div>

          {/* Result Header */}
          <div className="flex items-start justify-between relative z-10">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#f5ede3] text-[#784a2c] border border-[#e5dec9]">
                  AI Recommendation
                </span>
                <span className="text-[10px] font-semibold text-stone-500">
                  {selectedCategory.name}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-stone-900 mt-1">
                {currentAIRecommendation.outfitName}
              </h3>
            </div>

            {/* Weather Score Badge */}
            <div className="flex flex-col items-end">
              <div className="flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-[#eef3e8] border border-[#cfdec3] text-[#4d663b]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#5e7d48]" />
                <span className="text-xs font-black">
                  {currentAIRecommendation.weatherScore}% Match
                </span>
              </div>
              <span className="text-[9px] text-stone-500 mt-0.5">Weather Rating</span>
            </div>
          </div>

          {/* Virtual Try-On Fitting Room Button */}
          <button
            id="btn-tryon-recommended-outfit"
            onClick={() =>
              openVirtualTryOn(
                currentAIRecommendation.selectedItemIds,
                currentAIRecommendation.outfitName
              )
            }
            className="w-full py-3 px-4 bg-gradient-to-r from-[#8c5836] via-[#9e6741] to-[#784a2c] hover:opacity-95 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-[#8c5836]/25 flex items-center justify-center space-x-2 transition-all transform active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-white stroke-[2.5]" />
            <span>Virtual Try-On in Fitting Room</span>
            <ChevronRight className="w-4 h-4 text-white/80" />
          </button>

          {/* Outfit Items Showcase Row */}
          <div>
            <span className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
              Selected Wardrobe Pieces ({recommendedItems.length} items)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {recommendedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-stone-50 border border-[#e7e2d9] rounded-2xl p-2 flex flex-col space-y-1.5 shadow-xs"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-stone-100">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.2 rounded bg-white/90 text-stone-800 shadow-xs border border-[#e7e2d9]">
                      {item.classification}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-[#8c5836] truncate">
                      {item.subType}
                    </p>
                    <p className="text-xs font-bold text-stone-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-stone-500">{item.colorName}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini AI Rationale & Weather Analysis */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#f9f6f0] border border-[#e7e2d9]">
            <div>
              <h4 className="text-xs font-bold text-[#8c5836] flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Why This Outfit Works</span>
              </h4>
              <p className="text-xs text-stone-700 mt-1 leading-relaxed">
                {currentAIRecommendation.weatherCompatibility}
              </p>
            </div>

            {currentAIRecommendation.colorHarmony && (
              <div className="pt-2 border-t border-[#e7e2d9]">
                <span className="text-[11px] font-bold text-stone-700">
                  Palette Synergy:{' '}
                </span>
                <span className="text-xs text-stone-600">
                  {currentAIRecommendation.colorHarmony}
                </span>
              </div>
            )}
          </div>

          {/* Styling Tips */}
          {currentAIRecommendation.stylingTips && currentAIRecommendation.stylingTips.length > 0 && (
            <div>
              <span className="block text-xs font-bold text-stone-800 mb-1.5">
                Styling & Layering Tips
              </span>
              <ul className="space-y-1 text-xs text-stone-600 list-disc list-inside">
                {currentAIRecommendation.stylingTips.map((tip, idx) => (
                  <li key={idx} className="leading-snug">
                    <span className="text-stone-800">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons: Save to Favorites & Wear Today */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#e7e2d9]">
            <button
              id="btn-save-outfit-favorites"
              onClick={handleSaveToFavorites}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all border ${
                isSaved
                  ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-xs'
                  : 'bg-white hover:bg-stone-50 text-stone-700 border-[#e7e2d9] shadow-xs'
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-600 text-rose-600' : 'text-stone-500'}`}
              />
              <span>{isSaved ? 'Saved to Looks' : 'Save to Favorites'}</span>
            </button>

            <button
              id="btn-wear-outfit-today"
              onClick={handleWearToday}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all border ${
                isMarkedWorn
                  ? 'bg-[#f0e9df] text-[#784a2c] border-[#ddcfbe] shadow-xs'
                  : 'bg-[#8c5836] hover:bg-[#784a2c] text-white border-[#8c5836] shadow-xs'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isMarkedWorn ? 'Worn Today!' : 'Wear This Today'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Category Management Modal */}
      <ManageCategoriesModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />
    </div>
  );
};
