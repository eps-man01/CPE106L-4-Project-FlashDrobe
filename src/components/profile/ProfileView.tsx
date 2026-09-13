import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
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
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { BodyCaptureWizard } from '../tryon/BodyCaptureWizard';
import { UpdateBodyTypeModal } from './UpdateBodyTypeModal';
import { ColorSchemePicker } from './ColorSchemePicker';
import { StorageService } from '../../services/StorageService';
import { UserBodyProfile } from '../../types';

const renderCategoryIcon = (iconName: string) => {
  const style = { color: 'var(--md-primary)' };
  switch (iconName) {
    case 'GraduationCap': return <GraduationCap className="w-4 h-4" style={style} />;
    case 'Coffee': return <Coffee className="w-4 h-4" style={style} />;
    case 'Briefcase': return <Briefcase className="w-4 h-4" style={style} />;
    case 'Dumbbell': return <Dumbbell className="w-4 h-4" style={style} />;
    case 'Building2': return <Building2 className="w-4 h-4" style={style} />;
    case 'Plane': return <Plane className="w-4 h-4" style={style} />;
    case 'Palmtree': return <Palmtree className="w-4 h-4" style={style} />;
    case 'Compass': return <Compass className="w-4 h-4" style={style} />;
    case 'Music': return <Music className="w-4 h-4" style={style} />;
    case 'Heart': return <Heart className="w-4 h-4" style={style} />;
    case 'Flame': return <Flame className="w-4 h-4" style={style} />;
    default: return <Sparkles className="w-4 h-4" style={style} />;
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
    resetAllData,
    logout,
    customTryOnPhoto,
    setCustomTryOnPhoto,
    analyzeBodyPhoto,
    isAnalyzingBody,
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

  const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Sparkles');
  const [isBodyTypeModalOpen, setIsBodyTypeModalOpen] = useState(false);

  const [heightCm, setHeightCm] = useState(userProfile.heightCm?.toString() || '');
  const [weightKg, setWeightKg] = useState(userProfile.weightKg?.toString() || '');

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

  const handleSaveHeight = () => {
    const val = parseInt(heightCm);
    if (!isNaN(val) && val > 50 && val < 250) {
      updateUserProfile({ heightCm: val });
    }
  };

  const handleSaveWeight = () => {
    const val = parseInt(weightKg);
    if (!isNaN(val) && val > 20 && val < 300) {
      updateUserProfile({ weightKg: val });
    }
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
    <div id="profile-view-root" className="space-y-4 pb-24" style={{ color: 'var(--md-on-surface)' }}>
      {/* Hero Banner — Tonal Primary Container */}
      <div
        className="rounded-3xl p-6 pt-8 pb-6 relative overflow-hidden"
        style={{ backgroundColor: 'var(--md-primary-container)' }}
      >
        <div className="flex flex-col items-center relative z-10">
          {/* Avatar with upload */}
          <div className="relative mb-4">
            <motion.div
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 600, damping: 15 }}
              className="w-24 h-24 rounded-full overflow-hidden md-elevation-2"
              style={{
                border: '3px solid var(--md-on-primary-container)',
              }}
            >
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-0.5 -right-0.5 w-8 h-8 rounded-full flex items-center justify-center md-elevation-1 transition-transform"
              style={{
                backgroundColor: 'var(--md-surface)',
                color: 'var(--md-primary)',
              }}
              title="Change profile picture"
            >
              <Camera className="w-4 h-4" />
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
          <h2
            className="text-xl font-bold font-display"
            style={{ color: 'var(--md-on-primary-container)' }}
          >
            {userProfile.name}
          </h2>
          <p
            className="text-sm font-medium mt-0.5"
            style={{ color: 'color-mix(in srgb, var(--md-on-primary-container) 65%, transparent)' }}
          >
            {userProfile.email}
          </p>

          {/* Stats Row — Tonal Surfaces */}
          <div className="flex items-center gap-3 mt-5 w-full max-w-sm">
            <StatCard
              icon={<Shirt className="w-4 h-4" />}
              value={wardrobe.length}
              label="Closet"
            />
            <StatCard
              icon={<Sparkles className="w-4 h-4" />}
              value={outfits.length}
              label="Looks"
            />
            <StatCard
              icon={<Heart className="w-4 h-4" />}
              value={favoriteItemsCount}
              label="Faves"
            />
          </div>
        </div>
      </div>

      {/* Color Scheme Picker */}
      <ColorSchemePicker />

      {/* My Style Profile */}
      <div
        className="rounded-3xl overflow-hidden md-elevation-1"
        style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
      >
        <div
          className="px-5 pt-4 pb-3 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
            <h3
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: 'var(--md-on-surface)' }}
            >
              My Style Profile
            </h3>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--md-outline-variant)' }}>
          {/* AI Analyzing Banner */}
          {isAnalyzingBody && (
            <div
              className="px-5 py-3 flex items-center gap-2.5"
              style={{
                backgroundColor: 'var(--md-primary-container)',
                borderBottom: '1px solid var(--md-outline-variant)',
              }}
            >
              <div className="relative flex items-center justify-center w-5 h-5">
                <div
                  className="absolute inset-0 rounded-full animate-ping"
                  style={{ backgroundColor: 'var(--md-primary)', opacity: 0.3 }}
                />
                <Sparkles className="w-4 h-4 relative" style={{ color: 'var(--md-primary)' }} />
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold" style={{ color: 'var(--md-on-primary-container)' }}>
                  AI is analyzing your body photo...
                </span>
                <span className="text-[10px] block" style={{ color: 'var(--md-on-primary-container)', opacity: 0.7 }}>
                  Estimating height, weight, body type & styling rules
                </span>
              </div>
            </div>
          )}

          {/* Body Photos Row */}
          <button
            type="button"
            onClick={() => setIsBodyCaptureOpen(true)}
            className="w-full px-5 py-3.5 flex items-center gap-3 md-ripple text-left"
            style={{ borderBottom: '1px solid var(--md-outline-variant)' }}
          >
            <div className="flex items-center gap-1 shrink-0">
              {(['front', 'left', 'right', 'back'] as const).map((view) => {
                const photo = bodyProfile?.views[view];
                return (
                  <div
                    key={view}
                    className="w-9 h-11 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: 'var(--md-surface-container)' }}
                  >
                    {photo ? (
                      <img src={photo.imageUrl} alt={view} className="w-full h-full object-cover" />
                    ) : (
                      <Camera className="w-3.5 h-3.5" style={{ color: 'var(--md-on-surface-variant)' }} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-sm font-semibold block" style={{ color: 'var(--md-on-surface)' }}>
                {bodyProfile ? 'Body Views Captured' : 'Capture Body Views'}
              </span>
              <span className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                {bodyProfile
                  ? `Updated ${new Date(bodyProfile.updatedAt).toLocaleDateString()}`
                  : 'Multi-angle photos for virtual try-on'}
              </span>
            </div>
            <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'var(--md-on-surface-variant)' }} />
          </button>

          {/* AI Body Analysis Results */}
          {userProfile.bodyAnalysis && (
            <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" style={{ color: 'var(--md-tertiary)' }} />
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--md-on-surface-variant)' }}>
                  AI Body Analysis
                </span>
                <span className="text-[10px] ml-auto" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Last analyzed: {new Date(userProfile.bodyAnalysis.analyzedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="space-y-1.5">
                {userProfile.bodyAnalysis.stylingRules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px]" style={{ color: 'var(--md-on-surface)' }}>
                    <Check className="w-3 h-3 mt-0.5 shrink-0" style={{ color: 'var(--md-tertiary)' }} />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setIsBodyTypeModalOpen(true)}
                className="mt-2.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition-colors"
                style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-primary)' }}
              >
                Update Body Type
              </button>
            </div>
          )}

          {/* Name — Inline Edit */}
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--md-on-surface-variant)' }}>
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
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none md-elevation-1"
                  style={{
                    backgroundColor: 'var(--md-surface-container-high)',
                    color: 'var(--md-on-surface)',
                    caretColor: 'var(--md-primary)',
                  }}
                />
                <motion.button
                  type="button"
                  onClick={handleSaveName}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                >
                  <Check className="w-4 h-4" strokeWidth={3} />
                </motion.button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingName(true)}
                className="w-full text-left flex items-center justify-between group"
              >
                <span className="text-sm font-medium" style={{ color: 'var(--md-on-surface)' }}>{name}</span>
                <Pencil className="w-3.5 h-3.5 transition-colors" style={{ color: 'var(--md-on-surface-variant)' }} />
              </button>
            )}
          </div>

          {/* Height & Weight */}
          <div className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--md-outline-variant)' }}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  onBlur={handleSaveHeight}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveHeight()}
                  placeholder="e.g. 172"
                  min={50}
                  max={250}
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none md-elevation-1"
                  style={{
                    backgroundColor: 'var(--md-surface-container-high)',
                    color: 'var(--md-on-surface)',
                    caretColor: 'var(--md-primary)',
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  onBlur={handleSaveWeight}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveWeight()}
                  placeholder="e.g. 70"
                  min={20}
                  max={300}
                  className="w-full rounded-xl px-3 py-2.5 text-sm font-medium focus:outline-none md-elevation-1"
                  style={{
                    backgroundColor: 'var(--md-surface-container-high)',
                    color: 'var(--md-on-surface)',
                    caretColor: 'var(--md-primary)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Style Notes — Inline Edit */}
          <div className="px-5 py-3.5">
            <label className="block text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--md-on-surface-variant)' }}>
              Style Notes
            </label>
            {isEditingNotes ? (
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="e.g., Prefers neutral tones, comfortable shoes..."
                  className="w-full rounded-xl px-3 py-2.5 text-sm placeholder-stone-400 focus:outline-none resize-none md-elevation-1"
                  style={{
                    backgroundColor: 'var(--md-surface-container-high)',
                    color: 'var(--md-on-surface)',
                    caretColor: 'var(--md-primary)',
                  }}
                />
                <div className="flex items-center gap-2">
                  <motion.button
                    type="button"
                    onClick={handleSaveNotes}
                    whileTap={{ scale: 0.95 }}
                    className="flex-1 py-2.5 rounded-full text-sm font-bold transition-colors"
                    style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                  >
                    Save Notes
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomNotes(userProfile.customNotes || '');
                      setIsEditingNotes(false);
                    }}
                    className="py-2.5 px-5 rounded-full text-sm font-bold transition-colors"
                    style={{ backgroundColor: 'var(--md-surface-container-high)', color: 'var(--md-on-surface-variant)' }}
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
                    <div
                      className="w-0.5 rounded-full shrink-0 mt-0.5"
                      style={{ backgroundColor: 'var(--md-primary)', minHeight: '20px' }}
                    />
                    <p className="text-sm italic flex-1 leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {customNotes}
                    </p>
                    <Pencil className="w-3.5 h-3.5 transition-colors shrink-0 mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }} />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm italic" style={{ color: 'var(--md-on-surface-variant)' }}>
                      Add your styling preferences...
                    </span>
                    <Pencil className="w-3.5 h-3.5 transition-colors" style={{ color: 'var(--md-on-surface-variant)' }} />
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Categories Dropdown */}
      <div
        className="rounded-3xl overflow-hidden md-elevation-1"
        style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
      >
        <button
          type="button"
          onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between md-ripple"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--md-secondary-container)' }}
            >
              <FolderOpen className="w-5 h-5" style={{ color: 'var(--md-on-secondary-container)' }} />
            </div>
            <div className="text-left">
              <h4 className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>Outfit Categories</h4>
              <p className="text-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                {categories.length} categories
              </p>
            </div>
          </div>
          <ChevronRight
            className="w-4 h-4 transition-transform duration-200"
            style={{
              color: 'var(--md-on-surface-variant)',
              transform: isCategoriesExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            }}
          />
        </button>

        {isCategoriesExpanded && (
          <div className="px-5 py-3 space-y-2" style={{ borderTop: '1px solid var(--md-outline-variant)' }}>
            {categories.length > 0 ? (
              <div className="space-y-1">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl group transition-colors"
                    style={{ backgroundColor: 'var(--md-surface-container)' }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--md-surface-container-high)' }}
                    >
                      {renderCategoryIcon(cat.icon)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--md-on-surface)' }}>{cat.name}</span>
                        {cat.isCustom && (
                          <span
                            className="text-[8px] px-1.5 py-0.5 font-bold rounded-full"
                            style={{ backgroundColor: 'var(--md-tertiary-container)', color: 'var(--md-on-tertiary-container)' }}
                          >
                            Custom
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteCategory(cat.id)}
                      className="p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all"
                      style={{ color: 'var(--md-error)' }}
                      title={`Remove ${cat.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-center py-3" style={{ color: 'var(--md-on-surface-variant)' }}>No categories yet</p>
            )}

            {/* Add Category */}
            <div className="pt-2 space-y-2" style={{ borderTop: '1px solid var(--md-outline-variant)' }}>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New category name..."
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm focus:outline-none"
                  style={{
                    backgroundColor: 'var(--md-surface-container-high)',
                    color: 'var(--md-on-surface)',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                />
                <motion.button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={!newCatName.trim()}
                  whileTap={{ scale: 0.9 }}
                  className="w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-40"
                  style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                >
                  <Plus className="w-4 h-4" />
                </motion.button>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                {CATEGORY_ICON_OPTIONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setNewCatIcon(iconName)}
                    className="p-1.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: newCatIcon === iconName ? 'var(--md-primary-container)' : 'var(--md-surface-container)',
                      color: newCatIcon === iconName ? 'var(--md-on-primary-container)' : 'var(--md-on-surface-variant)',
                    }}
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
      <div
        className="rounded-3xl overflow-hidden md-elevation-1"
        style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
      >
        <button
          type="button"
          id="btn-logout"
          onClick={() => {
            if (confirm('Are you sure you want to log out of Flashdrobe?')) {
              logout();
            }
          }}
          className="w-full px-5 py-4 flex items-center justify-center gap-2 md-ripple transition-colors"
          style={{ color: 'var(--md-error)' }}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-bold">Log Out</span>
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
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 transition-colors"
          style={{ color: 'var(--md-on-surface-variant)' }}
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Demo Data</span>
        </button>
      </div>

      {/* Body Capture Modal */}
      <BodyCaptureWizard
        isOpen={isBodyCaptureOpen}
        onClose={() => setIsBodyCaptureOpen(false)}
        userId={userProfile.id}
        initialProfile={bodyProfile}
        analyzeBodyPhoto={analyzeBodyPhoto}
        onProfileSaved={(newProfile) => {
          setBodyProfile(newProfile);
          if (newProfile.views.front) {
            setCustomTryOnPhoto(newProfile.views.front.imageUrl);
            updateUserProfile({ uploadedTryOnPhoto: newProfile.views.front.imageUrl });
          }
          setIsBodyCaptureOpen(false);
        }}
      />

      {/* Update Body Type Modal */}
      <UpdateBodyTypeModal
        isOpen={isBodyTypeModalOpen}
        onClose={() => setIsBodyTypeModalOpen(false)}
        currentSex={userProfile.sex}
        currentBodyType={userProfile.bodyType}
        onSave={(sex, bodyType) => {
          updateUserProfile({ sex, bodyType });
          setIsBodyTypeModalOpen(false);
        }}
      />
    </div>
  );
};

/* ─── Stat Card Sub-Component ─────────────────────────── */
function StatCard({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <div
      className="flex-1 rounded-2xl py-3 px-2 text-center"
      style={{ backgroundColor: 'color-mix(in srgb, var(--md-on-primary-container) 8%, transparent)' }}
    >
      <div className="flex items-center justify-center gap-1 mb-0.5" style={{ color: 'var(--md-on-primary-container)' }}>
        {icon}
        <span className="text-xl font-bold font-display">{value}</span>
      </div>
      <span
        className="text-[10px] font-bold uppercase tracking-wider"
        style={{ color: 'color-mix(in srgb, var(--md-on-primary-container) 55%, transparent)' }}
      >
        {label}
      </span>
    </div>
  );
}
