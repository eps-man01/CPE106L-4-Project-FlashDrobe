import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Camera,
  FolderOpen,
  Check,
  Plus,
  Trash2,
  RotateCw,
  Shirt,
  Scissors,
  Footprints,
  Layers,
  Watch,
  Thermometer,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { ClothingClassification, SeasonSuitability } from '../../types';
import { useDelayedRender } from '../../hooks/useDelayedRender';
import { correctImageOrientation } from '../../utils/canvasHelpers';

interface AddClothingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'camera' | 'upload';
}

const CLASSIFICATION_OPTIONS: {
  id: ClothingClassification;
  label: string;
  icon: React.FC<{ className?: string }>;
  defaultSubType: string;
  defaultSeason: SeasonSuitability;
}[] = [
  { id: 'Tops', label: 'Tops', icon: Shirt, defaultSubType: 'T-Shirt', defaultSeason: 'All-weather' },
  { id: 'Bottoms', label: 'Bottoms', icon: Scissors, defaultSubType: 'Pants', defaultSeason: 'All-weather' },
  { id: 'Footwear', label: 'Footwear', icon: Footprints, defaultSubType: 'Sneakers', defaultSeason: 'All-weather' },
  { id: 'Outerwear', label: 'Outerwear', icon: Layers, defaultSubType: 'Jacket', defaultSeason: 'Cold' },
  { id: 'Accessories', label: 'Accessories', icon: Watch, defaultSubType: 'Accessory', defaultSeason: 'All-weather' },
];

