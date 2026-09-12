import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  X,
  Sparkles,
  Info,
  ChevronRight,
  ArrowLeft,
  Sun,
  Eye,
  Trash2,
} from 'lucide-react';
import { BodyViewType, BodyViewImage, UserBodyProfile, ImageQualityValidationResult } from '../../types';
import { ImageProcessingService } from '../../services/ImageProcessingService';
import { StorageService } from '../../services/StorageService';
import { useDelayedRender } from '../../hooks/useDelayedRender';
import { correctImageOrientation } from '../../utils/canvasHelpers';

interface BodyCaptureWizardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialProfile: UserBodyProfile | null;
  onProfileSaved: (profile: UserBodyProfile) => void;
  analyzeBodyPhoto?: (photoDataUrl: string) => Promise<any>;
}

export const BodyCaptureWizard: React.FC<BodyCaptureWizardProps> = ({
  isOpen,
  onClose,
  userId,
  initialProfile,
  onProfileSaved,
  analyzeBodyPhoto,
}) => {
  const [currentStepView, setCurrentStepView] = useState<BodyViewType>('front');
  const [capturedViews, setCapturedViews] = useState<{
    front?: BodyViewImage;
    left?: BodyViewImage;
    right?: BodyViewImage;
    back?: BodyViewImage;
  }>(initialProfile?.views || {});

  // Camera & Video elements
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentValidation, setCurrentValidation] = useState<ImageQualityValidationResult | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera when modal closes
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1080 },
          height: { ideal: 1920 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera access not granted or unavailable. You can upload photographs directly.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const capturePhotoFromVideo = async () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 1280;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCamera();
    await processCapturedData(dataUrl);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const correctedUrl = await correctImageOrientation(file);
      await processCapturedData(correctedUrl);
    } catch (err) {
      console.error('Orientation correction failed:', err);
      const reader = new FileReader();
      reader.onload = async (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          await processCapturedData(dataUrl);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const processCapturedData = async (rawUrl: string) => {
    setIsAnalyzing(true);
    setCurrentValidation(null);
    try {
      // 1. Image Quality Validation
      const validation = await ImageProcessingService.validateImage(rawUrl, currentStepView);
      setCurrentValidation(validation);

      // 2. Preprocess & Normalize image
      const processedUrl = await ImageProcessingService.preprocessImage(rawUrl, 1080);

      // Save into state
      const viewImage: BodyViewImage = {
        viewType: currentStepView,
        imageUrl: processedUrl,
        validation,
        capturedAt: new Date().toISOString(),
      };

      setCapturedViews((prev) => ({
        ...prev,
        [currentStepView]: viewImage,
      }));
    } catch (err) {
      console.error('Image processing error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetakeCurrent = () => {
    setCapturedViews((prev) => {
      const next = { ...prev };
      delete next[currentStepView];
      return next;
    });
    setCurrentValidation(null);
    startCamera();
  };

  const handleSaveProfile = async () => {
    const profile: UserBodyProfile = {
      id: initialProfile?.id || `body_profile_${Date.now()}`,
      userId,
      views: capturedViews,
      bodyMetrics: {
        heightCm: 172,
        generalProportions: 'Authentic user silhouette',
        detectedAspect: capturedViews.front?.validation.aspectRatio || 1.45,
      },
      status: capturedViews.front ? 'ready' : 'incomplete',
      createdAt: initialProfile?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // If front photo changed (first capture or update), trigger AI body analysis
    const isFrontPhotoChanged = capturedViews.front &&
      capturedViews.front.imageUrl !== initialProfile?.views?.front?.imageUrl;
    if (isFrontPhotoChanged && analyzeBodyPhoto) {
      analyzeBodyPhoto(capturedViews.front!.imageUrl);
    }

    await StorageService.saveBodyProfile(profile);
    onProfileSaved(profile);
    stopCamera();
    onClose();
  };

  const [shouldRender, isExiting] = useDelayedRender(isOpen);

  if (!shouldRender) return null;

  const viewsList: { id: BodyViewType; label: string; desc: string; required: boolean }[] = [
    { id: 'front', label: 'Front View', desc: 'Face camera upright, arms slightly away', required: true },
    { id: 'left', label: 'Left Side (90°)', desc: 'Turn 90° left to capture side posture', required: false },
    { id: 'right', label: 'Right Side (90°)', desc: 'Turn 90° right for balanced side profile', required: false },
    { id: 'back', label: 'Back View (180°)', desc: 'Turn back for outerwear & seam fit', required: false },
  ];

  const currentViewData = capturedViews[currentStepView];
  const hasFrontView = !!capturedViews.front;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar backdrop-blur-sm ${isExiting ? 'animate-md-fade-out' : 'animate-in fade-in duration-150'}`} style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <div
        className={`rounded-3xl w-full max-w-xl overflow-hidden md-elevation-5 flex flex-col max-h-[92vh] ${isExiting ? 'animate-md-exit' : 'animate-md-sheet'}`}
        style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 flex items-center justify-between border-b"
          style={{ backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center md-elevation-1"
              style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
            >
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>Virtual Try-On Body Capture</h3>
              <p className="text-[11px]" style={{ color: 'var(--md-on-surface-variant)' }}>Create your private, authentic body representation</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full transition-colors"
            style={{ color: 'var(--md-on-surface-variant)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Angle Step Selector */}
        <div
          className="px-4 py-2.5 flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar border-b"
          style={{ backgroundColor: 'var(--md-surface-container-lowest)', borderColor: 'var(--md-outline-variant)' }}
        >
          {viewsList.map((step) => {
            const isFilled = !!capturedViews[step.id];
            const isCurrent = currentStepView === step.id;

            return (
              <button
                key={step.id}
                onClick={() => {
                  stopCamera();
                  setCurrentStepView(step.id);
                  setCurrentValidation(null);
                }}
                className="flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                style={{
                  backgroundColor: isCurrent
                    ? 'var(--md-primary)'
                    : isFilled
                    ? 'var(--md-primary-container)'
                    : 'var(--md-surface-container)',
                  color: isCurrent
                    ? 'var(--md-on-primary)'
                    : isFilled
                    ? 'var(--md-on-primary-container)'
                    : 'var(--md-on-surface-variant)',
                }}
              >
                {isFilled && <CheckCircle2 className="w-3 h-3" />}
                <span className="truncate">{step.label}</span>
                {step.required && !isFilled && <span className="text-[10px]" style={{ color: 'var(--md-error)' }}>*</span>}
              </button>
            );
          })}
        </div>

        {/* Main Stage Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Active View Title & Guidance */}
          <div
            className="rounded-2xl p-3.5 md-elevation-1"
            style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--md-on-surface)' }}>
                {viewsList.find((v) => v.id === currentStepView)?.label}
              </span>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: 'var(--md-secondary-container)', color: 'var(--md-on-secondary-container)' }}
              >
                {viewsList.find((v) => v.id === currentStepView)?.required ? 'Required Angle' : 'Optional Multi-Angle'}
              </span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>
              {viewsList.find((v) => v.id === currentStepView)?.desc}
            </p>
          </div>

          {/* Camera Stage or Photo Preview */}
          <div
            className="relative aspect-[3/4] max-h-[380px] w-full mx-auto rounded-2xl overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: 'var(--md-surface-container)' }}
          >
            {isCameraActive ? (
              <div className="relative w-full h-full">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {/* On-Screen Camera Silhouette & Pose Guide Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-between p-4">
                  {/* Top Guide Notice */}
                  <div
                    className="px-3 py-1.5 rounded-full text-[11px] font-semibold flex items-center gap-1.5 md-elevation-2"
                    style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                  >
                    <Sun className="w-3.5 h-3.5" style={{ color: 'var(--md-tertiary)' }} />
                    <span>Face light source • Plain background recommended</span>
                  </div>

                  {/* Body Silhouette Outline Overlay */}
                  <div
                    className="w-48 h-72 border-2 border-dashed rounded-full flex flex-col items-center justify-center relative"
                    style={{ borderColor: 'var(--md-primary)', opacity: 0.6 }}
                  >
                    <div className="w-16 h-16 rounded-full border" style={{ borderColor: 'var(--md-primary)', opacity: 0.5 }}></div>
                    <div className="w-28 h-36 border rounded-3xl" style={{ borderColor: 'var(--md-primary)', opacity: 0.5 }}></div>
                    <span
                      className="text-[10px] font-bold mt-2 px-2 py-0.5 rounded-md"
                      style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                    >
                      Align Full Body Here
                    </span>
                  </div>

                  {/* Bottom Snap Button */}
                  <div className="pointer-events-auto flex items-center gap-4">
                    <button
                      onClick={stopCamera}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold md-elevation-2"
                      style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={capturePhotoFromVideo}
                      className="w-14 h-14 rounded-full flex items-center justify-center md-elevation-3 active:scale-95 transition-transform"
                      style={{ backgroundColor: 'var(--md-surface-container-lowest)', color: 'var(--md-on-surface)' }}
                    >
                      <div className="w-10 h-10 rounded-full" style={{ backgroundColor: 'var(--md-primary)' }}></div>
                    </button>
                  </div>
                </div>
              </div>
            ) : currentViewData ? (
              /* Already Captured View Preview */
              <div className="relative w-full h-full">
                <img
                  src={currentViewData.imageUrl}
                  alt={currentStepView}
                  className="w-full h-full object-contain"
                />

                {/* Validation Badge */}
                <div className="absolute top-3 left-3">
                  {currentViewData.validation.isValid ? (
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 md-elevation-1"
                      style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Quality Validated</span>
                    </span>
                  ) : (
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1 md-elevation-1"
                      style={{ backgroundColor: 'var(--md-error-container)', color: 'var(--md-on-error-container)' }}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Review Quality</span>
                    </span>
                  )}
                </div>

                {/* Retake & Remove Overlay Actions */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                  <button
                    onClick={handleRetakeCurrent}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold md-elevation-2 flex items-center gap-1"
                    style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Photo</span>
                  </button>

                  <button
                    onClick={() => {
                      setCapturedViews((prev) => {
                        const next = { ...prev };
                        delete next[currentStepView];
                        return next;
                      });
                      setCurrentValidation(null);
                    }}
                    className="p-2 rounded-xl md-elevation-2 transition-all"
                    style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-error)' }}
                    title="Delete this view"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Empty View Capture Trigger */
              <div className="text-center p-6 space-y-4">
                <div
                  className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: 'var(--md-surface-container-highest)', color: 'var(--md-on-surface)' }}
                >
                  <Camera className="w-8 h-8" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-sm" style={{ color: 'var(--md-on-surface)' }}>Capture {viewsList.find((v) => v.id === currentStepView)?.label}</p>
                  <p className="text-[11px]" style={{ color: 'var(--md-on-surface-variant)' }}>Use on-screen camera or upload from files</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    onClick={startCamera}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 md-elevation-1 transition-all"
                    style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Camera</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 md-elevation-1 transition-all"
                    style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                </div>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          {/* Quality Analysis Feedback Banner */}
          {currentValidation && (
            <div
              className="p-3.5 rounded-2xl transition-all"
              style={{
                backgroundColor: currentValidation.isValid ? 'var(--md-primary-container)' : 'var(--md-error-container)',
                color: currentValidation.isValid ? 'var(--md-on-primary-container)' : 'var(--md-on-error-container)',
              }}
            >
              <div className="flex items-start gap-2">
                {currentValidation.isValid ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-xs">
                  <p className="font-bold">{currentValidation.feedbackMessage}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t text-[10px]" style={{ borderColor: 'currentColor', opacity: 0.2 }}>
                    <div>
                      <span className="block" style={{ opacity: 0.7 }}>Lighting</span>
                      <span className="font-bold">{currentValidation.brightnessScore}% (Good)</span>
                    </div>
                    <div>
                      <span className="block" style={{ opacity: 0.7 }}>Sharpness</span>
                      <span className="font-bold">{currentValidation.blurScore}%</span>
                    </div>
                    <div>
                      <span className="block" style={{ opacity: 0.7 }}>Framing</span>
                      <span className="font-bold">{currentValidation.aspectRatio >= 1.0 ? 'Full-Body' : 'Landscape'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Authentic Body Guarantee */}
          <div className="p-3.5 rounded-2xl md-elevation-1 space-y-1.5" style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}>
            <div className="flex items-center gap-1.5 text-xs font-bold" style={{ color: 'var(--md-on-surface)' }}>
              <ShieldCheck className="w-4 h-4" style={{ color: 'var(--md-tertiary)' }} />
              <span>Strict Privacy & Authentic Body Guarantee</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--md-on-surface-variant)' }}>
              Your photographs are stored securely on your personal account. They are strictly used to visualize clothing on your natural physique and are never used to train public AI models. You can permanently delete your body profile at any time.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="p-4 flex items-center justify-between gap-3 border-t"
          style={{ backgroundColor: 'var(--md-surface-container)', borderColor: 'var(--md-outline-variant)' }}
        >
          <div className="text-[11px]">
            {hasFrontView ? (
              <span className="font-bold flex items-center gap-1" style={{ color: 'var(--md-tertiary)' }}>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for Virtual Try-On</span>
              </span>
            ) : (
              <span className="font-medium" style={{ color: 'var(--md-error)' }}>Front view required to proceed</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold md-elevation-1 transition-all"
              style={{
                backgroundColor: 'var(--md-surface-container-lowest)',
                color: 'var(--md-on-surface)',
              }}
            >
              Cancel
            </button>

            <button
              disabled={!hasFrontView || isAnalyzing}
              onClick={handleSaveProfile}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
              style={{
                backgroundColor: hasFrontView && !isAnalyzing ? 'var(--md-primary)' : 'var(--md-surface-container-highest)',
                color: hasFrontView && !isAnalyzing ? 'var(--md-on-primary)' : 'var(--md-on-surface-variant)',
                opacity: hasFrontView && !isAnalyzing ? 1 : 0.6,
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Save & Open Dressing Room</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
