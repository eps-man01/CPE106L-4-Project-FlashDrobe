import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Plus,
  Heart,
  Grid2X2,
  List,
  Filter,
  Layers,
  Thermometer,
  CloudRain,
  Tag,
  Camera,
  Upload,
  FolderOpen,
  Sparkles,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { ClothingClassification, ClothingItem } from '../../types';
import { AddClothingModal } from './AddClothingModal';
import { ClothingDetailModal } from './ClothingDetailModal';

export const WardrobeView: React.FC = () => {
  const { wardrobe, toggleFavoriteItem, deleteClothingItem, resetAllData } = useWardrobe();
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);

  const [selectedClassification, setSelectedClassification] = useState<
    ClothingClassification | 'All'
  >('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalMode, setAddModalMode] = useState<'camera' | 'upload'>('camera');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<ClothingItem | null>(null);

  const openAddWithMode = (mode: 'camera' | 'upload') => {
    setAddModalMode(mode);
    setIsAddModalOpen(true);
  };

  // Classification counts
  const counts = useMemo(() => {
    return {
      All: wardrobe.length,
      Tops: wardrobe.filter((i) => i.classification === 'Tops').length,
      Bottoms: wardrobe.filter((i) => i.classification === 'Bottoms').length,
      Footwear: wardrobe.filter((i) => i.classification === 'Footwear').length,
      Outerwear: wardrobe.filter((i) => i.classification === 'Outerwear').length,
      Accessories: wardrobe.filter((i) => i.classification === 'Accessories').length,
    };
  }, [wardrobe]);

  // Extract all unique tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    wardrobe.forEach((item) => {
      item.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [wardrobe]);

  // Filtered items
  const filteredItems = useMemo(() => {
    return wardrobe.filter((item) => {
      // Classification filter
      if (selectedClassification !== 'All' && item.classification !== selectedClassification) {
        return false;
      }
      // Favorites filter
      if (onlyFavorites && !item.isFavorite) {
        return false;
      }
      // Tag filter
      if (selectedTagFilter && !item.tags.includes(selectedTagFilter)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchSub = item.subType.toLowerCase().includes(query);
        const matchBrand = item.brand?.toLowerCase().includes(query) || false;
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(query));
        const matchColor = item.colorName.toLowerCase().includes(query);
        if (!matchName && !matchSub && !matchBrand && !matchTags && !matchColor) {
          return false;
        }
      }
      return true;
    });
  }, [wardrobe, selectedClassification, onlyFavorites, selectedTagFilter, searchQuery]);

  return (
    <div id="wardrobe-view-root" className="space-y-4 pb-24 text-stone-900">
      {/* User Input & Upload Quick Action Header Card */}
      <div className="bg-white border border-[#e7e2d9] rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#f5ede3] border border-[#e5dec9] flex items-center justify-center text-[#8c5836]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-extrabold text-stone-900">Add Clothing to Closet</h3>
              <p className="text-[11px] text-stone-500">Capture with camera or choose from gallery</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f0e9df] text-[#784a2c] border border-[#ddcfbe]">
            {wardrobe.length} Items
          </span>
        </div>

        {/* Dual Primary Upload Actions: Camera & Gallery */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="btn-quick-snap-camera"
            onClick={() => openAddWithMode('camera')}
            className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#8c5836] hover:bg-[#784a2c] text-white font-bold text-xs rounded-2xl shadow-sm shadow-[#8c5836]/20 transition-all active:scale-98"
          >
            <Camera className="w-4 h-4" />
            <span>Snap Camera</span>
          </button>

          <button
            id="btn-quick-upload-gallery"
            onClick={() => openAddWithMode('upload')}
            className="flex items-center justify-center space-x-2 py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-2xl border border-[#e7e2d9] shadow-2xs transition-all active:scale-98"
          >
            <FolderOpen className="w-4 h-4 text-[#8c5836]" />
            <span>Phone Gallery</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              id="wardrobe-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clothes, tags, colors, brands..."
              className="w-full bg-white border border-[#e7e2d9] rounded-2xl pl-9 pr-4 py-2.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8c5836] focus:ring-1 focus:ring-[#8c5836]/30 shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700 font-semibold"
              >
                Clear
              </button>
            )}
          </div>

          {/* Favorite Toggle Filter */}
          <button
            id="btn-filter-favorites"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            title={onlyFavorites ? 'Show all items' : 'Show favorites only'}
            className={`p-2.5 rounded-2xl border transition-all shadow-xs ${
              onlyFavorites
                ? 'bg-rose-50 border-rose-300 text-rose-600'
                : 'bg-white border-[#e7e2d9] text-stone-600 hover:text-stone-900'
            }`}
          >
            <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>

          {/* View mode toggle */}
          <button
            id="btn-toggle-view-mode"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title="Toggle Grid / List View"
            className="p-2.5 rounded-2xl bg-white border border-[#e7e2d9] text-stone-600 hover:text-stone-900 transition-colors shadow-xs"
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid2X2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Classification Filter Pills Carousel */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
          {(
            ['All', 'Tops', 'Bottoms', 'Footwear', 'Outerwear', 'Accessories'] as (
              | ClothingClassification
              | 'All'
            )[]
          ).map((cls) => {
            const isSelected = selectedClassification === cls;
            const count = counts[cls];

            return (
              <button
                key={cls}
                id={`filter-pill-${cls.toLowerCase()}`}
                onClick={() => setSelectedClassification(cls)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 border shadow-xs ${
                  isSelected
                    ? 'bg-[#8c5836] text-white border-[#8c5836] shadow-[#8c5836]/20 font-bold'
                    : 'bg-white text-stone-700 border-[#e7e2d9] hover:bg-stone-50 hover:text-stone-900'
                }`}
              >
                <span>{cls}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-white/25 text-white' : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tag Filters Horizontal Bar */}
        {allTags.length > 0 && (
          <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider flex items-center space-x-1 pl-1">
              <Tag className="w-3 h-3 text-stone-500" />
              <span>Tags:</span>
            </span>
            {allTags.map((tag) => {
              const isActive = selectedTagFilter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(isActive ? null : tag)}
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border shadow-2xs ${
                    isActive
                      ? 'bg-[#f0e9df] text-[#784a2c] border-[#ddcfbe] font-bold'
                      : 'bg-white border-[#e7e2d9] text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid or List Display of Wardrobe Items */}
      {filteredItems.length === 0 ? (
        <div
          id="wardrobe-empty-state"
          className="text-center py-12 px-4 rounded-3xl bg-white border border-[#e7e2d9] flex flex-col items-center justify-center space-y-3 shadow-xs"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#f5ede3] border border-[#e5dec9] flex items-center justify-center">
            <Camera className="w-7 h-7 text-[#8c5836]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-stone-900">Your Wardrobe is Ready</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-xs">
              {searchQuery || selectedTagFilter || onlyFavorites
                ? 'No items matched your search filters.'
                : 'Snap a photo with your camera or select from your gallery to add your clothes.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => openAddWithMode('camera')}
              className="px-4 py-2 bg-[#8c5836] hover:bg-[#784a2c] text-white font-bold rounded-2xl text-xs shadow-md flex items-center space-x-1.5 transition-all"
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo (Camera)</span>
            </button>
            <button
              onClick={() => openAddWithMode('upload')}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-2xl text-xs border border-[#e7e2d9] flex items-center space-x-1.5 transition-all"
            >
              <FolderOpen className="w-4 h-4 text-[#8c5836]" />
              <span>Upload Gallery</span>
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div
          id="wardrobe-grid"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-3.5"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.05 } }
          }}
        >
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              onClick={() => setSelectedItemForDetail(item)}
              variants={{
                hidden: { opacity: 0, y: 12, scale: 0.95 },
                visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
              }}
              whileTap={{ scale: 0.97 }}
              className="group relative bg-white border border-[#e7e2d9] hover:border-stone-400 rounded-3xl overflow-hidden shadow-xs material-elevation cursor-pointer flex flex-col"
            >
              {/* Image Container */}
              <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"></div>

                {/* Classification Pill */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold text-stone-800 border border-[#e7e2d9] shadow-xs">
                  {item.classification}
                </span>

                {/* Top Action Buttons (Favorite + Quick Delete) */}
                <div className="absolute top-2 right-2 flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setItemToDelete(item);
                    }}
                    title="Delete item"
                    className="p-1.5 rounded-full bg-white/90 backdrop-blur-md text-stone-500 hover:text-rose-600 transition-colors border border-[#e7e2d9] shadow-xs hover:bg-rose-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavoriteItem(item.id);
                    }}
                    title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    className="p-1.5 rounded-full bg-white/90 backdrop-blur-md text-stone-700 hover:text-rose-500 transition-colors border border-[#e7e2d9] shadow-xs"
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        item.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-stone-600'
                      }`}
                    />
                  </button>
                </div>

                {/* Warmth & Season Badges */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px]">
                  <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-amber-200 border border-white/10">
                    <Thermometer className="w-2.5 h-2.5 text-amber-300" />
                    <span className="font-semibold">{item.warmthLevel}/5</span>
                  </div>
                  <div
                    className="w-3.5 h-3.5 rounded-full border-2 border-white shadow"
                    style={{ backgroundColor: item.color }}
                    title={item.colorName}
                  />
                </div>
              </div>

              {/* Item Details */}
              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] text-[#8c5836] font-extrabold tracking-wider uppercase truncate">
                    {item.subType}
                  </p>
                  <h4 className="text-xs font-bold text-stone-900 line-clamp-1 group-hover:text-[#8c5836] transition-colors mt-0.5">
                    {item.name}
                  </h4>
                </div>

                {/* Tags preview */}
                {item.tags.length > 0 && (
                  <div className="flex items-center space-x-1 mt-2 overflow-hidden">
                    <span className="text-[10px] text-stone-600 bg-stone-100 px-1.5 py-0.2 rounded font-medium truncate border border-[#e7e2d9]">
                      {item.tags[0]}
                    </span>
                    {item.tags.length > 1 && (
                      <span className="text-[9px] text-stone-400 font-semibold">
                        +{item.tags.length - 1}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* List Mode */
        <div id="wardrobe-list" className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItemForDetail(item)}
              className="bg-white border border-[#e7e2d9] hover:border-stone-400 rounded-3xl p-3 flex items-center space-x-3 transition-all cursor-pointer shadow-xs"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-14 h-14 object-cover rounded-2xl border border-[#e7e2d9] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold text-[#784a2c] uppercase px-1.5 py-0.2 bg-[#f0e9df] rounded border border-[#ddcfbe]">
                    {item.classification}
                  </span>
                  <span className="text-[10px] text-stone-500 font-medium">{item.subType}</span>
                </div>
                <h4 className="text-xs font-bold text-stone-900 truncate mt-0.5">{item.name}</h4>
                <div className="flex items-center space-x-2 mt-1 text-[10px] text-stone-500">
                  <span className="flex items-center space-x-1">
                    <Thermometer className="w-2.5 h-2.5 text-amber-500" />
                    <span>Warmth: {item.warmthLevel}/5</span>
                  </span>
                  <span>•</span>
                  <span>Worn {item.wearCount}x</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(item);
                  }}
                  title="Delete item"
                  className="p-2 text-stone-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavoriteItem(item.id);
                  }}
                  title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  className="p-2 text-stone-400 hover:text-rose-500 rounded-xl hover:bg-rose-50 transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${item.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Clothing Modal */}
      <AddClothingModal
        isOpen={isAddModalOpen}
        initialMode={addModalMode}
        onClose={() => setIsAddModalOpen(false)}
      />

      {/* Clothing Detail Modal */}
      <ClothingDetailModal
        item={selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
      />

      {/* Delete Item Confirmation Dialog */}
      {itemToDelete && (
        <div
          id="delete-confirmation-modal"
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-[#e7e2d9] rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-stone-900">Delete Clothing Item?</h4>
                <p className="text-xs text-stone-500">This will remove it from your digital closet.</p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 border border-[#e7e2d9] rounded-2xl flex items-center space-x-3">
              <img
                src={itemToDelete.imageUrl}
                alt={itemToDelete.name}
                className="w-12 h-12 object-cover rounded-xl border border-[#e7e2d9]"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold text-[#8c5836]">
                  {itemToDelete.classification} • {itemToDelete.subType}
                </span>
                <h5 className="text-xs font-bold text-stone-800 truncate">{itemToDelete.name}</h5>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-2.5 rounded-xl border border-[#e7e2d9] text-xs font-bold text-stone-700 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteClothingItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-xs transition-colors"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
