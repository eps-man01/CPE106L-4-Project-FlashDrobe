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

  if (!item) return null;

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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 text-stone-900"
    >
      <div
        id="clothing-detail-card"
        className="w-full max-w-lg bg-white border-t sm:border border-[#e7e2d9] sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
      >
        {/* Top Image Hero Banner */}
        <div className="relative w-full h-64 bg-stone-100 flex-shrink-0">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/30"></div>

          {/* Top Actions */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
            <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-bold text-[#8c5836] border border-[#e7e2d9] shadow-xs">
              {item.classification}
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleFavoriteItem(item.id)}
                className="p-2 rounded-full bg-white/90 backdrop-blur-md text-stone-700 hover:text-rose-500 transition-colors border border-[#e7e2d9] shadow-xs"
              >
                <Heart
                  className={`w-4 h-4 ${
                    item.isFavorite ? 'fill-rose-500 text-rose-500' : 'text-stone-700'
                  }`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/90 backdrop-blur-md text-stone-700 hover:text-stone-900 border border-[#e7e2d9] shadow-xs"
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
            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#8c5836] to-[#a16b47] hover:from-[#784a2c] hover:to-[#8c5836] text-white text-xs font-bold shadow-md shadow-[#8c5836]/20 flex items-center justify-center space-x-2 transition-all transform active:scale-98"
          >
            <Sparkles className="w-4 h-4 text-white stroke-[2.5]" />
            <span>Try On in Virtual Fitting Studio</span>
          </button>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-2xl bg-stone-50 border border-[#e7e2d9] text-center">
              <div className="flex items-center justify-center space-x-1 text-stone-500 mb-0.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[10px] uppercase font-bold">Warmth</span>
              </div>
              <p className="text-xs font-extrabold text-stone-900">{item.warmthLevel} / 5</p>
            </div>

            <div className="p-2.5 rounded-2xl bg-stone-50 border border-[#e7e2d9] text-center">
              <div className="flex items-center justify-center space-x-1 text-stone-500 mb-0.5">
                <CloudRain className="w-3.5 h-3.5 text-[#8c5836]" />
                <span className="text-[10px] uppercase font-bold">Weather</span>
              </div>
              <p className="text-xs font-extrabold text-stone-900 truncate">
                {item.seasonSuitability}
              </p>
            </div>

            <div className="p-2.5 rounded-2xl bg-stone-50 border border-[#e7e2d9] text-center">
              <div className="flex items-center justify-center space-x-1 text-stone-500 mb-0.5">
                <Calendar className="w-3.5 h-3.5 text-[#6b7c59]" />
                <span className="text-[10px] uppercase font-bold">Worn</span>
              </div>
              <p className="text-xs font-extrabold text-stone-900">{item.wearCount} times</p>
            </div>
          </div>

          {/* Color & Tone */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-stone-50 border border-[#e7e2d9]">
            <div className="flex items-center space-x-2.5">
              <div
                className="w-6 h-6 rounded-full border-2 border-white shadow"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <p className="text-xs font-bold text-stone-900">Color Palette</p>
                <p className="text-[11px] text-stone-500 font-medium">{item.colorName}</p>
              </div>
            </div>
            <button
              onClick={() => markItemWorn(item.id)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#f0e9df] hover:bg-[#e8dfd2] text-[#784a2c] border border-[#ddcfbe] text-xs font-bold transition-all shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#784a2c]" />
              <span>Mark Worn Today</span>
            </button>
          </div>

          {/* Edit Mode vs View Mode */}
          {isEditing ? (
            <div className="space-y-2.5 p-3.5 rounded-2xl bg-stone-50 border border-[#8c5836]/40">
              <h4 className="text-xs font-bold text-[#8c5836] uppercase">Edit Item Details</h4>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Item name"
                className="w-full bg-white border border-[#e7e2d9] rounded-xl px-3 py-1.5 text-xs text-stone-900"
              />
              <input
                type="text"
                value={subType}
                onChange={(e) => setSubType(e.target.value)}
                placeholder="Sub-Type (e.g. Graphic Tee)"
                className="w-full bg-white border border-[#e7e2d9] rounded-xl px-3 py-1.5 text-xs text-stone-900"
              />
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Brand"
                className="w-full bg-white border border-[#e7e2d9] rounded-xl px-3 py-1.5 text-xs text-stone-900"
              />
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes..."
                rows={2}
                className="w-full bg-white border border-[#e7e2d9] rounded-xl px-3 py-1.5 text-xs text-stone-900 resize-none"
              />
              <div className="flex space-x-2 pt-1">
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  className="flex-1 py-1.5 bg-[#8c5836] hover:bg-[#784a2c] text-white rounded-xl text-xs font-bold shadow-xs"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 bg-stone-200 text-stone-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-stone-700">Notes & Material</span>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-[#8c5836] hover:text-[#784a2c] font-bold flex items-center space-x-1"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>
              <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl border border-[#e7e2d9] italic">
                {item.notes || 'No custom notes added for this item.'}
              </p>
            </div>
          )}

          {/* Tags Manager */}
          <div>
            <span className="block text-xs font-bold text-stone-700 mb-1.5">
              Assigned Category Tags
            </span>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full bg-[#f5ede3] border border-[#e5dec9] text-[#784a2c] text-xs font-semibold shadow-xs"
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
                className="flex-1 bg-stone-50 border border-[#e7e2d9] rounded-xl px-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8c5836] focus:bg-white"
              />
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-[#8c5836] hover:bg-[#784a2c] text-white text-xs rounded-xl font-bold transition-colors shadow-xs"
              >
                Add
              </button>
            </form>
          </div>

          {/* Delete Action */}
          <div className="pt-2 border-t border-[#e7e2d9] flex justify-end">
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
