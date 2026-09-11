import React, { useState } from 'react';
import {
  X,
  Heart,
  Calendar,
  Layers,
  Thermometer,
  CloudRain,
  Tag,
  Trash2,
  CheckCircle2,
  Edit2,
  Plus,
  Sparkles,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { ClothingItem } from '../../types';
import { useDelayedRender } from '../../hooks/useDelayedRender';

interface ClothingDetailModalProps {
  item: ClothingItem | null;
  onClose: () => void;
}

export const ClothingDetailModal: React.FC<ClothingDetailModalProps> = ({ item, onClose }) => {
  const {
    toggleFavoriteItem,
    markItemWorn,
    deleteClothingItem,
    updateClothingItem,
    openVirtualTryOn,
  } = useWardrobe();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(item?.name || '');
  const [subType, setSubType] = useState(item?.subType || '');
  const [brand, setBrand] = useState(item?.brand || '');
  const [notes, setNotes] = useState(item?.notes || '');
  const [newTag, setNewTag] = useState('');

  const [shouldRender, isExiting] = useDelayedRender(!!item);

  if (!shouldRender) return null;

  const handleSaveEdit = () => {
    updateClothingItem(item.id, {
      name: name.trim() || item.name,
      subType: subType.trim() || item.subType,
      brand: brand.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    setIsEditing(false);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) return;
    const formatted = newTag.startsWith('#')
      ? newTag.trim().toLowerCase()
      : `#${newTag.trim().toLowerCase()}`;
    if (!item.tags.includes(formatted)) {
      updateClothingItem(item.id, {
        tags: [...item.tags, formatted],
      });
    }
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    updateClothingItem(item.id, {
      tags: item.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to remove "${item.name}" from your wardrobe?`)) {
      deleteClothingItem(item.id);
      onClose();
    }
  };

  return (
    <div
      id="clothing-detail-modal-overlay"
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm ${isExiting ? 'animate-md-fade-out' : 'animate-in fade-in duration-150'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: 'var(--md-on-surface)' }}
    >
      <div
        id="clothing-detail-card"
        className={`w-full max-w-lg border-t sm:border sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden md-elevation-5 ${isExiting ? 'animate-md-exit' : 'animate-md-sheet'}`}
        style={{ backgroundColor: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline-variant)' }}
      >
        {/* Top Image Hero Banner */}
        <div
          className="relative w-full h-64 flex-shrink-0"
          style={{ backgroundColor: 'var(--md-surface-container)' }}
        >
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30"></div>

          {/* Top Actions */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
            <span
              className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold border"
              style={{ color: 'var(--md-primary)', borderColor: 'var(--md-outline-variant)' }}
            >
              {item.classification}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleFavoriteItem(item.id)}
                className="p-2 rounded-full bg-white/90 backdrop-blur-md hover:text-rose-500 transition-colors border"
                style={{ color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
              >
                <Heart
                  className={`w-4 h-4 ${
                    item.isFavorite ? 'fill-rose-500 text-rose-500' : ''
                  }`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/90 backdrop-blur-md border"
                style={{ color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Item Name Overlay */}
          <div className="absolute bottom-3 inset-x-4">
            <span className="text-[11px] text-amber-200 font-extrabold tracking-wider uppercase drop-shadow-sm">
              {item.subType} {item.brand ? `• ${item.brand}` : ''}
            </span>
            <h2 className="text-lg font-extrabold text-white leading-tight drop-shadow-sm">
              {item.name}
            </h2>
          </div>
        </div>

        {/* Scrollable details */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* Virtual Try-On Banner Action */}
          <button
            onClick={() => {
              openVirtualTryOn([item.id], item.name);
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all transform active:scale-98"
            style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Try On in Virtual Fitting Studio</span>
          </button>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div
              className="p-2.5 rounded-2xl border text-center"
              style={{ backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
            >
              <div className="flex items-center justify-center space-x-1 mb-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] uppercase font-bold">Warmth</span>
              </div>
              <p className="text-xs font-extrabold" style={{ color: 'var(--md-on-surface)' }}>{item.warmthLevel} / 5</p>
            </div>

            <div
              className="p-2.5 rounded-2xl border text-center"
              style={{ backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
            >
              <div className="flex items-center justify-center space-x-1 mb-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                <CloudRain className="w-3.5 h-3.5" style={{ color: 'var(--md-primary)' }} />
                <span className="text-[10px] uppercase font-bold">Weather</span>
              </div>
              <p className="text-xs font-extrabold truncate" style={{ color: 'var(--md-on-surface)' }}>
                {item.seasonSuitability}
              </p>
            </div>

            <div
              className="p-2.5 rounded-2xl border text-center"
              style={{ backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
            >
              <div className="flex items-center justify-center space-x-1 mb-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                <Calendar className="w-3.5 h-3.5 text-[#6b7c59]" />
                <span className="text-[10px] uppercase font-bold">Worn</span>
              </div>
              <p className="text-xs font-extrabold" style={{ color: 'var(--md-on-surface)' }}>{item.wearCount} times</p>
            </div>
          </div>

          {/* Color & Tone */}
          <div
            className="flex items-center justify-between p-3 rounded-2xl border"
            style={{ backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
          >
            <div className="flex items-center space-x-2.5">
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>Color Palette</p>
                <p className="text-[11px] font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>{item.colorName}</p>
              </div>
            </div>
            <button
              onClick={() => markItemWorn(item.id)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all"
              style={{ backgroundColor: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)', borderColor: 'var(--md-outline-variant)' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'var(--md-on-secondary-container)' }} />
              <span>Mark Worn Today</span>
            </button>
          </div>

          {/* Edit Mode vs View Mode */}
          {isEditing ? (
            <div
              className="space-y-2.5 p-3.5 rounded-2xl border border-[#8c5836]/40"
              style={{ backgroundColor: 'var(--md-surface-container)' }}
            >
              <h4 className="text-xs font-bold uppercase" style={{ color: 'var(--md-primary)' }}>Edit Item Details</h4>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name"
                className="w-full border rounded-xl px-3 py-1.5 text-xs"
                style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
              />
              <input
                type="text"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                placeholder="Sub-Type (e.g. Graphic Tee)"
                className="w-full border rounded-xl px-3 py-1.5 text-xs"
                style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
              />
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brand"
                className="w-full border rounded-xl px-3 py-1.5 text-xs"
                style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes..."
                rows={2}
                className="w-full border rounded-xl px-3 py-1.5 text-xs resize-none"
                style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
              />
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-1.5 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>Notes & Material</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-bold flex items-center space-x-1"
                  style={{ color: 'var(--md-primary)' }}
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <p
                className="text-xs p-3 rounded-2xl border italic"
                style={{ color: 'var(--md-on-surface-variant)', backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
              >
                {item.notes || 'No custom notes added for this item.'}
              </p>
            </div>
          )}

          {/* Tags Manager */}
          <div>
            <span className="block text-xs font-bold mb-1.5" style={{ color: 'var(--md-on-surface)' }}>
              Assigned Category Tags
            </span>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full border text-xs font-semibold"
                  style={{ backgroundColor: 'var(--md-primary-container)', borderColor: 'var(--md-outline-variant)', color: 'var(--md-on-secondary-container)' }}
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-rose-600 transition-colors ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={handleAddTag} className="flex space-x-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag (e.g. #exam-day)..."
                className="flex-1 border rounded-xl px-3 py-1.5 text-xs placeholder-stone-400 focus:outline-none focus:border-[#8c5836]"
                style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 text-xs rounded-xl font-bold transition-colors"
                style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
              >
                Add
              </button>
            </form>
          </div>

          {/* Delete Action */}
          <div className="pt-2 border-t flex justify-end" style={{ borderColor: 'var(--md-outline-variant)' }}>
            <button
              onClick={handleDelete}
              className="flex items-center space-x-1.5 text-xs text-rose-600 hover:text-rose-700 font-semibold px-3 py-2 rounded-xl hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove from Wardrobe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
