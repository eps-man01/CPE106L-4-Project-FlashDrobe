import React, { useState } from 'react';
import {
  BookmarkCheck,
  Heart,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Tag,
  Share2,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { Outfit } from '../../types';

export const SavedOutfitsView: React.FC = () => {
  const {
    outfits,
    wardrobe,
    categories,
    deleteOutfit,
    toggleFavoriteOutfit,
    markOutfitWorn,
    setActiveTab,
    openVirtualTryOn,
  } = useWardrobe();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');
  const [wornOutfits, setWornOutfits] = useState<{ [id: string]: boolean }>({});

  const filteredOutfits = outfits.filter((outfit) => {
    if (selectedCategoryFilter !== 'All' && outfit.categoryId !== selectedCategoryFilter) {
      return false;
    }
    return true;
  });

  const handleWear = (outfitId: string) => {
    markOutfitWorn(outfitId);
    setWornOutfits((prev) => ({ ...prev, [outfitId]: true }));
    setTimeout(() => {
      setWornOutfits((prev) => ({ ...prev, [outfitId]: false }));
    }, 2500);
  };

  return (
    <div id="saved-outfits-view-root" className="space-y-4 pb-24" style={{ color: 'var(--md-on-surface)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold font-display flex items-center gap-1.5" style={{ color: 'var(--md-on-surface)' }}>
            <BookmarkCheck className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
            <span>Saved Outfits & History</span>
          </h2>
          <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
            {outfits.length} saved {outfits.length === 1 ? 'combination' : 'combinations'}
          </p>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setSelectedCategoryFilter('All')}
          className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
          style={{
            backgroundColor: selectedCategoryFilter === 'All' ? 'var(--md-primary-container)' : 'var(--md-surface-container)',
            color: selectedCategoryFilter === 'All' ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
          }}
        >
          All Looks ({outfits.length})
        </button>

        {categories.map((cat) => {
          const count = outfits.filter((o) => o.categoryId === cat.id).length;
          if (count === 0) return null;
          const isSelected = selectedCategoryFilter === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className="px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all"
              style={{
                backgroundColor: isSelected ? 'var(--md-primary-container)' : 'var(--md-surface-container)',
                color: isSelected ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
              }}
            >
              {cat.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Outfits List */}
      {filteredOutfits.length === 0 ? (
        <div
          className="text-center py-14 px-4 rounded-3xl flex flex-col items-center justify-center space-y-3 md-elevation-1"
          style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
        >
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: 'var(--md-primary-container)' }}
          >
            <BookmarkCheck className="w-7 h-7" style={{ color: 'var(--md-on-primary-container)' }} />
          </div>
          <div>
            <h4 className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>No saved outfits yet</h4>
            <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
              Generate AI recommendations or mix and match your wardrobe pieces to save your favorite combinations.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('stylist')}
            className="mt-2 px-5 py-2.5 font-bold rounded-full text-xs md-elevation-1"
            style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            Go to AI Stylist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOutfits.map((outfit) => {
            const outfitItems = outfit.itemIds
              .map((id) => wardrobe.find((w) => w.id === id))
              .filter(Boolean);

            const isWornNow = wornOutfits[outfit.id];

            return (
              <div
                key={outfit.id}
                id={`outfit-card-${outfit.id}`}
                className="rounded-3xl p-4 md-elevation-1 space-y-3.5 transition-all md-elevation"
                style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
                      >
                        {outfit.categoryName}
                      </span>
                      {outfit.weatherScore && (
                        <span className="text-[10px] font-bold flex items-center gap-1" style={{ color: 'var(--md-tertiary)' }}>
                          <ShieldCheck className="w-3 h-3" />
                          <span>{outfit.weatherScore}% Match</span>
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold mt-1" style={{ color: 'var(--md-on-surface)' }}>{outfit.name}</h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => toggleFavoriteOutfit(outfit.id)}
                      className="p-2 rounded-full text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          outfit.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-stone-400'
                        }`}
                      />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete outfit "${outfit.name}"?`)) {
                          deleteOutfit(outfit.id);
                        }
                      }}
                      className="p-2 rounded-full text-stone-400 hover:text-rose-500 hover:bg-stone-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Collage of items */}
                <div className="grid grid-cols-4 gap-2">
                  {outfitItems.map((item) =>
                    item ? (
                      <div
                        key={item.id}
                        className="bg-stone-50 rounded-2xl overflow-hidden border border-[#e7e2d9] p-1 flex flex-col items-center shadow-2xs"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full aspect-square object-cover rounded-xl"
                        />
                        <span className="text-[9px] text-stone-700 font-bold truncate w-full text-center mt-1">
                          {item.subType}
                        </span>
                      </div>
                    ) : null
                  )}
                </div>

                {/* Weather condition snapshot & notes */}
                {outfit.weatherSnapshot && (
                  <div className="flex items-center justify-between text-[11px] text-stone-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-[#e7e2d9]">
                    <span>
                      Weather: {outfit.weatherSnapshot.tempC}°C ({outfit.weatherSnapshot.condition}) in{' '}
                      {outfit.weatherSnapshot.city}
                    </span>
                    <span className="text-stone-400">
                      {new Date(outfit.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Action Bar */}
                <div className="flex items-center justify-between pt-2 border-t border-[#e7e2d9]">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openVirtualTryOn(outfit.itemIds, outfit.name)}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-[#784a2c] bg-[#f0e9df] hover:bg-[#e7dece] border border-[#ddcfbe] transition-colors"
                      title="Virtual Try-On in fitting studio"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#8c5836]" />
                      <span>Try-On</span>
                    </button>
                    <span className="text-[10px] text-stone-400 font-medium hidden sm:inline">
                      {outfit.lastWorn
                        ? `Worn: ${new Date(outfit.lastWorn).toLocaleDateString()}`
                        : 'New'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleWear(outfit.id)}
                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isWornNow
                        ? 'bg-[#f0e9df] text-[#784a2c] border-[#ddcfbe]'
                        : 'bg-[#8c5836] hover:bg-[#784a2c] text-white border-[#8c5836]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isWornNow ? 'Marked Worn!' : 'Wear Today'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
