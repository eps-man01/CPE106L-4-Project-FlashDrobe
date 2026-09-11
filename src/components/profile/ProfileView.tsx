import React, { useState, useRef } from 'react';
import {
  User,
  Sliders,
  Sparkles,
  Layers,
  Heart,
  RotateCcw,
  Check,
  FolderOpen,
  LogOut,
  Camera,
  Upload,
  Trash2,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { ManageCategoriesModal } from '../categories/ManageCategoriesModal';
import { BodyCaptureWizard } from '../tryon/BodyCaptureWizard';
import { StorageService } from '../../services/StorageService';
import { UserBodyProfile } from '../../types';

export const ProfileView: React.FC = () => {
  const {
    userProfile,
    updateUserProfile,
    wardrobe,
    outfits,
    categories,
    resetAllData,
    logout,
    customTryOnPhoto,
    setCustomTryOnPhoto,
  } = useWardrobe();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(userProfile.name);
  const [customNotes, setCustomNotes] = useState(userProfile.customNotes || '');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBodyCaptureOpen, setIsBodyCaptureOpen] = useState(false);
  const [bodyProfile, setBodyProfile] = useState<UserBodyProfile | null>(
    StorageService.loadBodyProfile(userProfile.id)
  );
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [deleteConfirmationMessage, setDeleteConfirmationMessage] = useState<string | null>(null);

  const handleDeleteBodyProfile = () => {
    StorageService.deleteBodyProfile(userProfile.id);
    setCustomTryOnPhoto(null);
    updateUserProfile({ uploadedTryOnPhoto: undefined });
    setBodyProfile(null);
    setIsDeletingProfile(false);
    setDeleteConfirmationMessage('All body photographs and virtual try-on models have been permanently erased from your device.');
    setTimeout(() => setDeleteConfirmationMessage(null), 4000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      if (typeof loadEvt.target?.result === 'string') {
        setCustomTryOnPhoto(loadEvt.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: name.trim() || userProfile.name,
      customNotes: customNotes.trim(),
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const favoriteItemsCount = wardrobe.filter((i) => i.isFavorite).length;

  return (
    <div id="profile-view-root" className="space-y-4 pb-24 text-stone-900">
      {/* User Hero Card */}
      <div className="bg-white border border-[#e7e2d9] rounded-3xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex items-center space-x-3.5 relative z-10">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#e7e2d9] shadow-sm flex-shrink-0 bg-stone-100">
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#f5ede3] text-[#784a2c] border border-[#e5dec9]">
                Wardrobe Member
              </span>
              <span className="text-[10px] text-stone-400 font-semibold">Android D-PWA</span>
            </div>
            <h2 className="text-base font-extrabold text-stone-900 truncate mt-0.5">
              {userProfile.name}
            </h2>
            <p className="text-xs text-stone-500 truncate">{userProfile.email}</p>
          </div>
        </div>

        {/* Quick Wardrobe Stats */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-[#e7e2d9]">
          <div className="bg-stone-50 p-2.5 rounded-2xl text-center border border-[#e7e2d9]">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">Closet</span>
            <span className="text-sm font-black text-[#8c5836]">{wardrobe.length}</span>
            <span className="text-[9px] text-stone-400 block font-medium">Items</span>
          </div>

          <div className="bg-stone-50 p-2.5 rounded-2xl text-center border border-[#e7e2d9]">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">Looks</span>
            <span className="text-sm font-black text-[#a67c52]">{outfits.length}</span>
            <span className="text-[9px] text-stone-400 block font-medium">Saved</span>
          </div>

          <div className="bg-stone-50 p-2.5 rounded-2xl text-center border border-[#e7e2d9]">
            <span className="text-[10px] text-stone-500 uppercase font-bold block">Favorites</span>
            <span className="text-sm font-black text-rose-600">{favoriteItemsCount}</span>
            <span className="text-[9px] text-stone-400 block font-medium">Starred</span>
          </div>
        </div>
      </div>

      {/* Virtual Try-On Body Representation & Privacy Suite */}
      <div className="bg-white border border-[#e7e2d9] rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#e7e2d9] pb-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#8c5836]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-800">
              Virtual Try-On Body Profile & Privacy
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
            <span>🔒</span>
            <span>Private User Data</span>
          </span>
        </div>

        <p className="text-xs text-stone-500">
          Photographs of yourself are stored securely and privately. They are only used to composite outfits in your personal Virtual Dressing Room.
        </p>

        {deleteConfirmationMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{deleteConfirmationMessage}</span>
          </div>
        )}

        {/* Multi-angle representations summary */}
        {bodyProfile ? (
          <div className="space-y-3">
            <div className="grid grid-cols-4 gap-2">
              {(['front', 'left', 'right', 'back'] as const).map((view) => {
                const photo = bodyProfile.views[view];
                return (
                  <div
                    key={view}
                    className="flex flex-col items-center bg-stone-50 border border-[#e7e2d9] rounded-2xl p-1.5"
                  >
                    <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-stone-200 flex items-center justify-center">
                      {photo ? (
                        <img
                          src={photo}
                          alt={view}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Camera className="w-4 h-4 text-stone-400" />
                      )}
                    </div>
                    <span className="text-[10px] font-bold uppercase mt-1 text-stone-700">
                      {view}
                    </span>
                    <span className="text-[9px] text-stone-400">
                      {photo ? 'Captured' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
              <span>Updated: {new Date(bodyProfile.updatedAt).toLocaleDateString()}</span>
              <span className="text-[#8c5836] font-bold capitalize">
                {bodyProfile.representationType} representation
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-3 p-3 bg-stone-50 rounded-2xl border border-dashed border-[#ddcfbe]">
            <div className="w-14 h-18 rounded-xl bg-stone-200 border border-[#e7e2d9] overflow-hidden flex items-center justify-center shrink-0">
              {customTryOnPhoto ? (
                <img
                  src={customTryOnPhoto}
                  alt="Current"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Camera className="w-6 h-6 text-stone-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold text-stone-800 block">
                {customTryOnPhoto ? 'Single Image Active' : 'No Body Capture Yet'}
              </span>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Take photos with the camera guide for multi-angle virtual try-on fitting.
              </p>
            </div>
          </div>
        )}

        {/* Action Controls: Retake / Setup & Permanent Deletion */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={() => setIsBodyCaptureOpen(true)}
            className="flex-1 py-2.5 px-3 bg-[#8c5836] hover:bg-[#784a2c] text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-xs transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{bodyProfile ? 'Retake / Calibrate Body Views' : 'Capture Body Views'}</span>
          </button>

          {(bodyProfile || customTryOnPhoto) && (
            <>
              {!isDeletingProfile ? (
                <button
                  type="button"
                  onClick={() => setIsDeletingProfile(true)}
                  className="py-2.5 px-3 bg-stone-100 hover:bg-rose-50 text-stone-700 hover:text-rose-700 font-bold rounded-xl text-xs border border-[#e7e2d9] hover:border-rose-200 flex items-center justify-center space-x-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete Profile Data</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleDeleteBodyProfile}
                    className="flex-1 sm:flex-none py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Confirm Delete</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDeletingProfile(false)}
                    className="py-2 px-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Outfit Categories Manager Launcher */}
      <div className="bg-white border border-[#e7e2d9] rounded-3xl p-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#f5ede3] border border-[#e5dec9] flex items-center justify-center text-[#8c5836]">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-stone-900">Manage Outfit Categories</h4>
            <p className="text-[11px] text-stone-500">
              {categories.length} categories (School, Casual, Work, etc.)
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCategoryModalOpen(true)}
          className="px-3.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl border border-[#e7e2d9] transition-colors"
        >
          Customize
        </button>
      </div>

      {/* Profile Form */}
      <form
        onSubmit={handleSave}
        className="bg-white border border-[#e7e2d9] rounded-3xl p-4 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b border-[#e7e2d9] pb-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800 flex items-center space-x-1.5">
            <User className="w-3.5 h-3.5 text-[#8c5836]" />
            <span>Profile Settings</span>
          </h3>
          {savedSuccess && (
            <span className="text-[11px] font-bold text-[#6b7c59] flex items-center space-x-1">
              <Check className="w-3.5 h-3.5 text-[#6b7c59]" />
              <span>Saved!</span>
            </span>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Your Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full bg-stone-50 border border-[#e7e2d9] rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-[#8c5836] focus:bg-white"
          />
        </div>

        {/* Optional Stylist Notes */}
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1">
            Styling Preferences / Personal Notes (Optional)
          </label>
          <textarea
            rows={2}
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            placeholder="e.g., Prefers neutral and earthy tones, comfortable walking shoes..."
            className="w-full bg-stone-50 border border-[#e7e2d9] rounded-xl px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:border-[#8c5836] focus:bg-white resize-none"
          />
        </div>

        <button
          type="submit"
          id="btn-save-profile"
          className="w-full py-3 bg-[#8c5836] hover:bg-[#784a2c] text-white font-bold rounded-2xl text-xs shadow-md shadow-[#8c5836]/20 transition-all"
        >
          Save Profile
        </button>
      </form>

      {/* Reset Data */}
      <div className="bg-white border border-[#e7e2d9] rounded-3xl p-4 text-xs text-stone-600 shadow-xs">
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-stone-400">Need a fresh start?</span>
          <button
            type="button"
            onClick={() => {
              if (confirm('Reset wardrobe and categories to initial default state?')) {
                resetAllData();
              }
            }}
            className="flex items-center space-x-1 text-[11px] text-rose-600 hover:text-rose-700 px-2 py-1 font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Demo Data</span>
          </button>
        </div>
      </div>

      {/* Categories Management Sheet Modal */}
      <ManageCategoriesModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      {/* Body Capture Wizard Modal */}
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

      {/* Account Logout Action */}
      <div className="pt-2">
        <button
          type="button"
          id="btn-logout"
          onClick={() => {
            if (confirm('Are you sure you want to log out of Flashdrobe?')) {
              logout();
            }
          }}
          className="w-full py-3 border border-red-200 bg-red-50/70 hover:bg-red-100/80 text-red-700 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-colors shadow-2xs"
        >
          <LogOut className="w-4 h-4 text-red-600" />
          <span>Log Out of Flashdrobe</span>
        </button>
      </div>
    </div>
  );
};
