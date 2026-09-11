import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  RotateCcw,
  Edit2,
  GraduationCap,
  Coffee,
  Briefcase,
  Dumbbell,
  Building2,
  Plane,
  Palmtree,
  Sparkles,
  Compass,
  Music,
  Heart,
  Sun,
  Flame,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { OutfitCategory } from '../../types';
import { useDelayedRender } from '../../hooks/useDelayedRender';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVAILABLE_ICONS = [
  { name: 'GraduationCap', label: 'School/Academic' },
  { name: 'Coffee', label: 'Casual/Cafe' },
  { name: 'Briefcase', label: 'Formal/Business' },
  { name: 'Dumbbell', label: 'Athletic/Gym' },
  { name: 'Building2', label: 'Work/Office' },
  { name: 'Plane', label: 'Travel/Trip' },
  { name: 'Palmtree', label: 'Beach/Resort' },
  { name: 'Sparkles', label: 'Party/Night Out' },
  { name: 'Compass', label: 'Outdoor/Hike' },
  { name: 'Music', label: 'Concert/Festival' },
  { name: 'Heart', label: 'Date Night' },
  { name: 'Flame', label: 'Streetwear' },
];

export const ManageCategoriesModal: React.FC<ManageCategoriesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { categories, addCategory, deleteCategory, updateCategory, restoreDefaultCategories } =
    useWardrobe();

  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Sparkles');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newCatOccasion, setNewCatOccasion] = useState('');

  const [shouldRender, isExiting] = useDelayedRender(isOpen);

  if (!shouldRender) return null;

  const renderIcon = (iconName: string) => {
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
      case 'Compass':
        return <Compass className="w-4 h-4" />;
      case 'Music':
        return <Music className="w-4 h-4" />;
      case 'Heart':
        return <Heart className="w-4 h-4" />;
      case 'Flame':
        return <Flame className="w-4 h-4" />;
      default:
        return <Sparkles className="w-4 h-4" />;
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    addCategory({
      name: newCatName.trim(),
      icon: newCatIcon,
      description: newCatDesc.trim() || 'Custom personalized category',
      defaultOccasion: newCatOccasion.trim() || 'Personalized wear',
      colorAccent: 'from-amber-600 to-indigo-700',
    });

    setNewCatName('');
    setNewCatDesc('');
    setNewCatOccasion('');
    setIsCreating(false);
  };

  return (
    <div
      id="manage-categories-modal-overlay"
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm ${isExiting ? 'animate-md-fade-out' : 'animate-in fade-in duration-150'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}
    >
      <div
        id="manage-categories-sheet"
        className={`w-full max-w-lg bg-white border-t sm:border border-[#e7e2d9] sm:rounded-3xl rounded-t-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-stone-900 ${isExiting ? 'animate-md-exit' : 'animate-md-sheet'}`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#e7e2d9] flex items-center justify-between bg-stone-50/90">
          <div>
            <h3 className="font-extrabold text-stone-900 text-sm">Personalized Outfit Categories</h3>
            <p className="text-[11px] text-stone-500">
              Create, edit, or customize occasion categories
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-200/80 text-stone-600 hover:text-stone-900 hover:bg-stone-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* Add Category Trigger / Form */}
          {isCreating ? (
            <form
              onSubmit={handleCreate}
              className="bg-stone-50 p-4 rounded-2xl border border-[#ddcfbe] space-y-3 shadow-xs"
            >
              <h4 className="text-xs font-bold text-[#8c5836] uppercase tracking-wider">
                New Custom Category
              </h4>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Hiking & Camping, Laboratory Duty"
                  required
                  className="w-full bg-white border border-[#e7e2d9] rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8c5836]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Category Icon
                </label>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVAILABLE_ICONS.map((ico) => (
                    <button
                      key={ico.name}
                      type="button"
                      onClick={() => setNewCatIcon(ico.name)}
                      title={ico.label}
                      className={`p-2 rounded-xl flex items-center justify-center border transition-all ${
                        newCatIcon === ico.name
                          ? 'bg-[#8c5836] text-white border-[#8c5836] shadow-xs font-bold'
                          : 'bg-white border-[#e7e2d9] text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                      }`}
                    >
                      {renderIcon(ico.name)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Default Activity / Occasion
                </label>
                <input
                  type="text"
                  value={newCatOccasion}
                  onChange={(e) => setNewCatOccasion(e.target.value)}
                  placeholder="e.g. Outdoor Trails, Clinic & Hospital"
                  className="w-full bg-white border border-[#e7e2d9] rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8c5836]"
                />
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#8c5836] hover:bg-[#784a2c] text-white font-bold rounded-xl text-xs shadow-xs transition-colors"
                >
                  Create Category
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full py-3 bg-[#f5ede3]/70 hover:bg-[#f5ede3] border border-dashed border-[#ddcfbe] rounded-2xl text-xs font-bold text-[#8c5836] flex items-center justify-center space-x-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Outfit Category</span>
            </button>
          )}

          {/* List of existing & added categories */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1 pt-1">
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                Outfit Categories ({categories.length})
              </span>
              <button
                type="button"
                onClick={restoreDefaultCategories}
                className="text-[11px] font-bold text-[#8c5836] hover:text-[#784a2c] flex items-center space-x-1 transition-colors"
                title="Restore standard default occasion categories"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore Defaults</span>
              </button>
            </div>

            {categories.map((cat) => (
              <div
                key={cat.id}
                className="bg-stone-50/90 border border-[#e7e2d9] rounded-2xl p-3 flex items-center justify-between shadow-2xs hover:border-[#ddcfbe] transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-white border border-[#e7e2d9] flex items-center justify-center text-[#8c5836] shadow-2xs flex-shrink-0">
                    {renderIcon(cat.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-xs font-bold text-stone-900 truncate">{cat.name}</h4>
                      {cat.isCustom ? (
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#f5ede3] text-[#784a2c] font-bold rounded border border-[#e5dec9] flex-shrink-0">
                          Added
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.2 bg-stone-200/80 text-stone-600 font-bold rounded border border-stone-300/60 flex-shrink-0">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">{cat.description}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteCategory(cat.id)}
                  className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors ml-2 flex-shrink-0"
                  title={`Remove ${cat.name} category`}
                  aria-label={`Remove ${cat.name} category`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="text-center py-8 px-4 bg-stone-50 rounded-2xl border border-dashed border-[#ddcfbe] space-y-3">
                <p className="text-xs text-stone-500 font-medium">All categories have been removed.</p>
                <button
                  type="button"
                  onClick={restoreDefaultCategories}
                  className="px-4 py-2 bg-[#8c5836] hover:bg-[#784a2c] text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                >
                  Restore Default Categories
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
