import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Heart,
  RotateCcw,
  Check,
  FolderOpen,
  LogOut,
  Camera,
  Pencil,
  ChevronRight,
  Shirt,
  Plus,
  Trash2,
  GraduationCap,
  Coffee,
  Briefcase,
  Dumbbell,
  Building2,
  Plane,
  Palmtree,
  Compass,
  Music,
  Flame,
  Upload,
  RotateCw,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { BodyCaptureWizard } from '../tryon/BodyCaptureWizard';
import { StorageService } from '../../services/StorageService';
import { UserBodyProfile } from '../../types';

const renderCategoryIcon = (iconName: string) => {
  switch (iconName) {
    case 'GraduationCap': return <GraduationCap className="w-4 h-4" />;
    case 'Coffee': return <Coffee className="w-4 h-4" />;
    case 'Briefcase': return <Briefcase className="w-4 h-4" />;
    case 'Dumbbell': return <Dumbbell className="w-4 h-4" />;
    case 'Building2': return <Building2 className="w-4 h-4" />;
    case 'Plane': return <Plane className="w-4 h-4" />;
    case 'Palmtree': return <Palmtree className="w-4 h-4" />;
    case 'Compass': return <Compass className="w-4 h-4" />;
    case 'Music': return <Music className="w-4 h-4" />;
    case 'Heart': return <Heart className="w-4 h-4" />;
    case 'Flame': return <Flame className="w-4 h-4" />;
    default: return <Sparkles className="w-4 h-4" />;
  }
};

const CATEGORY_ICON_OPTIONS = [
  'GraduationCap', 'Coffee', 'Briefcase', 'Dumbbell', 'Building2',
  'Plane', 'Palmtree', 'Sparkles', 'Compass', 'Music', 'Heart', 'Flame',
];