export const AddClothingModal: React.FC<AddClothingModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'camera',
}) => {
  const { addClothingItem } = useWardrobe();

  const [shouldRender, isExiting] = useDelayedRender(isOpen);

  const [activePhotoTab, setActivePhotoTab] = useState<'camera' | 'upload'>(initialMode);
  const [imageUrl, setImageUrl] = useState<string>('');

  // Classification & Garment Attributes
  const [selectedClassification, setSelectedClassification] = useState<ClothingClassification>('Tops');
  const [warmthLevel, setWarmthLevel] = useState<number>(2);
  const [seasonSuitability, setSeasonSuitability] = useState<SeasonSuitability>('All-weather');

  // Camera & File refs
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraStreamActive, setIsCameraStreamActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isDragging, setIsDragging] = useState(false);

  // Sync mode when opened
  useEffect(() => {
    if (isOpen) {
      setActivePhotoTab(initialMode);
      if (initialMode === 'camera') {
        startLiveCamera();
      }
    } else {
      cleanupModal();
    }
  }, [isOpen, initialMode]);

  const cleanupModal = () => {
    stopCameraStream();
    setImageUrl('');
    setSelectedClassification('Tops');
    setWarmthLevel(2);
    setSeasonSuitability('All-weather');
  };

  // Handle clipboard paste for quick image addition
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            processImageFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [isOpen]);

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraStreamActive(false);
  };

  const startLiveCamera = async (facing: 'environment' | 'user' = cameraFacing) => {
    stopCameraStream();
    try {
      setIsCameraStreamActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.warn('Live Camera stream not available; falling back to device camera picker:', err);
      setIsCameraStreamActive(false);
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startLiveCamera(nextFacing);
  };

  const captureFromLiveCamera = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setImageUrl(dataUrl);
        stopCameraStream();
      }
    }
  };

  const processImageFile = async (file: File) => {
    try {
      const correctedUrl = await correctImageOrientation(file);
      setImageUrl(correctedUrl);
      stopCameraStream();
    } catch {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const dataUrl = event.target.result as string;
          setImageUrl(dataUrl);
          stopCameraStream();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleNativeCameraFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImageFile(file);
    }
  };

  const handleRemovePhoto = () => {
    setImageUrl('');
    if (activePhotoTab === 'camera') {
      startLiveCamera();
    }
  };

  const handleClassificationSelect = (cls: ClothingClassification) => {
    setSelectedClassification(cls);
    const option = CLASSIFICATION_OPTIONS.find((opt) => opt.id === cls);
    if (option) {
      setSeasonSuitability(option.defaultSeason);
      if (cls === 'Outerwear') {
        setWarmthLevel(4);
      } else if (cls === 'Tops' || cls === 'Bottoms') {
        setWarmthLevel(2);
      } else if (cls === 'Accessories') {
        setWarmthLevel(1);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert('Please take or upload a photo of the clothing item first.');
      return;
    }

    const currentOption = CLASSIFICATION_OPTIONS.find((opt) => opt.id === selectedClassification);
    const finalSubType = currentOption?.defaultSubType || selectedClassification;
    const finalName = selectedClassification;

    addClothingItem({
      name: finalName,
      classification: selectedClassification,
      subType: finalSubType,
      color: '#1c1917',
      colorName: 'Neutral',
      warmthLevel,
      seasonSuitability,
      tags: [selectedClassification.toLowerCase()],
      imageUrl,
      isFavorite: false,
    });

    cleanupModal();
    onClose();
  };

  if (!shouldRender) return null;

  return (
    <div
      id="add-clothing-modal-overlay"
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm ${isExiting ? 'animate-md-fade-out' : 'animate-in fade-in duration-150'}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.35)', color: 'var(--md-on-surface)' }}
    >
      <div
        id="add-clothing-bottom-sheet"
        className={`w-full max-w-lg border-t sm:border sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col overflow-hidden md-elevation-5 ${isExiting ? 'animate-md-exit' : 'animate-md-sheet'}`}
        style={{ backgroundColor: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline-variant)' }}
      >
        {/* Header */}
        <div
          className="px-5 py-3.5 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--md-outline-variant)', backgroundColor: 'var(--md-surface-container)' }}
        >
          <div className="flex items-center space-x-2.5">
            <div
              className="w-8 h-8 rounded-xl border flex items-center justify-center md-elevation-1"
              style={{ backgroundColor: 'var(--md-primary-container)', borderColor: 'var(--md-outline-variant)' }}
            >
              <Camera className="w-4 h-4 stroke-[2.5]" style={{ color: 'var(--md-primary)' }} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm" style={{ color: 'var(--md-on-surface)' }}>Add Item to Wardrobe</h3>
              <p className="text-[11px]" style={{ color: 'var(--md-on-surface-variant)' }}>Take or upload a photo and pick category</p>
            </div>
          </div>
          <button
            onClick={() => {
              cleanupModal();
              onClose();
            }}
            className="p-1.5 rounded-full transition-colors"
            style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* Photo Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>
                Garment Photo *
              </label>
              {imageUrl && (
                <span className="text-[10px] font-bold flex items-center space-x-1" style={{ color: 'var(--md-primary)' }}>
                  <Check className="w-3 h-3" />
                  <span>Photo Ready</span>
                </span>
              )}
            </div>

            {/* Photo Tabs */}
            <div
              className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl mb-3 border"
              style={{ backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
            >
              <button
                type="button"
                id="tab-select-camera"
                onClick={() => {
                  setActivePhotoTab('camera');
                  if (!imageUrl) startLiveCamera();
                }}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all border ${
                  activePhotoTab === 'camera' ? 'md-elevation-1' : ''
                }`}
                style={
                  activePhotoTab === 'camera'
                    ? { backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-primary)', borderColor: 'var(--md-outline-variant)' }
                    : { color: 'var(--md-on-surface-variant)', borderColor: 'transparent' }
                }
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Snap Camera</span>
              </button>

              <button
                type="button"
                id="tab-select-gallery"
                onClick={() => {
                  setActivePhotoTab('upload');
                  stopCameraStream();
                }}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all border ${
                  activePhotoTab === 'upload' ? 'md-elevation-1' : ''
                }`}
                style={
                  activePhotoTab === 'upload'
                    ? { backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-primary)', borderColor: 'var(--md-outline-variant)' }
                    : { color: 'var(--md-on-surface-variant)', borderColor: 'transparent' }
                }
              >
                <FolderOpen className="w-3.5 h-3.5" />
                <span>Gallery / Files</span>
              </button>
            </div>

            {/* Hidden Inputs */}
            <input
              type="file"
              ref={galleryInputRef}
              onChange={handleGalleryFileChange}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={nativeCameraInputRef}
              onChange={handleNativeCameraFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            {/* Camera View / File Selection when no image is loaded */}
            {!imageUrl && (
              <>
                {activePhotoTab === 'camera' && (
                  <div className="space-y-2 mb-3">
                    {isCameraStreamActive ? (
                      <div
                        className="relative rounded-2xl overflow-hidden aspect-[4/3] border flex flex-col items-center justify-center shadow-inner"
                        style={{ backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
                      >
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />

                        {/* Centering Guide */}
                        <div
                          className="absolute inset-8 border-2 border-dashed rounded-2xl pointer-events-none flex items-center justify-center"
                          style={{ borderColor: 'rgba(255,255,255,0.5)' }}
                        >
                          <span
                            className="text-[11px] px-3 py-1 rounded-full font-medium backdrop-blur-xs"
                            style={{ color: 'rgba(255,255,255,0.9)', backgroundColor: 'var(--md-scrim)', opacity: 0.6 }}
                          >
                            Position clothing item here
                          </span>
                        </div>

                        {/* Camera Flip */}
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          title="Switch Camera"
                          className="absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-colors"
                          style={{ backgroundColor: 'var(--md-scrim)', opacity: 0.6, color: 'var(--md-on-primary)' }}
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>

                        {/* Shutter Capture Button */}
                        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center">
                          <button
                            type="button"
                            id="btn-snap-live-camera"
                            onClick={captureFromLiveCamera}
                            className="px-6 py-2.5 font-extrabold text-xs rounded-full flex items-center space-x-2 border-2 transition-transform active:scale-95 md-elevation-3"
                            style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)', borderColor: 'var(--md-on-primary)' }}
                          >
                            <Camera className="w-4 h-4" />
                            <span>Capture Photo</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Mobile Native Camera Launcher */
                      <div
                        className="border-2 border-dashed rounded-3xl p-5 text-center flex flex-col items-center justify-center space-y-3"
                        style={{ backgroundColor: 'var(--md-primary-container)', borderColor: 'var(--md-outline-variant)' }}
                      >
                        <div
                          className="w-12 h-12 rounded-2xl border flex items-center justify-center md-elevation-1"
                          style={{ backgroundColor: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline-variant)' }}
                        >
                          <Camera className="w-6 h-6" style={{ color: 'var(--md-primary)' }} />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold" style={{ color: 'var(--md-on-surface)' }}>
                            Snap Clothing Photo
                          </h4>
                          <p className="text-[11px] max-w-xs mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                            Take a photo using your phone or web camera
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full max-w-xs">
                          <button
                            type="button"
                            onClick={() => nativeCameraInputRef.current?.click()}
                            className="flex-1 py-2.5 px-4 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 transition-colors md-elevation-1"
                            style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                          >
                            <Camera className="w-4 h-4" />
                            <span>Open Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startLiveCamera()}
                            className="py-2.5 px-3 font-bold text-xs rounded-xl transition-colors border"
                            style={{ backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
                          >
                            Live Viewfinder
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activePhotoTab === 'upload' && (
                  <div className="space-y-2 mb-3">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => galleryInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-3xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                        isDragging ? 'scale-[0.99]' : ''
                      }`}
                      style={
                        isDragging
                          ? { borderColor: 'var(--md-primary)', backgroundColor: 'var(--md-primary-container)' }
                          : { borderColor: 'var(--md-outline-variant)', backgroundColor: 'var(--md-surface-container)' }
                      }
                    >
                      <div
                        className="w-12 h-12 rounded-2xl border flex items-center justify-center md-elevation-1"
                        style={{ backgroundColor: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline-variant)' }}
                      >
                        <FolderOpen className="w-6 h-6" style={{ color: 'var(--md-primary)' }} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>
                          Choose Photo from Phone Gallery
                        </h4>
                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                          Tap to browse photos &bull; Drag & drop or paste
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-1 px-4 py-2 border text-xs font-bold rounded-xl transition-colors md-elevation-1"
                        style={{ backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }}
                      >
                        Browse Photos
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Photo Preview Strip when photo is loaded */}
            {imageUrl && (
              <div className="space-y-3 mb-2">
                <div
                  className="flex items-center space-x-3 p-3 rounded-2xl border md-elevation-1"
                  style={{ backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
                >
                  <img
                    src={imageUrl}
                    alt="Clothing item"
                    className="w-16 h-16 object-cover rounded-xl flex-shrink-0 border"
                    style={{ borderColor: 'var(--md-outline-variant)', backgroundColor: 'var(--md-surface-container-lowest)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-extrabold truncate block" style={{ color: 'var(--md-on-surface)' }}>
                      {selectedClassification}
                    </span>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--md-on-surface-variant)' }}>
                      Category: <strong style={{ color: 'var(--md-on-surface)' }}>{selectedClassification}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    title="Retake / Change Photo"
                    className="p-2 rounded-xl transition-colors"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Classification Category Selection */}
                <div
                  className="p-3.5 rounded-2xl border space-y-3"
                  style={{ backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>
                        Select Category:
                      </label>
                      <span
                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
                        style={{ color: 'var(--md-primary)', backgroundColor: 'var(--md-primary-container)', borderColor: 'var(--md-outline-variant)' }}
                      >
                        {selectedClassification}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {CLASSIFICATION_OPTIONS.map((opt) => {
                        const IconComp = opt.icon;
                        const isSelected = selectedClassification === opt.id;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleClassificationSelect(opt.id)}
                            className={`py-2 px-1 rounded-xl text-xs font-bold border transition-all flex flex-col items-center space-y-1 ${
                              isSelected ? 'scale-[1.02] md-elevation-1' : 'active:scale-98'
                            }`}
                            style={
                              isSelected
                                ? { backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)', borderColor: 'var(--md-primary)' }
                                : { backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-on-surface)', borderColor: 'var(--md-outline-variant)' }
                            }
                          >
                            <IconComp className="w-4 h-4" />
                            <span className="text-[10px] leading-tight">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Warmth Level for weather algorithm matching */}
                  <div
                    className="pt-2 border-t flex items-center justify-between"
                    style={{ borderColor: 'var(--md-outline-variant)' }}
                  >
                    <label className="text-[11px] font-bold flex items-center space-x-1" style={{ color: 'var(--md-on-surface)' }}>
                      <Thermometer className="w-3 h-3" style={{ color: 'var(--md-on-surface-variant)' }} />
                      <span>Warmth Level:</span>
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setWarmthLevel(lvl)}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold border transition-colors ${
                            warmthLevel === lvl ? 'md-elevation-1' : ''
                          }`}
                          style={
                            warmthLevel === lvl
                              ? { backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)', borderColor: 'var(--md-primary)' }
                              : { backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-on-surface-variant)', borderColor: 'var(--md-outline-variant)' }
                          }
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Direct Save Action Button */}
          <div className="pt-1">
            <button
              type="submit"
              id="btn-save-clothing-item"
              disabled={!imageUrl}
              className="w-full py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 transition-all active:scale-98 md-elevation-1"
              style={
                !imageUrl
                  ? { backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)', cursor: 'not-allowed' }
                  : { backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }
              }
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Save {selectedClassification} to Wardrobe</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
