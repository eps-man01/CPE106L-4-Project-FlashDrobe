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

interface BodyCaptureWizardProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialProfile: UserBodyProfile | null;
  onProfileSaved: (profile: UserBodyProfile) => void;
}

export const BodyCaptureWizard: React.FC<BodyCaptureWizardProps> = ({
  isOpen,
  onClose,
  userId,
  initialProfile,
  onProfileSaved,
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

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await processCapturedData(dataUrl);
      }
    };
    reader.readAsDataURL(file);
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

  const handleSaveProfile = () => {
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

    StorageService.saveBodyProfile(profile);
    onProfileSaved(profile);
    stopCamera();
    onClose();
  };

  if (!isOpen) return null;

  const viewsList: { id: BodyViewType; label: string; desc: string; required: boolean }[] = [
    { id: 'front', label: 'Front View', desc: 'Face camera upright, arms slightly away', required: true },
    { id: 'left', label: 'Left Side (90°)', desc: 'Turn 90° left to capture side posture', required: false },
    { id: 'right', label: 'Right Side (90°)', desc: 'Turn 90° right for balanced side profile', required: false },
    { id: 'back', label: 'Back View (180°)', desc: 'Turn back for outerwear & seam fit', required: false },
  ];

  const currentViewData = capturedViews[currentStepView];
  const hasFrontView = !!capturedViews.front;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-scrollbar">
      <div className="bg-[#f9f6f0] border border-[#e7e2d9] rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-white border-b border-[#e7e2d9] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-[#8c5836] text-white flex items-center justify-center shadow-xs">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900">Virtual Try-On Body Capture</h3>
              <p className="text-[11px] text-stone-500">Create your private, authentic body representation</p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Angle Step Selector */}
        <div className="px-4 py-2.5 bg-white/70 border-b border-[#e7e2d9] flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
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
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1 border ${
                  isCurrent
                    ? 'bg-[#8c5836] text-white border-[#8c5836] shadow-xs'
                    : isFilled
                    ? 'bg-[#eef3e8] text-[#4d663b] border-[#c5d8ba]'
                    : 'bg-stone-50 text-stone-600 border-[#e7e2d9] hover:bg-stone-100'
                }`}
              >
                {isFilled && <CheckCircle2 className="w-3 h-3 text-[#4d663b]" />}
                <span className="truncate">{step.label}</span>
                {step.required && !isFilled && <span className="text-[10px] text-amber-600">*</span>}
              </button>
            );
          })}
        </div>

        {/* Main Stage Viewport */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
          {/* Active View Title & Guidance */}
          <div className="bg-white rounded-2xl p-3.5 border border-[#e7e2d9] shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-extrabold text-stone-900 uppercase tracking-wider">
                {viewsList.find((v) => v.id === currentStepView)?.label}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#f5ede3] text-[#8c5836] border border-[#ddcfbe]">
                {viewsList.find((v) => v.id === currentStepView)?.required ? 'Required Angle' : 'Optional Multi-Angle'}
              </span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              {viewsList.find((v) => v.id === currentStepView)?.desc}
            </p>
          </div>

          {/* Camera Stage or Photo Preview */}
          <div className="relative aspect-[3/4] max-h-[380px] w-full mx-auto bg-stone-900 rounded-2xl overflow-hidden border border-stone-300 shadow-inner flex items-center justify-center">
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
                  <div className="bg-black/65 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[11px] font-semibold flex items-center space-x-1.5 border border-white/20">
                    <Sun className="w-3.5 h-3.5 text-amber-300" />
                    <span>Face light source • Plain background recommended</span>
                  </div>

                  {/* Body Silhouette Outline Overlay */}
                  <div className="w-48 h-72 border-2 border-dashed border-amber-300/70 rounded-full flex flex-col items-center justify-center relative shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                    <div className="w-16 h-16 rounded-full border border-amber-300/60 mb-2"></div>
                    <div className="w-28 h-36 border border-amber-300/60 rounded-3xl"></div>
                    <span className="text-[10px] text-amber-200 font-bold mt-2 bg-black/60 px-2 py-0.5 rounded-md">
                      Align Full Body Here
                    </span>
                  </div>

                  {/* Bottom Snap Button */}
                  <div className="pointer-events-auto flex items-center space-x-4">
                    <button
                      onClick={stopCamera}
                      className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white text-stone-800 text-xs font-bold shadow-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={capturePhotoFromVideo}
                      className="w-14 h-14 rounded-full bg-white text-stone-900 border-4 border-amber-400 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                      <div className="w-10 h-10 rounded-full bg-red-600"></div>
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
                  className="w-full h-full object-cover"
                />

                {/* Validation Badge */}
                <div className="absolute top-3 left-3">
                  {currentViewData.validation.isValid ? (
                    <span className="px-2.5 py-1 rounded-full bg-[#eef3e8] text-[#4d663b] text-[11px] font-bold border border-[#c5d8ba] shadow-xs flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Quality Validated</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-bold border border-amber-200 shadow-xs flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Review Quality</span>
                    </span>
                  )}
                </div>

                {/* Retake & Remove Overlay Actions */}
                <div className="absolute bottom-3 inset-x-3 flex items-center justify-between">
                  <button
                    onClick={handleRetakeCurrent}
                    className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-stone-800 text-xs font-bold shadow-md hover:bg-white transition-all flex items-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-stone-600" />
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
                    className="p-2 rounded-xl bg-white/90 backdrop-blur-md text-rose-600 hover:bg-rose-50 text-xs font-bold shadow-md transition-all"
                    title="Delete this view"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* Empty View Capture Trigger */
              <div className="text-center p-6 space-y-4">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-white/10 text-stone-200 flex items-center justify-center border border-white/20">
                  <Camera className="w-8 h-8" />
                </div>
                <div className="text-stone-300 text-xs space-y-1">
                  <p className="font-bold text-white text-sm">Capture {viewsList.find((v) => v.id === currentStepView)?.label}</p>
                  <p className="text-[11px] text-stone-400">Use on-screen camera or upload from files</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                  <button
                    onClick={startCamera}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#8c5836] hover:bg-[#784a2c] text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md transition-all"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Open Camera</span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold flex items-center justify-center space-x-1.5 border border-white/30 shadow-md transition-all"
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
              className={`p-3.5 rounded-2xl border transition-all ${
                currentValidation.isValid
                  ? 'bg-[#eef3e8] border-[#c5d8ba] text-[#4d663b]'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start space-x-2">
                {currentValidation.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-[#4d663b] flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 text-xs">
                  <p className="font-bold">{currentValidation.feedbackMessage}</p>
                  <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-black/10 text-[10px]">
                    <div>
                      <span className="text-stone-500 block">Lighting</span>
                      <span className="font-bold text-stone-800">{currentValidation.brightnessScore}% (Good)</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Sharpness</span>
                      <span className="font-bold text-stone-800">{currentValidation.blurScore}%</span>
                    </div>
                    <div>
                      <span className="text-stone-500 block">Framing</span>
                      <span className="font-bold text-stone-800">{currentValidation.aspectRatio >= 1.0 ? 'Full-Body' : 'Landscape'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Privacy & Authentic Body Guarantee */}
          <div className="p-3.5 rounded-2xl bg-white border border-[#e7e2d9] space-y-1.5">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-800">
              <ShieldCheck className="w-4 h-4 text-[#4d663b]" />
              <span>Strict Privacy & Authentic Body Guarantee</span>
            </div>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Your photographs are stored securely on your personal account. They are strictly used to visualize clothing on your natural physique and are never used to train public AI models. You can permanently delete your body profile at any time.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-[#e7e2d9] flex items-center justify-between gap-3">
          <div className="text-[11px] text-stone-500">
            {hasFrontView ? (
              <span className="text-[#4d663b] font-bold flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Ready for Virtual Try-On</span>
              </span>
            ) : (
              <span className="text-amber-700 font-medium">Front view required to proceed</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 border border-[#e7e2d9] transition-all"
            >
              Cancel
            </button>

            <button
              disabled={!hasFrontView || isAnalyzing}
              onClick={handleSaveProfile}
              className={`px-4 py-2 rounded-xl text-xs font-bold text-white transition-all flex items-center space-x-1.5 shadow-md ${
                hasFrontView && !isAnalyzing
                  ? 'bg-[#8c5836] hover:bg-[#784a2c]'
                  : 'bg-stone-300 cursor-not-allowed text-stone-500'
              }`}
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
