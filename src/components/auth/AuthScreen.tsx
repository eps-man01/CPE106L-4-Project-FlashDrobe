import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Mail,
  Lock,
  User,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Shirt,
  Camera,
  Upload,
  RotateCcw,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { BiologicalSex, BodyTypeInfo } from '../../types';
import { getBodyTypesForSex } from '../../data/bodyTypes';
import { BodySilhouetteSvg } from './BodySilhouetteSvg';

export const AuthScreen: React.FC = () => {
  const { login, signup } = useWardrobe();

  // Mode: 'login' or 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  // Sign up multi-step state: 1 = Account, 2 = Sex, 3 = Body Type, 4 = Try-On Photo
  const [signupStep, setSignupStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [sex, setSex] = useState<BiologicalSex>('male');
  const [selectedBodyType, setSelectedBodyType] = useState<BodyTypeInfo>(() => {
    return getBodyTypesForSex('male')[3]; // Default type 04
  });

  // Try-On Photo states for Step 4
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileUploadRef = useRef<HTMLInputElement | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (targetFacing: 'user' | 'environment' = facingMode) => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: targetFacing,
          width: { ideal: 720 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(console.warn);
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Camera access unavailable or declined. You can upload a photo or proceed with the silhouette.');
      setIsCameraActive(false);
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);
    if (isCameraActive) {
      startCamera(nextFacing);
    }
  };

  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current || document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setUserPhoto(dataUrl);
    stopCamera();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setUserPhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // When sex toggles, update available body types and reset selection
  const handleSexSelect = (newSex: BiologicalSex) => {
    setSex(newSex);
    const types = getBodyTypesForSex(newSex);
    setSelectedBodyType(types[3]);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    const res = login(email, password);
    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const handleDemoLogin = () => {
    setErrorMessage(null);
    login('sungajosh777@gmail.com', 'password123');
  };

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (password.length < 4) {
      setErrorMessage('Please create a password of at least 4 characters.');
      return;
    }
    setSignupStep(2);
  };

  const handleCompleteSignup = () => {
    setErrorMessage(null);
    stopCamera();
    if (!selectedBodyType) {
      setErrorMessage('Please select a body type similar to yours.');
      return;
    }

    const res = signup({
      name,
      email,
      password,
      sex,
      bodyType: selectedBodyType,
      uploadedTryOnPhoto: userPhoto || undefined,
    });

    if (!res.success && res.error) {
      setErrorMessage(res.error);
    }
  };

  const availableBodyTypes = getBodyTypesForSex(sex);

  return (
    <div className="w-full max-w-lg mx-auto min-h-screen bg-[#f9f6f0] text-stone-900 flex flex-col justify-center px-4 py-8 sm:px-6">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-900 text-amber-100 shadow-md mb-3">
          <Shirt className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 font-serif">
          Flashdrobe
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 mt-1 max-w-xs mx-auto">
          Digital Wardrobe Management & Smart Silhouette AI Stylist
        </p>
      </div>

      {/* Main Auth Container */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-sm p-5 sm:p-7">
        {/* Toggle Mode Tabs */}
        <div className="flex bg-stone-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            id="auth-tab-login"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            id="auth-tab-signup"
            onClick={() => {
              setMode('signup');
              setSignupStep(1);
              setErrorMessage(null);
            }}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-white text-stone-900 shadow-xs font-semibold'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  id="login-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              id="login-submit-button"
              className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-amber-50 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              <span>Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Demo user quick sign-in */}
            <div className="pt-3 border-t border-stone-100 text-center">
              <button
                type="button"
                id="demo-login-button"
                onClick={handleDemoLogin}
                className="text-xs text-amber-800 hover:text-amber-900 font-medium py-1.5 px-3 rounded-lg bg-amber-50 hover:bg-amber-100/80 transition-colors inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span>Quick Sign In as Demo (Josh Sunga)</span>
              </button>
            </div>
          </form>
        )}

        {/* SIGN UP MULTI-STEP FLOW */}
        {mode === 'signup' && (
          <div>
            {/* Step Indicators */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-medium text-stone-500 mb-1.5">
                <span className={signupStep >= 1 ? 'text-stone-900 font-semibold' : ''}>
                  1. Credentials
                </span>
                <span className={signupStep >= 2 ? 'text-stone-900 font-semibold' : ''}>
                  2. Sex
                </span>
                <span className={signupStep >= 3 ? 'text-stone-900 font-semibold' : ''}>
                  3. Body Type
                </span>
                <span className={signupStep >= 4 ? 'text-stone-900 font-semibold' : ''}>
                  4. Try-On Photo
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-colors rounded-full ${
                    signupStep >= 1 ? 'bg-stone-900' : 'bg-transparent'
                  }`}
                />
                <div
                  className={`h-full transition-colors rounded-full ${
                    signupStep >= 2 ? 'bg-stone-900' : 'bg-transparent'
                  }`}
                />
                <div
                  className={`h-full transition-colors rounded-full ${
                    signupStep >= 3 ? 'bg-stone-900' : 'bg-transparent'
                  }`}
                />
                <div
                  className={`h-full transition-colors rounded-full ${
                    signupStep >= 4 ? 'bg-stone-900' : 'bg-transparent'
                  }`}
                />
              </div>
            </div>

            {/* STEP 1: Account Credentials */}
            {signupStep === 1 && (
              <form onSubmit={handleStep1Next} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="signup-name-input"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white"
                      autoComplete="name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      id="signup-email-input"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@example.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1.5">
                    Create Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="signup-password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 4 characters"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:bg-white"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  id="signup-step1-next"
                  className="w-full py-3 px-4 bg-stone-900 hover:bg-stone-800 text-amber-50 rounded-xl font-medium text-sm transition-colors shadow-sm flex items-center justify-center gap-2 mt-3"
                >
                  <span>Next: Select Biological Sex</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* STEP 2: Biological Sex Selection */}
            {signupStep === 2 && (
              <div className="space-y-4">
                <div className="text-center mb-2">
                  <h2 className="text-base font-semibold text-stone-900">
                    Select Your Biological Sex
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    This determines whether to display the male (01–09) or female (10–18) body silhouette scales.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Male Card */}
                  <button
                    type="button"
                    id="select-sex-male"
                    onClick={() => handleSexSelect('male')}
                    className={`p-4 rounded-2xl border text-left flex flex-col items-center justify-center transition-all ${
                      sex === 'male'
                        ? 'border-stone-900 bg-stone-900 text-amber-50 shadow-md ring-2 ring-stone-900'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                    }`}
                  >
                    <div className="w-12 h-20 mb-2 flex items-center justify-center">
                      <BodySilhouetteSvg
                        code="04"
                        sex="male"
                        isSelected={sex === 'male'}
                        className="w-12 h-20"
                      />
                    </div>
                    <span className="font-semibold text-sm">Male</span>
                    <span
                      className={`text-[11px] mt-1 text-center leading-tight ${
                        sex === 'male' ? 'text-amber-200/80' : 'text-stone-500'
                      }`}
                    >
                      Types 01 to 09
                    </span>
                  </button>

                  {/* Female Card */}
                  <button
                    type="button"
                    id="select-sex-female"
                    onClick={() => handleSexSelect('female')}
                    className={`p-4 rounded-2xl border text-left flex flex-col items-center justify-center transition-all ${
                      sex === 'female'
                        ? 'border-stone-900 bg-stone-900 text-amber-50 shadow-md ring-2 ring-stone-900'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                    }`}
                  >
                    <div className="w-12 h-20 mb-2 flex items-center justify-center">
                      <BodySilhouetteSvg
                        code="13"
                        sex="female"
                        isSelected={sex === 'female'}
                        className="w-12 h-20"
                      />
                    </div>
                    <span className="font-semibold text-sm">Female</span>
                    <span
                      className={`text-[11px] mt-1 text-center leading-tight ${
                        sex === 'female' ? 'text-amber-200/80' : 'text-stone-500'
                      }`}
                    >
                      Types 10 to 18
                    </span>
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSignupStep(1)}
                    className="flex-1 py-2.5 px-3 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    id="signup-step2-next"
                    onClick={() => setSignupStep(3)}
                    className="flex-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-amber-50 rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>Next: Select Body Type</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Body Type Selection (Matching Sample Images) */}
            {signupStep === 3 && (
              <div className="space-y-4">
                <div className="text-center">
                  <h2 className="text-base font-semibold text-stone-900">
                    Select a Body Type Similar to Yours
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Calibrated from the {sex === 'male' ? 'Male (01–09)' : 'Female (10–18)'} Somatotype rating scale.
                  </p>
                </div>

                {/* Horizontal / Grid Silhouette Selector */}
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-2 border border-stone-200/60 rounded-2xl p-2 bg-stone-50/70">
                  {availableBodyTypes.map((bt) => {
                    const isSelected = selectedBodyType.code === bt.code;
                    return (
                      <button
                        key={bt.code}
                        type="button"
                        id={`body-type-option-${bt.code}`}
                        onClick={() => setSelectedBodyType(bt)}
                        className={`w-full p-2.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
                          isSelected
                            ? 'border-stone-900 bg-white shadow-sm ring-1 ring-stone-900'
                            : 'border-stone-200/70 bg-white/70 hover:bg-white hover:border-stone-300'
                        }`}
                      >
                        {/* Silhouette graphic */}
                        <div className="w-12 h-16 shrink-0 flex items-center justify-center bg-stone-100/70 rounded-lg p-1">
                          <BodySilhouetteSvg
                            code={bt.code}
                            sex={sex}
                            isSelected={isSelected}
                            className="w-10 h-14"
                          />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-stone-900">
                              Type {bt.code}
                            </span>
                            <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
                              {bt.category}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-stone-800 truncate mt-0.5">
                            {bt.label}
                          </p>
                          <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                            {bt.description}
                          </p>
                        </div>

                        {/* Selected Radio Indicator */}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? 'bg-stone-900 border-stone-900 text-white'
                              : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Preview Highlight Card */}
                {selectedBodyType && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start gap-2.5 text-xs text-stone-800">
                    <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-stone-900">
                        Selected: Type {selectedBodyType.code} ({selectedBodyType.label})
                      </p>
                      <p className="text-stone-600 text-[11px] mt-0.5">
                        Styling Tip: {selectedBodyType.stylingTip}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSignupStep(2)}
                    className="flex-1 py-2.5 px-3 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    id="signup-step3-next-btn"
                    onClick={() => setSignupStep(4)}
                    className="flex-2 py-2.5 px-4 bg-stone-900 hover:bg-stone-800 text-amber-50 rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-1.5"
                  >
                    <span>Next: Try-On Photo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Virtual Try-On Picture (Camera / Upload) */}
            {signupStep === 4 && (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-[#f0e9df] text-[#784a2c] flex items-center justify-center mb-2 shadow-xs">
                    <Camera className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <h3 className="font-bold text-stone-900 text-base sm:text-lg">
                    Take or Upload Your Try-On Picture
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                    Flashdrobe uses your photo to drape outfits onto you in the Virtual Fitting Room mirror.
                  </p>
                </div>

                {cameraError && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                    <span>{cameraError}</span>
                  </div>
                )}

                {/* Hidden canvas for snapshot rendering */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Hidden input for gallery / device file selection */}
                <input
                  ref={fileUploadRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Live Camera Viewfinder State */}
                {isCameraActive ? (
                  <div className="relative rounded-2xl overflow-hidden bg-stone-900 border-2 border-[#8c5836] shadow-md aspect-[3/4] max-w-xs mx-auto flex flex-col justify-between">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Viewfinder Silhouette Outline Helper */}
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center border-2 border-dashed border-white/40 rounded-2xl m-3">
                      <div className="w-24 h-28 border border-white/60 rounded-full mb-2 opacity-50" />
                      <div className="w-44 h-48 border border-white/60 rounded-3xl opacity-40" />
                      <span className="absolute bottom-4 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-3 py-1 rounded-full">
                        Stand straight facing camera
                      </span>
                    </div>

                    {/* Camera Top Controls */}
                    <div className="relative z-10 flex justify-between items-center p-3 bg-gradient-to-b from-black/60 to-transparent">
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                        title="Flip Camera"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white text-xs font-semibold backdrop-blur-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>

                    {/* Camera Shutter Bar */}
                    <div className="relative z-10 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-center items-center">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        id="shutter-capture-btn"
                        className="w-16 h-16 rounded-full bg-white border-4 border-[#8c5836] shadow-xl hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
                        title="Capture Picture"
                      >
                        <div className="w-11 h-11 rounded-full bg-[#8c5836] flex items-center justify-center text-white">
                          <Camera className="w-5 h-5" />
                        </div>
                      </button>
                    </div>
                  </div>
                ) : userPhoto ? (
                  /* Photo Captured / Selected Preview */
                  <div className="relative rounded-2xl overflow-hidden bg-stone-100 border border-[#e7e2d9] shadow-sm aspect-[3/4] max-w-xs mx-auto flex flex-col">
                    <img
                      src={userPhoto}
                      alt="Your Try-On Photo"
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay Badges and Actions */}
                    <div className="absolute top-3 left-3 bg-emerald-700/90 text-white backdrop-blur-md text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3" />
                      <span>Ready for Fitting Mirror</span>
                    </div>

                    <div className="absolute bottom-3 inset-x-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => startCamera()}
                        className="flex-1 py-2 px-2.5 bg-black/75 hover:bg-black/90 text-white text-xs font-semibold rounded-xl backdrop-blur-md transition-colors flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Retake</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => fileUploadRef.current?.click()}
                        className="flex-1 py-2 px-2.5 bg-white/90 hover:bg-white text-stone-900 text-xs font-semibold rounded-xl backdrop-blur-md transition-colors flex items-center justify-center gap-1 shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload New</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Initial Capture / Upload Choice Cards */
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Take with Camera Button */}
                      <button
                        type="button"
                        id="start-camera-signup-btn"
                        onClick={() => startCamera()}
                        className="p-4 rounded-2xl border-2 border-stone-200 hover:border-[#8c5836] bg-white hover:bg-[#faf7f2] transition-all text-left group flex flex-col justify-between h-32 shadow-2xs"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#f0e9df] text-[#784a2c] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Camera className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1">
                            <span>Take Picture</span>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#8c5836] group-hover:translate-x-0.5 transition-all" />
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5">Use camera for live photo</p>
                        </div>
                      </button>

                      {/* Upload Photo Button */}
                      <button
                        type="button"
                        id="upload-photo-signup-btn"
                        onClick={() => fileUploadRef.current?.click()}
                        className="p-4 rounded-2xl border-2 border-stone-200 hover:border-[#8c5836] bg-white hover:bg-[#faf7f2] transition-all text-left group flex flex-col justify-between h-32 shadow-2xs"
                      >
                        <div className="w-9 h-9 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Upload className="w-5 h-5 stroke-[2.2]" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1">
                            <span>Upload Photo</span>
                            <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#8c5836] group-hover:translate-x-0.5 transition-all" />
                          </p>
                          <p className="text-[11px] text-stone-500 mt-0.5">From gallery or files</p>
                        </div>
                      </button>
                    </div>

                    <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-600 text-[11px] flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#8c5836] flex-shrink-0 mt-0.5" />
                      <span>
                        Tip: Standing straight against a plain background with good lighting allows the AI to drape outfits realistically.
                      </span>
                    </div>
                  </div>
                )}

                {/* Step 4 Navigation Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setSignupStep(3);
                    }}
                    className="flex-1 py-2.5 px-3 border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    id="signup-complete-btn"
                    onClick={handleCompleteSignup}
                    className="flex-2 py-2.5 px-4 bg-[#8c5836] hover:bg-[#784a2c] text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-md shadow-[#8c5836]/20 flex items-center justify-center gap-1.5"
                  >
                    <span>{userPhoto ? 'Enter Fitting Studio' : 'Enter Fitting Studio'}</span>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer info */}
      <p className="text-[11px] text-stone-400 text-center mt-6">
        Flashdrobe stores your wardrobe and profile locally on your device.
      </p>
    </div>
  );
};
