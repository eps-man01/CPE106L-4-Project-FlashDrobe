import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  RefreshCw,
  Heart,
  Save,
  ChevronLeft,
  ChevronRight,
  Layers,
  Camera,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sliders,
  Maximize2,
  Share2,
  RotateCcw,
  Shirt,
  X,
  Plus,
  ArrowRight,
  Check,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import {
  BodyViewType,
  ClothingItem,
  ClothingClassification,
  UserBodyProfile,
  TryOnGenerationResult,
  TryOnGenerationProgress,
} from '../../types';
import { VirtualTryOnService } from '../../services/VirtualTryOnService';
import { StorageService } from '../../services/StorageService';
import { BodyCaptureWizard } from './BodyCaptureWizard';
import { useDelayedRender } from '../../hooks/useDelayedRender';

interface VirtualDressingRoomProps {
  onBack?: () => void;
}

const ANGLE_ORDER: BodyViewType[] = ['front', 'right', 'back', 'left'];

export const VirtualDressingRoom: React.FC<VirtualDressingRoomProps> = ({ onBack }) => {
  const {
    wardrobe,
    userProfile,
    updateUserProfile,
    tryOnItemIds,
    setTryOnItemIds,
    saveOutfit,
    outfits,
    setActiveTab,
    selectedTryOnModelId,
  } = useWardrobe();

  // Active perspective view
  const [activeAngle, setActiveAngle] = useState<BodyViewType>('front');
  const [showOriginalComparison, setShowOriginalComparison] = useState(false);

  // User Body Profile state
  const [bodyProfile, setBodyProfile] = useState<UserBodyProfile | null>(
    StorageService.loadBodyProfile(userProfile.id)
  );
  const [isBodyCaptureOpen, setIsBodyCaptureOpen] = useState(false);

  // Clothing slot drawer modal state
  const [activeCategoryDrawer, setActiveCategoryDrawer] = useState<ClothingClassification | null>(null);
  const [shouldRenderDrawer, isDrawerExiting] = useDelayedRender(!!activeCategoryDrawer);

  // Track which classification was last changed (for IDM-VTON targeting)
  const [lastChangedClassification, setLastChangedClassification] = useState<string | null>(null);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<TryOnGenerationProgress | null>(null);
  const [tryOnResult, setTryOnResult] = useState<TryOnGenerationResult | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Pre-rendered composites for each angle (enables instant crossfade)
  const [angleComposites, setAngleComposites] = useState<Record<string, string>>({});
  const [isPreRendering, setIsPreRendering] = useState(false);

  // Swipe gesture state
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  // Sync profile if user uploaded a photo in signup or previously
  useEffect(() => {
    if (!bodyProfile && userProfile.uploadedTryOnPhoto) {
      const initialProfile: UserBodyProfile = {
        id: `profile_${userProfile.id}`,
        userId: userProfile.id,
        views: {
          front: {
            viewType: 'front',
            imageUrl: userProfile.uploadedTryOnPhoto,
            validation: {
              isValid: true,
              brightnessScore: 85,
              isTooDark: false,
              isTooBright: false,
              blurScore: 90,
              isBlurry: false,
              framingScore: 88,
              isProperAspectRatio: true,
              aspectRatio: 1.45,
              issues: [],
              feedbackMessage: 'Authentic signup photo ready for try-on.',
            },
            capturedAt: new Date().toISOString(),
          },
        },
        bodyMetrics: {
          heightCm: 172,
          generalProportions: 'Authentic user silhouette',
          detectedAspect: 1.45,
        },
        status: 'ready',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setBodyProfile(initialProfile);
      StorageService.saveBodyProfile(initialProfile);
    }
  }, [userProfile.uploadedTryOnPhoto, bodyProfile, userProfile.id]);

  // Selected clothing items currently loaded in Dressing Room
  const selectedItems = useMemo(() => {
    return tryOnItemIds
      .map((id) => wardrobe.find((w) => w.id === id))
      .filter(Boolean) as ClothingItem[];
  }, [tryOnItemIds, wardrobe]);

  // Garments by classification
  const currentTop = selectedItems.find((i) => i.classification === 'Tops');
  const currentBottom = selectedItems.find((i) => i.classification === 'Bottoms');
  const currentFootwear = selectedItems.find((i) => i.classification === 'Footwear');
  const currentOuterwear = selectedItems.find((i) => i.classification === 'Outerwear');
  const currentAccessories = selectedItems.find((i) => i.classification === 'Accessories');

  // Available angles based on captured body photos
  const availableAngles = useMemo(() => {
    if (!bodyProfile) return ['front'] as BodyViewType[];
    return ANGLE_ORDER.filter((a) => bodyProfile.views[a]?.imageUrl) as BodyViewType[];
  }, [bodyProfile]);

  // Trigger virtual try-on generation
  const handleGenerateTryOn = async (overrideItems?: ClothingItem[], overrideAngle?: BodyViewType) => {
    const itemsToTry = overrideItems || selectedItems;
    const angleToTry = overrideAngle || activeAngle;

    if (!bodyProfile || !bodyProfile.views.front) {
      setIsBodyCaptureOpen(true);
      return;
    }

    if (itemsToTry.length === 0) {
      setGenerationError('Please select at least one clothing item to try on.');
      return;
    }

    // Clear cache to force fresh generation
    await StorageService.clearTryOnCache(bodyProfile.userId);

    setIsGenerating(true);
    setGenerationError(null);
    setSaveSuccessMessage(null);

    try {
      const result = await VirtualTryOnService.generateVirtualTryOn(
        {
          userBodyProfile: bodyProfile,
          selectedItems: itemsToTry,
          viewAngle: angleToTry,
          outfitTitle: 'Dressing Room Outfit',
          targetClassification: lastChangedClassification || undefined,
        },
        (progress) => {
          setGenerationProgress(progress);
        }
      );

      setTryOnResult(result);

      // Cache this composite for the angle
      if (result.generatedImageUrl) {
        setAngleComposites((prev) => ({
          ...prev,
          [angleToTry]: result.generatedImageUrl,
        }));
      }
    } catch (err: any) {
      console.warn('Virtual try-on failure handled:', err);
      setGenerationError(err?.message || 'Unable to generate the virtual try-on right now. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  // Handle switching view angle with crossfade
  const handleAngleChange = useCallback((angle: BodyViewType) => {
    if (angle === activeAngle) return;
    setActiveAngle(angle);
  }, [activeAngle]);

  // Swipe gesture handlers for 360 rotation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    setIsSwiping(false);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;

    // Only trigger swipe if horizontal movement is dominant
    if (Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      setIsSwiping(true);
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !isSwiping) {
      touchStartRef.current = null;
      return;
    }

    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    touchStartRef.current = null;

    if (Math.abs(dx) < 40) return; // Minimum swipe distance

    const currentIdx = ANGLE_ORDER.indexOf(activeAngle);
    if (currentIdx === -1) return;

    if (dx < 0) {
      // Swipe left -> rotate right (clockwise: front -> right -> back -> left)
      const nextIdx = (currentIdx + 1) % ANGLE_ORDER.length;
      const nextAngle = ANGLE_ORDER[nextIdx];
      if (availableAngles.includes(nextAngle)) {
        handleAngleChange(nextAngle);
      }
    } else {
      // Swipe right -> rotate left (counter-clockwise)
      const prevIdx = (currentIdx - 1 + ANGLE_ORDER.length) % ANGLE_ORDER.length;
      const prevAngle = ANGLE_ORDER[prevIdx];
      if (availableAngles.includes(prevAngle)) {
        handleAngleChange(prevAngle);
      }
    }

    setIsSwiping(false);
  }, [activeAngle, availableAngles, handleAngleChange, isSwiping]);

  // Mouse drag for desktop rotation
  const mouseStartRef = useRef<{ x: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseStartRef.current = { x: e.clientX };
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!mouseStartRef.current) return;

    const dx = e.clientX - mouseStartRef.current.x;
    mouseStartRef.current = null;

    if (Math.abs(dx) < 50) return;

    const currentIdx = ANGLE_ORDER.indexOf(activeAngle);
    if (currentIdx === -1) return;

    if (dx < 0) {
      const nextIdx = (currentIdx + 1) % ANGLE_ORDER.length;
      const nextAngle = ANGLE_ORDER[nextIdx];
      if (availableAngles.includes(nextAngle)) {
        handleAngleChange(nextAngle);
      }
    } else {
      const prevIdx = (currentIdx - 1 + ANGLE_ORDER.length) % ANGLE_ORDER.length;
      const prevAngle = ANGLE_ORDER[prevIdx];
      if (availableAngles.includes(prevAngle)) {
        handleAngleChange(prevAngle);
      }
    }
  }, [activeAngle, availableAngles, handleAngleChange]);

  // Swap / Select an item for a specific classification
  const handleSelectWardrobeItem = (item: ClothingItem) => {
    setTryOnItemIds((prev) => {
      const withoutSameClass = prev.filter((id) => {
        const existing = wardrobe.find((w) => w.id === id);
        return existing && existing.classification !== item.classification;
      });
      return [...withoutSameClass, item.id];
    });
    setLastChangedClassification(item.classification);
    setActiveCategoryDrawer(null);
    setTryOnResult(null);
    setAngleComposites({}); // Clear cached composites when outfit changes
  };

  const handleRemoveClassification = (classification: ClothingClassification) => {
    setTryOnItemIds((prev) =>
      prev.filter((id) => {
        const existing = wardrobe.find((w) => w.id === id);
        return existing && existing.classification !== classification;
      })
    );
    setTryOnResult(null);
    setAngleComposites({});
  };

  // Save current dressing room outfit to favorites
  const handleSaveOutfit = () => {
    if (selectedItems.length === 0) return;

    const topName = currentTop?.name || 'Tops';
    const bottomName = currentBottom?.name || 'Bottoms';
    const outfitName = `${topName} & ${bottomName} Ensemble`;

    saveOutfit({
      name: outfitName,
      categoryId: 'cat_casual',
      categoryName: 'Casual Wear',
      itemIds: selectedItems.map((i) => i.id),
      weatherScore: 95,
      stylingTips: tryOnResult?.tailoringAdvice || ['Balanced silhouette fit'],
      isFavorite: true,
    });

    setSaveSuccessMessage('Outfit saved to your Saved Collections!');
    setTimeout(() => setSaveSuccessMessage(null), 3000);
  };

  // Try Another Outfit: randomly picks a complete cohesive set from wardrobe
  const handleTryAnotherOutfit = () => {
    const tops = wardrobe.filter((i) => i.classification === 'Tops');
    const bottoms = wardrobe.filter((i) => i.classification === 'Bottoms');
    const shoes = wardrobe.filter((i) => i.classification === 'Footwear');
    const outerwear = wardrobe.filter((i) => i.classification === 'Outerwear');

    const newIds: string[] = [];
    if (tops.length > 0) newIds.push(tops[Math.floor(Math.random() * tops.length)].id);
    if (bottoms.length > 0) newIds.push(bottoms[Math.floor(Math.random() * bottoms.length)].id);
    if (shoes.length > 0) newIds.push(shoes[Math.floor(Math.random() * shoes.length)].id);
    if (outerwear.length > 0 && Math.random() > 0.4) {
      newIds.push(outerwear[Math.floor(Math.random() * outerwear.length)].id);
    }

    setTryOnItemIds(newIds);
    setTryOnResult(null);
    setAngleComposites({});
    const newItems = newIds.map((id) => wardrobe.find((w) => w.id === id)).filter(Boolean) as ClothingItem[];
    handleGenerateTryOn(newItems);
  };

  // Determine the photo to display: cached composite for active angle, or fallback
  const activePhotoUrl = useMemo(() => {
    // If we have a cached composite for the active angle, use it
    if (angleComposites[activeAngle]) {
      return angleComposites[activeAngle];
    }
    // If the current try-on result is for this angle, use it
    if (tryOnResult && tryOnResult.viewAngle === activeAngle && tryOnResult.generatedImageUrl) {
      return tryOnResult.generatedImageUrl;
    }
    // Fallback to the raw body photo
    return bodyProfile?.views[activeAngle]?.imageUrl || bodyProfile?.views.front?.imageUrl;
  }, [angleComposites, activeAngle, tryOnResult, bodyProfile]);

  const originalUserPhoto =
    bodyProfile?.views[activeAngle]?.imageUrl ||
    bodyProfile?.views.front?.imageUrl;

  return (
    <div id="virtual-dressing-room-root" className="space-y-4 pb-24" style={{ color: 'var(--md-on-surface)' }}>
      {/* Top Header & Navigation */}
      <div
        className="rounded-3xl p-4 md-elevation-1 flex items-center justify-between"
        style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
      >
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="p-1.5 rounded-xl transition-colors"
              style={{ color: 'var(--md-on-surface-variant)' }}
              title="Back"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h2 className="text-base font-bold flex items-center gap-1.5" style={{ color: 'var(--md-on-surface)' }}>
              <Sparkles className="w-4 h-4" style={{ color: 'var(--md-primary)' }} />
              <span>Virtual Dressing Room</span>
            </h2>
            <p className="text-[11px]" style={{ color: 'var(--md-on-surface-variant)' }}>
              360° multi-view body visualizer &bull; Swipe or drag to rotate
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsBodyCaptureOpen(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
          style={{
            backgroundColor: 'var(--md-secondary-container)',
            color: 'var(--md-on-secondary-container)',
          }}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>{bodyProfile ? 'Update Body Photos' : 'Setup Body Profile'}</span>
        </button>
      </div>

      {/* Main Dressing Stage & Studio Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Interactive Mirror Viewport */}
        <div className="lg:col-span-7 space-y-3">
          <div
            ref={stageRef}
            className="relative aspect-[3/4] max-h-[520px] w-full rounded-3xl overflow-hidden md-elevation-3 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
            style={{ backgroundColor: 'var(--md-surface-container)' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
          >
            {activePhotoUrl ? (
              <div className="relative w-full h-full">
                {/* Crossfade image layer */}
                <AnimatePresence mode="wait">
                  <motion.img
                    key={`${activeAngle}-${activePhotoUrl?.substring(0, 50)}`}
                    src={showOriginalComparison ? originalUserPhoto : activePhotoUrl}
                    alt={`Virtual Try-On - ${activeAngle} view`}
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                  />
                </AnimatePresence>

                {/* Perspective Angle Switcher Pill Bar */}
                <div className="absolute top-3 inset-x-3 flex items-center justify-between z-10">
                  <div className="flex items-center gap-1 p-1 rounded-full md-elevation-2" style={{ backgroundColor: 'var(--md-surface-container-highest)' }}>
                    {(['front', 'left', 'right', 'back'] as BodyViewType[]).map((angle) => {
                      const isSelected = activeAngle === angle;
                      const hasView = !!bodyProfile?.views[angle];

                      return (
                        <button
                          key={angle}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAngleChange(angle);
                          }}
                          className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all"
                          style={{
                            backgroundColor: isSelected ? 'var(--md-primary)' : 'transparent',
                            color: isSelected ? 'var(--md-on-primary)' : hasView ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)',
                          }}
                        >
                          <span>{angle}</span>
                          {!hasView && angle !== 'front' && (
                            <span className="ml-1 text-[8px] opacity-50">(none)</span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Before / After comparison toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOriginalComparison((prev) => !prev);
                    }}
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold transition-all flex items-center gap-1 md-elevation-2"
                    style={{
                      backgroundColor: showOriginalComparison ? 'var(--md-tertiary)' : 'var(--md-surface-container)',
                      color: showOriginalComparison ? 'var(--md-on-tertiary)' : 'var(--md-on-surface)',
                    }}
                  >
                    <Eye className="w-3 h-3" />
                    <span>{showOriginalComparison ? 'Original Body' : 'Compare Before'}</span>
                  </button>
                </div>

                {/* Rotation indicator dots */}
                <div className="absolute bottom-14 inset-x-0 flex items-center justify-center z-10 pointer-events-none">
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: 'var(--md-surface-container-highest)', opacity: 0.8 }}
                  >
                    {ANGLE_ORDER.map((angle) => {
                      const hasView = !!bodyProfile?.views[angle];
                      const isActive = activeAngle === angle;
                      return (
                        <div
                          key={angle}
                          className="rounded-full transition-all duration-300"
                          style={{
                            width: isActive ? 20 : 6,
                            height: 6,
                            backgroundColor: isActive ? 'var(--md-primary)' : hasView ? 'var(--md-on-surface)' : 'var(--md-on-surface-variant)',
                            opacity: isActive ? 1 : hasView ? 0.5 : 0.3,
                          }}
                          title={`${angle}${!hasView ? ' (no photo)' : ''}`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Swipe hint text */}
                {availableAngles.length > 1 && !isPreRendering && (
                  <div className="absolute bottom-6 inset-x-0 flex items-center justify-center z-10 pointer-events-none">
                    <span className="text-[10px] font-medium" style={{ color: 'var(--md-on-surface)' }}>
                      Swipe to rotate 360&deg;
                    </span>
                  </div>
                )}

                {/* Floating Worn Garment Tags on Stage */}
                {!showOriginalComparison && selectedItems.length > 0 && (
                  <div className="absolute bottom-3 inset-x-3 flex flex-wrap gap-1.5 pointer-events-none">
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 md-elevation-2"
                        style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                        <span>{item.classification}: {item.name}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Honest Technology Badge */}
                <div className="absolute bottom-20 right-3">
                  <div
                    className="px-2 py-0.5 rounded-md text-[9px]"
                    style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' }}
                  >
                    Multi-View Neural Draping
                  </div>
                </div>
              </div>
            ) : (
              /* No Body Photo Captured State */
              <div className="text-center p-6 space-y-3 max-w-sm">
                <div
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface)' }}
                >
                  <Camera className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>Setup Your Body Representation</h3>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>
                  Capture front, left, right, and back photographs to enable 360° virtual try-on rotation with your authentic body.
                </p>
                <button
                  onClick={() => setIsBodyCaptureOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 md-elevation-1 transition-all"
                  style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Start Body Capture</span>
                </button>
              </div>
            )}

            {/* Progressive Loading State Overlay */}
            <AnimatePresence>
              {isGenerating && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-4"
                  style={{ backgroundColor: 'var(--md-surface-container-highest)', opacity: 0.95 }}
                >
                  <motion.div
                    className="relative w-16 h-16 flex items-center justify-center"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  >
                    <div className="absolute inset-0 rounded-full border-4" style={{ borderColor: 'var(--md-outline-variant)', borderTopColor: 'var(--md-primary)' }}></div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Sparkles className="w-6 h-6" style={{ color: 'var(--md-primary)' }} />
                    </motion.div>
                  </motion.div>

                  <div className="space-y-1">
                    <h4 className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>
                      {generationProgress?.stage || 'Generating your virtual try-on...'}
                    </h4>
                    <p className="text-xs max-w-xs" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {generationProgress?.subtext || 'Compositing garments onto your body photograph...'}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-48 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--md-surface-container)' }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: 'var(--md-primary)' }}
                      initial={{ width: '0%' }}
                      animate={{ width: `${generationProgress?.percent || 30}%` }}
                      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Pre-rendering indicator for other angles */}
            {isPreRendering && !isGenerating && (
              <div className="absolute top-3 right-3 z-20">
                <div
                  className="px-2 py-1 rounded-lg text-[9px] flex items-center gap-1.5 md-elevation-1"
                  style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface-variant)' }}
                >
                  <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: 'var(--md-primary)' }}></div>
                  <span>Preparing rotation views...</span>
                </div>
              </div>
            )}
          </div>

          {/* Feedback & Notifications */}
          {generationError && (
            <div
              className="p-3.5 rounded-2xl text-xs flex items-center justify-between"
              style={{ backgroundColor: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{generationError}</span>
              </div>
              <button
                onClick={() => handleGenerateTryOn()}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors"
                style={{ backgroundColor: 'var(--md-error)', color: 'var(--md-on-error)' }}
              >
                Retry
              </button>
            </div>
          )}

          {saveSuccessMessage && (
            <div
              className="p-3 rounded-2xl text-xs font-bold flex items-center gap-2 md-elevation-1"
              style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{saveSuccessMessage}</span>
            </div>
          )}

          {/* Dedicated Action Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <motion.button
              id="btn-generate-tryon"
              onClick={() => handleGenerateTryOn()}
              disabled={isGenerating || selectedItems.length === 0}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 md-elevation-1 transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{tryOnResult ? 'Regenerate' : 'Generate'}</span>
            </motion.button>

            <motion.button
              id="btn-save-dressing-outfit"
              onClick={handleSaveOutfit}
              disabled={selectedItems.length === 0}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 md-elevation-1 transition-colors disabled:opacity-50"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            >
              <Heart className="w-3.5 h-3.5" style={{ color: 'var(--md-tertiary)' }} />
              <span>Save Outfit</span>
            </motion.button>

            <motion.button
              id="btn-try-another-outfit"
              onClick={handleTryAnotherOutfit}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 md-elevation-1 transition-colors"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            >
              <RotateCcw className="w-3.5 h-3.5" style={{ color: 'var(--md-primary)' }} />
              <span>Try Another</span>
            </motion.button>

            <motion.button
              id="btn-change-outfit-all"
              onClick={() => {
                const categories: ClothingClassification[] = ['Tops', 'Bottoms', 'Footwear', 'Outerwear', 'Accessories'];
                const currentIdx = activeCategoryDrawer ? categories.indexOf(activeCategoryDrawer) : -1;
                const nextIdx = (currentIdx + 1) % categories.length;
                setActiveCategoryDrawer(categories[nextIdx]);
              }}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className="py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 md-elevation-1 transition-colors"
              style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
            >
              <Layers className="w-3.5 h-3.5" style={{ color: 'var(--md-on-surface-variant)' }} />
              <span>Change Outfit</span>
            </motion.button>
          </div>
        </div>

        {/* Right Side: Clothing Selectors & Fit Analysis */}
        <div className="lg:col-span-5 space-y-4">
          {/* Clothing Selectors */}
          <div className="rounded-3xl p-4 md-elevation-1 space-y-3" style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}>
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--md-on-surface)' }}>
                <Shirt className="w-3.5 h-3.5" style={{ color: 'var(--md-primary)' }} />
                <span>Outfit Garment Selectors</span>
              </span>
              <span className="text-[11px]" style={{ color: 'var(--md-on-surface-variant)' }}>{selectedItems.length} items loaded</span>
            </div>

            {/* TOP Selector */}
            <div
              className="flex items-center justify-between p-2.5 rounded-2xl transition-colors"
              style={{ backgroundColor: 'var(--md-surface-container)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentTop ? (
                  <img
                    src={currentTop.imageUrl}
                    alt={currentTop.name}
                    className="w-10 h-10 rounded-xl object-cover border"
                    style={{ borderColor: 'var(--md-outline-variant)' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}
                  >
                    <Shirt className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--md-primary)' }}>TOP</span>
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--md-on-surface)' }}>
                    {currentTop ? currentTop.name : 'No top selected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentTop && (
                  <button
                    onClick={() => handleRemoveClassification('Tops')}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                    title="Remove top"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActiveCategoryDrawer('Tops')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all md-elevation-1"
                  style={{
                    backgroundColor: 'var(--md-surface-container-lowest)',
                    color: 'var(--md-on-surface)',
                  }}
                >
                  {currentTop ? 'Change' : '+ Select'}
                </button>
              </div>
            </div>

            {/* BOTTOM Selector */}
            <div
              className="flex items-center justify-between p-2.5 rounded-2xl transition-colors"
              style={{ backgroundColor: 'var(--md-surface-container)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentBottom ? (
                  <img
                    src={currentBottom.imageUrl}
                    alt={currentBottom.name}
                    className="w-10 h-10 rounded-xl object-cover border"
                    style={{ borderColor: 'var(--md-outline-variant)' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}
                  >
                    <Layers className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--md-primary)' }}>BOTTOM</span>
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--md-on-surface)' }}>
                    {currentBottom ? currentBottom.name : 'No bottom selected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentBottom && (
                  <button
                    onClick={() => handleRemoveClassification('Bottoms')}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                    title="Remove bottom"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActiveCategoryDrawer('Bottoms')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all md-elevation-1"
                  style={{
                    backgroundColor: 'var(--md-surface-container-lowest)',
                    color: 'var(--md-on-surface)',
                  }}
                >
                  {currentBottom ? 'Change' : '+ Select'}
                </button>
              </div>
            </div>

            {/* FOOTWEAR Selector */}
            <div
              className="flex items-center justify-between p-2.5 rounded-2xl transition-colors"
              style={{ backgroundColor: 'var(--md-surface-container)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentFootwear ? (
                  <img
                    src={currentFootwear.imageUrl}
                    alt={currentFootwear.name}
                    className="w-10 h-10 rounded-xl object-cover border"
                    style={{ borderColor: 'var(--md-outline-variant)' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}
                  >
                    <Compass className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--md-primary)' }}>FOOTWEAR</span>
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--md-on-surface)' }}>
                    {currentFootwear ? currentFootwear.name : 'No footwear selected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentFootwear && (
                  <button
                    onClick={() => handleRemoveClassification('Footwear')}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                    title="Remove footwear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActiveCategoryDrawer('Footwear')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all md-elevation-1"
                  style={{
                    backgroundColor: 'var(--md-surface-container-lowest)',
                    color: 'var(--md-on-surface)',
                  }}
                >
                  {currentFootwear ? 'Change' : '+ Select'}
                </button>
              </div>
            </div>

            {/* OUTERWEAR Selector */}
            <div
              className="flex items-center justify-between p-2.5 rounded-2xl transition-colors"
              style={{ backgroundColor: 'var(--md-surface-container)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentOuterwear ? (
                  <img
                    src={currentOuterwear.imageUrl}
                    alt={currentOuterwear.name}
                    className="w-10 h-10 rounded-xl object-cover border"
                    style={{ borderColor: 'var(--md-outline-variant)' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}
                  >
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--md-primary)' }}>OUTERWEAR</span>
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--md-on-surface)' }}>
                    {currentOuterwear ? currentOuterwear.name : 'No outer layer'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentOuterwear && (
                  <button
                    onClick={() => handleRemoveClassification('Outerwear')}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                    title="Remove outerwear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActiveCategoryDrawer('Outerwear')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all md-elevation-1"
                  style={{
                    backgroundColor: 'var(--md-surface-container-lowest)',
                    color: 'var(--md-on-surface)',
                  }}
                >
                  {currentOuterwear ? 'Change' : '+ Select'}
                </button>
              </div>
            </div>

            {/* ACCESSORIES Selector */}
            <div
              className="flex items-center justify-between p-2.5 rounded-2xl transition-colors"
              style={{ backgroundColor: 'var(--md-surface-container)' }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {currentAccessories ? (
                  <img
                    src={currentAccessories.imageUrl}
                    alt={currentAccessories.name}
                    className="w-10 h-10 rounded-xl object-cover border"
                    style={{ borderColor: 'var(--md-outline-variant)' }}
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface-variant)' }}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}
                <div className="min-w-0">
                  <span className="text-[10px] font-bold uppercase" style={{ color: 'var(--md-primary)' }}>ACCESSORIES</span>
                  <p className="text-xs font-bold truncate" style={{ color: 'var(--md-on-surface)' }}>
                    {currentAccessories ? currentAccessories.name : 'No accessories selected'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {currentAccessories && (
                  <button
                    onClick={() => handleRemoveClassification('Accessories')}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: 'var(--md-on-surface-variant)' }}
                    title="Remove accessories"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setActiveCategoryDrawer('Accessories')}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all md-elevation-1"
                  style={{
                    backgroundColor: 'var(--md-surface-container-lowest)',
                    color: 'var(--md-on-surface)',
                  }}
                >
                  {currentAccessories ? 'Change' : '+ Select'}
                </button>
              </div>
            </div>
          </div>

          {/* Silhouette & Fit Analysis Panel */}
          {tryOnResult && (
            <div className="rounded-3xl p-4 md-elevation-1 space-y-3" style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}>
              <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--md-on-surface)' }}>
                  <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--md-primary)' }} />
                  <span>Anatomical Fit & Drape Feedback</span>
                </span>
                <span
                  className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
                >
                  Score: {tryOnResult.fitScore}%
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold block mb-0.5" style={{ color: 'var(--md-on-surface)' }}>Silhouette Drapery:</span>
                  <p style={{ color: 'var(--md-on-surface-variant)' }}>{tryOnResult.silhouetteAnalysis}</p>
                </div>

                <div>
                  <span className="font-bold block mb-0.5" style={{ color: 'var(--md-on-surface)' }}>Proportions Balance:</span>
                  <p style={{ color: 'var(--md-on-surface-variant)' }}>{tryOnResult.proportionsFeedback}</p>
                </div>

                {tryOnResult.tailoringAdvice && tryOnResult.tailoringAdvice.length > 0 && (
                  <div className="pt-2 border-t" style={{ borderColor: 'var(--md-outline-variant)' }}>
                    <span className="font-bold block mb-1" style={{ color: 'var(--md-on-surface)' }}>Tailoring & Styling Tips:</span>
                    <ul className="space-y-1 list-disc list-inside" style={{ color: 'var(--md-on-surface-variant)' }}>
                      {tryOnResult.tailoringAdvice.map((tip, idx) => (
                        <li key={idx} className="leading-snug">
                          <span style={{ color: 'var(--md-on-surface)' }}>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wardrobe Item Selection Drawer Modal */}
      {shouldRenderDrawer && (
        <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm ${isDrawerExiting ? 'animate-md-fade-out' : 'animate-in fade-in duration-150'}`} style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <div
            className={`rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden md-elevation-5 ${isDrawerExiting ? 'animate-md-exit' : 'animate-md-sheet'}`}
            style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
          >
            <div className="p-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--md-outline-variant)' }}>
              <h3 className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>
                Select {activeCategoryDrawer} from Wardrobe
              </h3>
              <button
                onClick={() => setActiveCategoryDrawer(null)}
                className="p-1 rounded-full transition-colors"
                style={{ color: 'var(--md-on-surface-variant)' }}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 no-scrollbar">
              {wardrobe
                .filter((item) => item.classification === activeCategoryDrawer)
                .map((item) => {
                  const isCurrentlySelected = selectedItems.some((s) => s.id === item.id);

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleSelectWardrobeItem(item)}
                      className="p-2.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col space-y-2"
                      style={{
                        backgroundColor: isCurrentlySelected ? 'var(--md-primary-container)' : 'var(--md-surface-container)',
                        borderColor: isCurrentlySelected ? 'var(--md-primary)' : 'var(--md-outline-variant)',
                      }}
                    >
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full aspect-square object-cover rounded-xl border"
                        style={{ borderColor: 'var(--md-outline-variant)' }}
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase truncate block" style={{ color: 'var(--md-primary)' }}>
                          {item.subType}
                        </span>
                        <h4 className="text-xs font-bold truncate" style={{ color: 'var(--md-on-surface)' }}>{item.name}</h4>
                        <span className="text-[10px]" style={{ color: 'var(--md-on-surface-variant)' }}>{item.colorName}</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Body Capture Setup Flow Modal */}
      <BodyCaptureWizard
        isOpen={isBodyCaptureOpen}
        onClose={() => setIsBodyCaptureOpen(false)}
        userId={userProfile.id}
        initialProfile={bodyProfile}
        onProfileSaved={(newProfile) => {
          setBodyProfile(newProfile);
          setIsBodyCaptureOpen(false);
          setAngleComposites({}); // Clear cached composites since body photos changed
        }}
      />
    </div>
  );
};