export const ProfileView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    wardrobe,
    outfits,
    categories,
    addCategory,
    deleteCategory,
    restoreDefaultCategories,
    resetAllData,
    logout,
    customTryOnPhoto,
    setCustomTryOnPhoto,
  } = useWardrobe();

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(userProfile.name);
  const [customNotes, setCustomNotes] = useState(userProfile.customNotes || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isBodyCaptureOpen, setIsBodyCaptureOpen] = useState(false);
  const [bodyProfile, setBodyProfile] = useState<UserBodyProfile | null>(
    StorageService.loadBodyProfile(userProfile.id)
  );

  // Categories dropdown state
  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Sparkles');

  const favoriteItemsCount = wardrobe.filter((i) => i.isFavorite).length;

  const handleSaveName = () => {
    const trimmed = name.trim() || userProfile.name;
    setName(trimmed);
    updateUserProfile({ name: trimmed });
    setIsEditingName(false);
  };

  const handleSaveNotes = () => {
    updateUserProfile({ customNotes: customNotes.trim() });
    setIsEditingNotes(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      if (typeof loadEvt.target?.result === 'string') {
        updateUserProfile({ avatar: loadEvt.target.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    addCategory({
      name: newCatName.trim(),
      icon: newCatIcon,
      description: 'Custom category',
      defaultOccasion: 'Personalized wear',
      colorAccent: 'from-amber-600 to-indigo-700',
    });
    setNewCatName('');
    setNewCatIcon('Sparkles');
  };

  return (
    <div id="profile-view-root" className="space-y-4 pb-24 text-stone-900">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-[#8c5836] via-[#a16b47] to-[#b47043] rounded-3xl p-6 pt-8 pb-5 shadow-lg shadow-[#8c5836]/20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'1\'%3E%3Cpath d=\'M0 0h20v20H0V0zm20 20h20v20H20V20z\'/%3E%3C/g%3E%3C/svg%3E")', backgroundSize: '20px 20px' }} />

        <div className="flex flex-col items-center relative z-10">
          {/* Avatar with upload */}
          <div className="relative mb-3">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg shadow-black/20 bg-white/20">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-stone-50 transition-colors"
              title="Change profile picture"
            >
              <Camera className="w-3.5 h-3.5 text-[#8c5836]" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          {/* Name & Email */}
          <h2 className="text-lg font-extrabold text-white drop-shadow-sm">
            {userProfile.name}
          </h2>
          <p className="text-xs text-white/65 font-medium mt-0.5">
            {userProfile.email}
          </p>

          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-4 w-full max-w-xs">
            <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl py-2.5 px-2 text-center border border-white/10">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Shirt className="w-3 h-3 text-white/80" />
                <span className="text-base font-black text-white">{wardrobe.length}</span>
              </div>
              <span className="text-[10px] text-white/60 font-semibold uppercase">Closet</span>
            </div>
            <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl py-2.5 px-2 text-center border border-white/10">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Sparkles className="w-3 h-3 text-white/80" />
                <span className="text-base font-black text-white">{outfits.length}</span>
              </div>
              <span className="text-[10px] text-white/60 font-semibold uppercase">Looks</span>
            </div>
            <div className="flex-1 bg-white/15 backdrop-blur-sm rounded-2xl py-2.5 px-2 text-center border border-white/10">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Heart className="w-3 h-3 text-white/80" />
                <span className="text-base font-black text-white">{favoriteItemsCount}</span>
              </div>
              <span className="text-[10px] text-white/60 font-semibold uppercase">Faves</span>
            </div>
          </div>
        </div>
      </div>

      {/* My Style Profile */}
      <div className="bg-white border border-[#e7e2d9] rounded-3xl shadow-sm overflow-hidden">
        <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-[#e7e2d9]">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#8c5836]" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
              My Style Profile
            </h3>
          </div>
        </div>

        <div className="divide-y divide-[#e7e2d9]">
          {/* Body Photos Row */}
          <button
            type="button"
            onClick={() => setIsBodyCaptureOpen(true)}
            className="w-full px-4 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors text-left"
          >
            <div className="flex items-center gap-1 shrink-0">
              {(['front', 'left', 'right', 'back'] as const).map((view) => {
                const photo = bodyProfile?.views[view];
                return (
                  <div
                    key={view}
                    className="w-8 h-10 rounded-lg overflow-hidden bg-stone-100 border border-[#e7e2d9] flex items-center justify-center"
                  >
                    {photo ? (
                      <img src={photo} alt={view} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-3 h-3 text-stone-300" />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold text-stone-900 block">
                {bodyProfile ? 'Body Views Captured' : 'Capture Body Views'}
              </span>
              <span className="text-[11px] text-stone-500">
                {bodyProfile
                  ? `Updated ${new Date(bodyProfile.updatedAt).toLocaleDateString()}`
                  : 'Multi-angle photos for virtual try-on'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-stone-400 shrink-0" />
          </button>

          {/* Name - Inline Edit */}
          <div className="px-4 py-3">
            <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
              Display Name
            </label>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  autoFocus
                  className="flex-1 bg-stone-50 border border-[#8c5836] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-[#8c5836]"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="p-2 bg-[#8c5836] rounded-xl text-white hover:bg-[#784a2c] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="w-full text-left flex items-center justify-between group"
              >
                <span className="text-xs text-stone-900 font-medium">{name}</span>
                <Pencil className="w-3 h-3 text-stone-400 group-hover:text-[#8c5836] transition-colors" />
              </button>
            )}
          </div>

          {/* Style Notes - Inline Edit */}
          <div className="px-4 py-3">
            <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
              Style Notes
            </label>
            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g., Prefers neutral tones, comfortable shoes..."
                  className="w-full bg-stone-50 border border-[#8c5836] rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c5836] resize-none"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="flex-1 py-2 bg-[#8c5836] hover:bg-[#784a2c] text-white font-bold rounded-xl text-xs transition-colors"
                  >
                    Save Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomNotes(userProfile.customNotes || '');
                      setIsEditingNotes(false);
                    }}
                    className="py-2 px-4 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingNotes(true)}
                className="w-full text-left group"
              >
                {customNotes ? (
                  <div className="flex items-start gap-2">
                    <div className="w-0.5 h-full bg-[#8c5836] rounded-full shrink-0 mt-0.5" style={{ minHeight: '20px' }} />
                    <p className="text-xs text-stone-600 italic flex-1 leading-relaxed">
                      {customNotes}
                    </p>
                    <Pencil className="w-3 h-3 text-stone-400 group-hover:text-[#8c5836] transition-colors shrink-0 mt-0.5" />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-stone-400 italic">
                      Add your styling preferences...
                    </span>
                    <Pencil className="w-3 h-3 text-stone-400 group-hover:text-[#8c5836] transition-colors" />
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Dropdown */}
      <div className="bg-white border border-[#e7e2d9] rounded-3xl shadow-xs overflow-hidden">
        {/* Dropdown Header */}
        <button
          type="button"
          onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
          className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#f5ede3] border border-[#e5dec9] flex items-center justify-center text-[#8c5836]">
              <FolderOpen className="w-4.5 h-4.5" />
            </div>
            <div className="text-left">
              <h4 className="text-xs font-bold text-stone-900">Outfit Categories</h4>
              <p className="text-[11px] text-stone-500">
                {categories.length} categories
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                restoreDefaultCategories();
              }}
              className="p-1.5 rounded-lg text-stone-400 hover:text-[#8c5836] hover:bg-[#f5ede3] transition-colors"
              title="Restore default categories"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <ChevronRight
              className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${
                isCategoriesExpanded ? 'rotate-90' : ''
              }`}
            />
          </div>
        </button>

        {/* Dropdown Content */}
        {isCategoriesExpanded && (
          <div className="border-t border-[#e7e2d9] px-4 py-3 space-y-2">
            {/* Category List */}
            {categories.length > 0 ? (
              <div className="space-y-1.5">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-stone-50 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#f5ede3] border border-[#e5dec9] flex items-center justify-center text-[#8c5836] shrink-0">
                      {renderCategoryIcon(cat.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900 truncate">{cat.name}</span>
                        {cat.isCustom ? (
                          <span className="text-[8px] px-1 py-0.5 bg-[#f5ede3] text-[#784a2c] font-bold rounded border border-[#e5dec9] shrink-0">
                            Custom
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all"
                      title={`Remove ${cat.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-stone-400 text-center py-2">No categories yet</p>
            )}

            {/* Add Category */}
            <div className="pt-2 border-t border-[#e7e2d9] space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name..."
                  className="flex-1 bg-stone-50 border border-[#e7e2d9] rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8c5836]"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCatName.trim()}
                  className="p-2 bg-[#8c5836] hover:bg-[#784a2c] disabled:bg-stone-300 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {/* Icon Picker */}
              <div className="flex items-center gap-1 flex-wrap">
                {CATEGORY_ICON_OPTIONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setNewCatIcon(iconName)}
                    className={`p-1.5 rounded-lg border transition-all ${
                      newCatIcon === iconName
                        ? 'bg-[#8c5836] text-white border-[#8c5836]'
                        : 'bg-white border-[#e7e2d9] text-stone-500 hover:bg-stone-50'
                    }`}
                  >
                    {renderCategoryIcon(iconName)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-[#e7e2d9] rounded-3xl shadow-xs overflow-hidden">
        {/* Logout */}
        <button
          type="button"
          id="btn-logout"
          onClick={() => {
            if (confirm('Are you sure you want to log out of Flashdrobe?')) {
              logout();
            }
          }}
          className="w-full px-4 py-3.5 flex items-center justify-center gap-2 hover:bg-red-50/50 transition-colors text-red-600"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-xs font-bold">Log Out</span>
        </button>
      </div>

      {/* Danger Zone */}
      <div className="flex justify-center pb-2">
        <button
          type="button"
          onClick={() => {
            if (confirm('Reset wardrobe and categories to initial default state?')) {
              resetAllData();
            }
          }}
          className="flex items-center space-x-1 text-[11px] text-stone-400 hover:text-rose-600 px-3 py-1.5 font-medium transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Body Capture Modal */}
      {isBodyCaptureOpen && (
        <BodyCaptureWizard
          userId={userProfile.id}
          onComplete={(newProfile) => {
            setBodyProfile(newProfile);
            if (newProfile.views.front) {
              setCustomTryOnPhoto(newProfile.views.front);
              updateUserProfile({ uploadedTryOnPhoto: newProfile.views.front });
            }
            setIsBodyCaptureOpen(false);
          }}
          onCancel={() => setIsBodyCaptureOpen(false)}
        />
      )}
    </div>
  );
};
