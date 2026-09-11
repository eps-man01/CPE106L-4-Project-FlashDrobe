import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Shirt,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';

export const AuthScreen: React.FC = () => {
  const { loginWithGoogle, authLoading, authError } = useWardrobe();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setError(null);
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please try again.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked. Please allow popups and try again.');
      } else {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const displayError = error || authError;

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
        {/* Error Banner */}
        {displayError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span>{displayError}</span>
          </div>
        )}

        {/* Google Sign-In */}
        <div className="space-y-4">
          <p className="text-sm text-stone-600 text-center">
            Sign in with your Google account to access your wardrobe across all devices.
          </p>

          <button
            onClick={handleGoogleSignIn}
            disabled={isSigningIn || authLoading}
            className="w-full py-3 px-4 bg-white border-2 border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-900 rounded-xl font-medium text-sm transition-all shadow-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSigningIn || authLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>{isSigningIn ? 'Signing in...' : 'Continue with Google'}</span>
            {!isSigningIn && <ArrowRight className="w-4 h-4 text-stone-400" />}
          </button>
        </div>
      </div>

      {/* Footer info */}
      <p className="text-[11px] text-stone-400 text-center mt-6">
        Your wardrobe syncs securely across all your devices.
      </p>
    </div>
  );
};
