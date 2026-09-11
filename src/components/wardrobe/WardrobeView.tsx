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
import { useDelayedRender } from '../../hooks/useDelayedRender';

export const WardrobeView: React.FC = () => {
  const { wardrobe, toggleFavoriteItem, deleteClothingItem, resetAllData } = useWardrobe();
  const [itemToDelete, setItemToDelete] = useState<ClothingItem | null>(null);
  const [shouldRenderDelete, isDeleteExiting] = useDelayedRender(!!itemToDelete);

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

  const allTags = useMemo(() => {
    const set = new Set<string>();
    wardrobe.forEach((item) => {
      item.tags?.forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [wardrobe]);

  const filteredItems = useMemo(() => {
    return wardrobe.filter((item) => {
      if (selectedClassification !== 'All' && item.classification !== selectedClassification) return false;
      if (onlyFavorites && !item.isFavorite) return false;
      if (selectedTagFilter && !item.tags.includes(selectedTagFilter)) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchName = item.name.toLowerCase().includes(query);
        const matchSub = item.subType.toLowerCase().includes(query);
        const matchBrand = item.brand?.toLowerCase().includes(query) || false;
        const matchTags = item.tags.some((t) => t.toLowerCase().includes(query));
        const matchColor = item.colorName.toLowerCase().includes(query);
        if (!matchName && !matchSub && !matchBrand && !matchTags && !matchColor) return false;
      }
      return true;
    });
  }, [wardrobe, selectedClassification, onlyFavorites, selectedTagFilter, searchQuery]);

  return (
    <div id="wardrobe-view-root" className="space-y-4 pb-24" style={{ color: 'var(--md-on-surface)' }}>
      {/* Add Clothing Header Card */}
      <div className="rounded-3xl p-4 md-elevation-1 space-y-3" style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}>
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>Add Clothing to Closet</h3>
              <p className="text-[11px]" style={{ color: 'var(--md-on-surface-variant)' }}>Capture with camera or choose from gallery</p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}>
            {wardrobe.length} Items
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="btn-quick-snap-camera"
            onClick={() => openAddWithMode('camera')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 font-bold text-xs rounded-2xl md-elevation-1 transition-all active:scale-98"
            style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            <Camera className="w-4 h-4" />
            <span>Snap Camera</span>
          </button>

          <button
            id="btn-quick-upload-gallery"
            onClick={() => openAddWithMode('upload')}
            className="flex items-center justify-center gap-2 py-2.5 px-3 font-bold text-xs rounded-2xl md-elevation-1 transition-all active:scale-98"
            style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
          >
            <FolderOpen className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
            <span>Phone Gallery</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--md-on-surface-variant)' }} />
            <input
              type="text"
              id="wardrobe-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clothes, tags, colors, brands..."
              className="w-full rounded-2xl pl-9 pr-4 py-2.5 text-xs md-elevation-1 focus:outline-none"
              style={{ backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold"
                style={{ color: 'var(--md-on-surface-variant)' }}
              >
                Clear
              </button>
            )}
          </div>

          <button
            id="btn-filter-favorites"
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            title={onlyFavorites ? 'Show all items' : 'Show favorites only'}
            className="p-2.5 rounded-2xl transition-all md-elevation-1"
            style={{
              backgroundColor: onlyFavorites ? 'var(--md-error-container)' : 'var(--md-surface-container-lowest)',
              color: onlyFavorites ? 'var(--md-on-error-container)' : 'var(--md-on-surface-variant)',
            }}
          >
            <Heart className={`w-4 h-4 ${onlyFavorites ? 'fill-current' : ''}`} />
          </button>

          <button
            id="btn-toggle-view-mode"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            title="Toggle Grid / List View"
            className="p-2.5 rounded-2xl transition-colors md-elevation-1"
            style={{ backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-on-surface-variant)' }}
          >
            {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid2X2 className="w-4 h-4" />}
          </button>
        </div>

        {/* Classification Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200"
                style={{
                  backgroundColor: isSelected ? 'var(--md-primary)' : 'var(--md-surface-container-lowest)',
                  color: isSelected ? 'var(--md-on-primary)' : 'var(--md-on-surface)',
                }}
              >
                <span>{cls}</span>
                <span
                  className="text-[10px] px-1.5 py-0.2 rounded-full font-bold"
                  style={{
                    backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--md-surface-container)',
                    color: isSelected ? 'var(--md-on-primary)' : 'var(--md-on-surface-variant)',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tag Filters */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 pl-1" style={{ color: 'var(--md-on-surface-variant)' }}>
              <Tag className="w-3 h-3" />
              <span>Tags:</span>
            </span>
            {allTags.map((tag) => {
              const isActive = selectedTagFilter === tag;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(isActive ? null : tag)}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: isActive ? 'var(--md-secondary-container)' : 'var(--md-surface-container-lowest)',
                    color: isActive ? 'var(--md-on-secondary-container)' : 'var(--md-on-surface-variant)',
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Wardrobe Items Display */}
      {filteredItems.length === 0 ? (
        <div
          id="wardrobe-empty-state"
          className="text-center py-12 px-4 rounded-3xl flex flex-col items-center justify-center space-y-3 md-elevation-1"
          style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--md-primary-container)' }}>
            <Camera className="w-7 h-7" style={{ color: 'var(--md-on-primary-container)' }} />
          </div>
          <div>
            <h4 className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>Your Wardrobe is Ready</h4>
            <p className="text-xs mt-1 max-w-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
              {searchQuery || selectedTagFilter || onlyFavorites
                ? 'No items matched your search filters.'
                : 'Snap a photo with your camera or select from your gallery to add your clothes.'}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              onClick={() => openAddWithMode('camera')}
              className="px-4 py-2 font-bold rounded-2xl text-xs md-elevation-1 flex items-center gap-1.5 transition-all"
              style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
            >
              <Camera className="w-4 h-4" />
              <span>Take Photo (Camera)</span>
            </button>
            <button
              onClick={() => openAddWithMode('upload')}
              className="px-4 py-2 font-bold rounded-2xl text-xs md-elevation-1 flex items-center gap-1.5 transition-all"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            >
              <FolderOpen className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
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
              className="group relative rounded-3xl overflow-hidden md-elevation-1 cursor-pointer flex flex-col"
              style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
            >
              <div className="relative aspect-square w-full overflow-hidden" style={{ backgroundColor: 'var(--md-surface-container)' }}>
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10"></div>

                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold md-elevation-1" style={{ backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-on-surface)', opacity: 0.9 }}>
                  {item.classification}
                </span>

                <div className="absolute top-2 right-2 flex items-center gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}
                    title="Delete item"
                    className="p-1.5 rounded-full md-elevation-1 transition-colors"
                    style={{ backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-on-surface-variant)', opacity: 0.9 }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavoriteItem(item.id); }}
                    title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    className="p-1.5 rounded-full md-elevation-1 transition-colors"
                    style={{ backgroundColor: 'var(--md-surface-container-lowest)', color: item.isFavorite ? 'var(--md-tertiary)' : 'var(--md-on-surface-variant)', opacity: 0.9 }}
                  >
                    <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-amber-200">
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

              <div className="p-3 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-extrabold tracking-wider uppercase truncate" style={{ color: 'var(--md-primary)' }}>
                    {item.subType}
                  </p>
                  <h4 className="text-xs font-bold line-clamp-1 mt-0.5" style={{ color: 'var(--md-on-surface)' }}>
                    {item.name}
                  </h4>
                </div>
                {item.tags.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 overflow-hidden">
                    <span className="text-[10px] px-1.5 py-0.2 rounded font-medium truncate" style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' }}>
                      {item.tags[0]}
                    </span>
                    {item.tags.length > 1 && (
                      <span className="text-[9px] font-semibold" style={{ color: 'var(--md-on-surface-variant)' }}>
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
              className="rounded-3xl p-3 flex items-center gap-3 transition-all cursor-pointer md-elevation-1"
              style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-14 h-14 object-cover rounded-2xl flex-shrink-0"
                style={{ border: `1px solid var(--md-outline-variant)` }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded" style={{ backgroundColor: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}>
                    {item.classification}
                  </span>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>{item.subType}</span>
                </div>
                <h4 className="text-xs font-bold truncate mt-0.5" style={{ color: 'var(--md-on-surface)' }}>{item.name}</h4>
                <div className="flex items-center gap-2 mt-1 text-[10px]" style={{ color: 'var(--md-on-surface-variant)' }}>
                  <span className="flex items-center gap-1">
                    <Thermometer className="w-2.5 h-2.5 text-amber-500" />
                    <span>Warmth: {item.warmthLevel}/5</span>
                  </span>
                  <span>•</span>
                  <span>Worn {item.wearCount}x</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }}
                  title="Delete item"
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: 'var(--md-on-surface-variant)' }}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleFavoriteItem(item.id); }}
                  title={item.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: item.isFavorite ? 'var(--md-tertiary)' : 'var(--md-on-surface-variant)' }}
                >
                  <Heart className={`w-4 h-4 ${item.isFavorite ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddClothingModal
        isOpen={isAddModalOpen}
        initialMode={addModalMode}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ClothingDetailModal
        item={selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
      />

      {/* Delete Confirmation Dialog */}
      {shouldRenderDelete && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${isDeleteExiting ? 'animate-md-fade-out' : 'animate-in fade-in duration-150'}`} style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <div className={`rounded-3xl p-5 max-w-sm w-full md-elevation-5 space-y-4 ${isDeleteExiting ? 'animate-md-exit' : 'animate-md-sheet'}`} style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}>
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>Delete Clothing Item?</h4>
                <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>This will remove it from your digital closet.</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl flex items-center gap-3" style={{ backgroundColor: 'var(--md-surface-container)' }}>
              <img
                src={itemToDelete.imageUrl}
                alt={itemToDelete.name}
                className="w-12 h-12 object-cover rounded-xl"
                style={{ border: `1px solid var(--md-outline-variant)` }}
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold" style={{ color: 'var(--md-primary)' }}>
                  {itemToDelete.classification} • {itemToDelete.subType}
                </span>
                <h5 className="text-xs font-bold truncate" style={{ color: 'var(--md-on-surface)' }}>{itemToDelete.name}</h5>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-2.5 rounded-xl text-xs font-bold transition-colors"
                style={{ border: `1px solid var(--md-outline-variant)`, color: 'var(--md-on-surface)' }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteClothingItem(itemToDelete.id);
                  setItemToDelete(null);
                }}
                className="py-2.5 rounded-xl text-xs font-bold transition-colors"
                style={{ backgroundColor: 'var(--md-error)', color: 'var(--md-on-error)' }}
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
