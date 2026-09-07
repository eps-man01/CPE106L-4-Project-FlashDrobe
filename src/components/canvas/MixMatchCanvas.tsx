import React, { useState, useMemo } from 'react';
import {
  Shuffle,
  ChevronLeft,
  ChevronRight,
  Heart,
  Save,
  CheckCircle2,
  Thermometer,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { ClothingItem, ClothingClassification } from '../../types';

export const MixMatchCanvas: React.FC = () => {
  const { wardrobe, categories, weather, saveOutfit, markOutfitWorn, openVirtualTryOn } = useWardrobe();

  const tops = useMemo(() => wardrobe.filter((i) => i.classification === 'Tops'), [wardrobe]);
  const bottoms = useMemo(() => wardrobe.filter((i) => i.classification === 'Bottoms'), [wardrobe]);
  const footwear = useMemo(() => wardrobe.filter((i) => i.classification === 'Footwear'), [wardrobe]);
  const outerwear = useMemo(() => wardrobe.filter((i) => i.classification === 'Outerwear'), [wardrobe]);
  const accessories = useMemo(() => wardrobe.filter((i) => i.classification === 'Accessories'), [wardrobe]);

  const [topIndex, setTopIndex] = useState(0);
  const [bottomIndex, setBottomIndex] = useState(0);
  const [footwearIndex, setFootwearIndex] = useState(0);
  const [outerwearIndex, setOuterwearIndex] = useState<number | null>(0);
  const [accessoryIndex, setAccessoryIndex] = useState<number | null>(0);

  const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || 'cat_casual');
  const [customLookName, setCustomLookName] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentTop = tops[topIndex] || null;
  const currentBottom = bottoms[bottomIndex] || null;
  const currentFootwear = footwear[footwearIndex] || null;
  const currentOuterwear = outerwearIndex !== null ? outerwear[outerwearIndex] || null : null;
  const currentAccessory = accessoryIndex !== null ? accessories[accessoryIndex] || null : null;

  // Next / Prev cycle helper
  const cycle = (
    listLength: number,
    currentIndex: number,
    direction: 'next' | 'prev'
  ): number => {
    if (listLength === 0) return 0;
    if (direction === 'next') {
      return (currentIndex + 1) % listLength;
    }
    return (currentIndex - 1 + listLength) % listLength;
  };

  const handleShuffle = () => {
    if (tops.length > 0) setTopIndex(Math.floor(Math.random() * tops.length));
    if (bottoms.length > 0) setBottomIndex(Math.floor(Math.random() * bottoms.length));
    if (footwear.length > 0) setFootwearIndex(Math.floor(Math.random() * footwear.length));
    if (outerwear.length > 0) {
      const includeOuter = Math.random() > 0.4;
      setOuterwearIndex(includeOuter ? Math.floor(Math.random() * outerwear.length) : null);
    }
    if (accessories.length > 0) {
      setAccessoryIndex(Math.floor(Math.random() * accessories.length));
    }
    setSaveSuccess(false);
  };

  // Weather suitability analysis
  const combinedWarmth = useMemo(() => {
    let total = 0;
    let count = 0;
    if (currentTop) {
      total += currentTop.warmthLevel;
      count++;
    }
    if (currentBottom) {
      total += currentBottom.warmthLevel;
      count++;
    }
    if (currentOuterwear) {
      total += currentOuterwear.warmthLevel;
      count++;
    }
    if (currentFootwear) {
      total += currentFootwear.warmthLevel;
      count++;
    }
    return count > 0 ? (total / count).toFixed(1) : '2.5';
  }, [currentTop, currentBottom, currentOuterwear, currentFootwear]);

  const weatherSuitabilityAssessment = useMemo(() => {
    if (!weather) {
      return {
        label: `Warmth rating: ${combinedWarmth}/5`,
        color: 'text-stone-600',
      };
    }
    const temp = weather.tempC;
    const warmth = parseFloat(combinedWarmth);
    if (temp >= 29 && warmth > 3) {
      return {
        label: 'Might feel warm for current weather',
        color: 'text-amber-700',
      };
    }
    if (temp <= 22 && warmth < 2.5) {
      return {
        label: 'Consider adding a light jacket or outerwear',
        color: 'text-[#8c5836]',
      };
    }
    return {
      label: 'Great temperature balance for today',
      color: 'text-[#5e7d48]',
    };
  }, [combinedWarmth, weather]);

  const handleSaveOutfit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemIds: string[] = [];
    if (currentTop) itemIds.push(currentTop.id);
    if (currentBottom) itemIds.push(currentBottom.id);
    if (currentFootwear) itemIds.push(currentFootwear.id);
    if (currentOuterwear) itemIds.push(currentOuterwear.id);
    if (currentAccessory) itemIds.push(currentAccessory.id);

    if (itemIds.length < 2) {
      alert('Please select at least 2 items for an outfit.');
      return;
    }

    const catObj = categories.find((c) => c.id === selectedCategory);

    saveOutfit({
      name: customLookName.trim() || `${catObj?.name || 'Custom'} Look`,
      categoryId: selectedCategory,
      categoryName: catObj?.name || 'Custom',
      itemIds,
      weatherScore: 92,
      weatherSnapshot: weather
        ? {
            tempC: weather.tempC,
            condition: weather.condition,
            city: weather.city,
            rainChance: weather.rainChance,
          }
        : undefined,
      rationale: `Custom curated look with ${combinedWarmth}/5 warmth level.`,
      stylingTips: ['Custom styled combination.'],
      isFavorite: true,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div id="mix-match-canvas-root" className="space-y-4 pb-24 text-stone-900">
      {/* Studio Header Bar */}
      <div className="flex items-center justify-between bg-white border border-[#e7e2d9] rounded-3xl p-4 shadow-sm">
        <div>
          <h2 className="text-sm font-extrabold text-stone-900 flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-[#8c5836]" />
            <span>Interactive Outfit Studio</span>
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Swipe pieces to assemble your signature look
          </p>
        </div>

        {/* Shuffle Button */}
        <button
          id="btn-shuffle-outfit"
          onClick={handleShuffle}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#8c5836] hover:bg-[#784a2c] text-white font-extrabold rounded-2xl text-xs shadow-xs active:scale-95 transition-all"
        >
          <Shuffle className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Shuffle</span>
        </button>
      </div>

      {/* Weather & Warmth Context Banner */}
      <div className="bg-white border border-[#e7e2d9] rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs shadow-xs">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-stone-700 font-bold">
            <Thermometer className="w-3.5 h-3.5 text-amber-600" />
            <span>Warmth: {combinedWarmth}/5</span>
          </div>
          <span className="text-stone-300">•</span>
          <span className={`font-semibold ${weatherSuitabilityAssessment.color}`}>
            {weatherSuitabilityAssessment.label}
          </span>
        </div>
        <span className="text-[11px] text-stone-500 font-medium">
          {weather ? `${weather.city}: ${weather.tempC}°C` : 'GPS Inactive'}
        </span>
      </div>

      {/* Main Interactive Slot Carousel Stack */}
      <div className="space-y-3">
        {/* 1. OUTERWEAR SLOT (Optional) */}
        {outerwear.length > 0 && (
          <div className="bg-white border border-[#e7e2d9] rounded-3xl p-3 shadow-xs relative">
            <div className="flex items-center justify-between mb-1.5 px-2">
              <span className="text-[11px] font-bold uppercase text-stone-500">
                Outerwear (Layer)
              </span>
              <button
                onClick={() => setOuterwearIndex(outerwearIndex === null ? 0 : null)}
                className="text-[10px] text-[#8c5836] hover:text-[#784a2c] font-bold"
              >
                {outerwearIndex === null ? '+ Add Layer' : 'Remove Layer'}
              </button>
            </div>

            {outerwearIndex !== null && currentOuterwear ? (
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setOuterwearIndex(cycle(outerwear.length, outerwearIndex, 'prev'))
                  }
                  className="p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-3 flex-1 mx-2 bg-stone-50 p-2 rounded-2xl border border-[#e7e2d9]">
                  <img
                    src={currentOuterwear.imageUrl}
                    alt={currentOuterwear.name}
                    className="w-14 h-14 object-cover rounded-xl border border-[#e7e2d9]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#8c5836] font-bold uppercase">
                      {currentOuterwear.subType}
                    </p>
                    <h4 className="text-xs font-bold text-stone-900 truncate">
                      {currentOuterwear.name}
                    </h4>
                    <p className="text-[10px] text-stone-500">{currentOuterwear.colorName}</p>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setOuterwearIndex(cycle(outerwear.length, outerwearIndex, 'next'))
                  }
                  className="p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-stone-400">
                No outer layer selected
              </div>
            )}
          </div>
        )}

        {/* 2. TOPS SLOT */}
        <div className="bg-white border border-[#e7e2d9] rounded-3xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-1.5 px-2">
            <span className="text-[11px] font-bold uppercase text-stone-500">Top Piece *</span>
            <span className="text-[10px] text-stone-400 font-semibold">
              {tops.length > 0 ? `${topIndex + 1} of ${tops.length}` : '0'}
            </span>
          </div>

          {currentTop ? (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setTopIndex(cycle(tops.length, topIndex, 'prev'))}
                className="p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 flex-1 mx-2 bg-stone-50 p-2 rounded-2xl border border-[#e7e2d9]">
                <img
                  src={currentTop.imageUrl}
                  alt={currentTop.name}
                  className="w-16 h-16 object-cover rounded-xl border border-[#e7e2d9]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#8c5836] font-bold uppercase">
                    {currentTop.subType}
                  </p>
                  <h4 className="text-xs font-bold text-stone-900 truncate">{currentTop.name}</h4>
                  <div className="flex items-center space-x-2 text-[10px] text-stone-500 mt-0.5">
                    <span>{currentTop.colorName}</span>
                    <span>•</span>
                    <span>Warmth: {currentTop.warmthLevel}/5</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setTopIndex(cycle(tops.length, topIndex, 'next'))}
                className="p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-rose-600 font-medium">
              No tops in your wardrobe yet. Add one!
            </div>
          )}
        </div>

        {/* 3. BOTTOMS SLOT */}
        <div className="bg-white border border-[#e7e2d9] rounded-3xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-1.5 px-2">
            <span className="text-[11px] font-bold uppercase text-stone-500">Bottom Piece *</span>
            <span className="text-[10px] text-stone-400 font-semibold">
              {bottoms.length > 0 ? `${bottomIndex + 1} of ${bottoms.length}` : '0'}
            </span>
          </div>

          {currentBottom ? (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setBottomIndex(cycle(bottoms.length, bottomIndex, 'prev'))}
                className="p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 flex-1 mx-2 bg-stone-50 p-2 rounded-2xl border border-[#e7e2d9]">
                <img
                  src={currentBottom.imageUrl}
                  alt={currentBottom.name}
                  className="w-16 h-16 object-cover rounded-xl border border-[#e7e2d9]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#8c5836] font-bold uppercase">
                    {currentBottom.subType}
                  </p>
                  <h4 className="text-xs font-bold text-stone-900 truncate">{currentBottom.name}</h4>
                  <div className="flex items-center space-x-2 text-[10px] text-stone-500 mt-0.5">
                    <span>{currentBottom.colorName}</span>
                    <span>•</span>
                    <span>Warmth: {currentBottom.warmthLevel}/5</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setBottomIndex(cycle(bottoms.length, bottomIndex, 'next'))}
                className="p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-rose-600 font-medium">
              No bottoms in your wardrobe yet.
            </div>
          )}
        </div>

        {/* 4. FOOTWEAR SLOT */}
        <div className="bg-white border border-[#e7e2d9] rounded-3xl p-3 shadow-xs">
          <div className="flex items-center justify-between mb-1.5 px-2">
            <span className="text-[11px] font-bold uppercase text-stone-500">Footwear *</span>
            <span className="text-[10px] text-stone-400 font-semibold">
              {footwear.length > 0 ? `${footwearIndex + 1} of ${footwear.length}` : '0'}
            </span>
          </div>

          {currentFootwear ? (
            <div className="flex items-center justify-between">
              <button
                onClick={() => setFootwearIndex(cycle(footwear.length, footwearIndex, 'prev'))}
                className="p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-3 flex-1 mx-2 bg-stone-50 p-2 rounded-2xl border border-[#e7e2d9]">
                <img
                  src={currentFootwear.imageUrl}
                  alt={currentFootwear.name}
                  className="w-16 h-16 object-cover rounded-xl border border-[#e7e2d9]"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#8c5836] font-bold uppercase">
                    {currentFootwear.subType}
                  </p>
                  <h4 className="text-xs font-bold text-stone-900 truncate">
                    {currentFootwear.name}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-stone-500 mt-0.5">
                    <span>{currentFootwear.colorName}</span>
                    <span>•</span>
                    <span>Season: {currentFootwear.seasonSuitability}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setFootwearIndex(cycle(footwear.length, footwearIndex, 'next'))}
                className="p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-rose-600 font-medium">
              No footwear in your wardrobe yet.
            </div>
          )}
        </div>

        {/* 5. ACCESSORIES SLOT (Optional) */}
        {accessories.length > 0 && (
          <div className="bg-white border border-[#e7e2d9] rounded-3xl p-3 shadow-xs">
            <div className="flex items-center justify-between mb-1.5 px-2">
              <span className="text-[11px] font-bold uppercase text-stone-500">
                Accessories (Optional)
              </span>
              <button
                onClick={() => setAccessoryIndex(accessoryIndex === null ? 0 : null)}
                className="text-[10px] text-[#8c5836] hover:text-[#784a2c] font-bold"
              >
                {accessoryIndex === null ? '+ Add Accessory' : 'Remove'}
              </button>
            </div>

            {accessoryIndex !== null && currentAccessory ? (
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setAccessoryIndex(cycle(accessories.length, accessoryIndex, 'prev'))
                  }
                  className="p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-3 flex-1 mx-2 bg-stone-50 p-2 rounded-2xl border border-[#e7e2d9]">
                  <img
                    src={currentAccessory.imageUrl}
                    alt={currentAccessory.name}
                    className="w-14 h-14 object-cover rounded-xl border border-[#e7e2d9]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#8c5836] font-bold uppercase">
                      {currentAccessory.subType}
                    </p>
                    <h4 className="text-xs font-bold text-stone-900 truncate">
                      {currentAccessory.name}
                    </h4>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setAccessoryIndex(cycle(accessories.length, accessoryIndex, 'next'))
                  }
                  className="p-2 rounded-full bg-stone-100 text-stone-600 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-stone-400">
                No accessory selected
              </div>
            )}
          </div>
        )}
      </div>

      {/* Save Custom Outfit Form */}
      <form
        onSubmit={handleSaveOutfit}
        className="bg-white border border-[#e7e2d9] rounded-3xl p-4 shadow-sm space-y-3"
      >
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
          Save This Outfit Combination
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              Outfit Name
            </label>
            <input
              type="text"
              value={customLookName}
              onChange={(e) => setCustomLookName(e.target.value)}
              placeholder="e.g. Modern Campus Minimalist"
              className="w-full bg-stone-50 border border-[#e7e2d9] rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8c5836] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-700 mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-stone-50 border border-[#e7e2d9] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#8c5836] focus:bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Virtual Try-On Button for Current Mix */}
        <button
          type="button"
          id="btn-tryon-canvas-combo"
          onClick={() => {
            const ids = [
              currentOuterwear?.id,
              currentTop?.id,
              currentBottom?.id,
              currentFootwear?.id,
              currentAccessory?.id,
            ].filter(Boolean) as string[];
            openVirtualTryOn(ids, customLookName.trim() || 'Mix & Match Look');
          }}
          className="w-full py-3 bg-gradient-to-r from-[#8c5836] via-[#9e6741] to-[#784a2c] hover:opacity-95 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-[#8c5836]/20 flex items-center justify-center space-x-2 transition-all transform active:scale-98"
        >
          <Sparkles className="w-4 h-4 text-white stroke-[2.5]" />
          <span>Virtual Try-On in Fitting Room</span>
        </button>

        <button
          type="submit"
          id="btn-save-canvas-outfit"
          className="w-full py-3 bg-[#8c5836] hover:bg-[#784a2c] text-white font-bold rounded-2xl text-xs shadow-md shadow-[#8c5836]/20 flex items-center justify-center space-x-2 transition-all"
        >
          {saveSuccess ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#eef3e8]" />
              <span>Saved to Favorite Outfits!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save Outfit to Collection</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
