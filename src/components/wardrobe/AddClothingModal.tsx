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

  const processImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const dataUrl = event.target.result as string;
        setImageUrl(dataUrl);
        stopCameraStream();
      }
    };
    reader.readAsDataURL(file);
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

  if (!isOpen) return null;

  return (
    <div
      id="add-clothing-modal-overlay"
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 text-stone-900 animate-in fade-in duration-200"
    >
      <div
        id="add-clothing-bottom-sheet"
        className="w-full max-w-lg bg-white border-t sm:border border-[#e7e2d9] sm:rounded-3xl rounded-t-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#e7e2d9] flex items-center justify-between bg-stone-50/90">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#f5ede3] border border-[#e5dec9] flex items-center justify-center">
              <Camera className="w-4 h-4 text-[#8c5836] stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-stone-900 text-sm">Add Item to Wardrobe</h3>
              <p className="text-[11px] text-stone-500">Take or upload a photo and pick category</p>
            </div>
          </div>
          <button
            onClick={() => {
              cleanupModal();
              onClose();
            }}
            className="p-1.5 rounded-full bg-stone-200/80 text-stone-600 hover:text-stone-900 hover:bg-stone-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 py-4 space-y-4 no-scrollbar">
          {/* Photo Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-stone-800">
                Garment Photo *
              </label>
              {imageUrl && (
                <span className="text-[10px] text-[#6b7c59] font-bold flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>Photo Ready</span>
                </span>
              )}
            </div>

            {/* Photo Tabs */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-stone-100 rounded-2xl mb-3 border border-[#e7e2d9]">
              <button
                type="button"
                id="tab-select-camera"
                onClick={() => {
                  setActivePhotoTab('camera');
                  if (!imageUrl) startLiveCamera();
                }}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                  activePhotoTab === 'camera'
                    ? 'bg-white text-[#8c5836] shadow-xs border border-[#e7e2d9]'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
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
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 transition-all ${
                  activePhotoTab === 'upload'
                    ? 'bg-white text-[#8c5836] shadow-xs border border-[#e7e2d9]'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
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
                      <div className="relative rounded-2xl overflow-hidden bg-stone-950 aspect-[4/3] border border-stone-300 flex flex-col items-center justify-center shadow-inner">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                        />

                        {/* Centering Guide */}
                        <div className="absolute inset-8 border-2 border-dashed border-white/50 rounded-2xl pointer-events-none flex items-center justify-center">
                          <span className="text-[11px] text-white/90 bg-black/60 px-3 py-1 rounded-full font-medium backdrop-blur-xs">
                            Position clothing item here
                          </span>
                        </div>

                        {/* Camera Flip */}
                        <button
                          type="button"
                          onClick={toggleCameraFacing}
                          title="Switch Camera"
                          className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md transition-colors"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>

                        {/* Shutter Capture Button */}
                        <div className="absolute bottom-3 inset-x-0 flex items-center justify-center">
                          <button
                            type="button"
                            id="btn-snap-live-camera"
                            onClick={captureFromLiveCamera}
                            className="px-6 py-2.5 bg-[#8c5836] hover:bg-[#784a2c] text-white font-extrabold text-xs rounded-full flex items-center space-x-2 shadow-xl border-2 border-white transition-transform active:scale-95"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Capture Photo</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Mobile Native Camera Launcher */
                      <div className="bg-[#f5ede3]/70 border-2 border-dashed border-[#ddcfbe] rounded-3xl p-5 text-center flex flex-col items-center justify-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-[#e7e2d9] flex items-center justify-center shadow-xs">
                          <Camera className="w-6 h-6 text-[#8c5836]" />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-stone-900">
                            Snap Clothing Photo
                          </h4>
                          <p className="text-[11px] text-stone-500 max-w-xs mt-0.5">
                            Take a photo using your phone or web camera
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full max-w-xs">
                          <button
                            type="button"
                            onClick={() => nativeCameraInputRef.current?.click()}
                            className="flex-1 py-2.5 px-4 bg-[#8c5836] hover:bg-[#784a2c] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center space-x-1.5 transition-colors"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Open Camera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => startLiveCamera()}
                            className="py-2.5 px-3 bg-white hover:bg-stone-100 text-stone-700 border border-[#e7e2d9] font-bold text-xs rounded-xl transition-colors"
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
                        isDragging
                          ? 'border-[#8c5836] bg-[#f5ede3] scale-[0.99]'
                          : 'border-stone-300 hover:border-[#8c5836] bg-stone-50/60 hover:bg-[#f5ede3]/40'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white border border-[#e7e2d9] flex items-center justify-center shadow-xs">
                        <FolderOpen className="w-6 h-6 text-[#8c5836]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">
                          Choose Photo from Phone Gallery
                        </h4>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Tap to browse photos • Drag & drop or paste
                        </p>
                      </div>
                      <button
                        type="button"
                        className="mt-1 px-4 py-2 bg-white border border-[#e7e2d9] text-stone-800 text-xs font-bold rounded-xl shadow-2xs hover:bg-stone-100 transition-colors"
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
                <div className="flex items-center space-x-3 p-3 bg-stone-50 rounded-2xl border border-[#e7e2d9] shadow-2xs">
                  <img
                    src={imageUrl}
                    alt="Clothing item"
                    className="w-16 h-16 object-cover rounded-xl border border-[#e7e2d9] bg-white flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-extrabold text-stone-900 truncate block">
                      {selectedClassification}
                    </span>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Category: <strong className="text-stone-800">{selectedClassification}</strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    title="Retake / Change Photo"
                    className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Classification Category Selection */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-[#e7e2d9] space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold text-stone-800">
                        Select Category:
                      </label>
                      <span className="text-[10px] font-bold text-[#8c5836] bg-[#f5ede3] px-2.5 py-0.5 rounded-full border border-[#e5dec9]">
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
                              isSelected
                                ? 'bg-[#8c5836] text-white border-[#8c5836] shadow-sm scale-[1.02]'
                                : 'bg-white text-stone-700 border-[#e7e2d9] hover:bg-stone-100 active:scale-98'
                            }`}
                          >
                            <IconComp className="w-4 h-4" />
                            <span className="text-[10px] leading-tight">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Warmth Level for weather algorithm matching */}
                  <div className="pt-2 border-t border-[#e7e2d9] flex items-center justify-between">
                    <label className="text-[11px] font-bold text-stone-700 flex items-center space-x-1">
                      <Thermometer className="w-3 h-3 text-stone-500" />
                      <span>Warmth Level:</span>
                    </label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setWarmthLevel(lvl)}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold border transition-colors ${
                            warmthLevel === lvl
                              ? 'bg-[#8c5836] text-white border-[#8c5836]'
                              : 'bg-white text-stone-600 border-[#e7e2d9] hover:bg-stone-100'
                          }`}
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
              className={`w-full py-3.5 rounded-2xl text-xs font-bold shadow-md flex items-center justify-center space-x-2 transition-all active:scale-98 ${
                !imageUrl
                  ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  : 'bg-[#8c5836] hover:bg-[#784a2c] text-white shadow-[#8c5836]/25'
              }`}
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
