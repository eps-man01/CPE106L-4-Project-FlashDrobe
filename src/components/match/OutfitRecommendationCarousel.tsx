import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw } from 'lucide-react';
import { GeminiOutfitResult } from '../../types';
import { OutfitRecommendationCard } from './OutfitRecommendationCard';

interface OutfitRecommendationCarouselProps {
  recommendations: GeminiOutfitResult[];
  isGenerating: boolean;
  onSwapItem: (classification: string, currentItemId: string | null, recIndex: number) => void;
  onTryOn: (itemIds: string[]) => void;
  onSave: (rec: GeminiOutfitResult) => void;
  onFitAnalysis: (itemIds: string[]) => void;
  onRegenerate: () => void;
}

export const OutfitRecommendationCarousel: React.FC<OutfitRecommendationCarouselProps> = ({
  recommendations,
  isGenerating,
  onSwapItem,
  onTryOn,
  onSave,
  onFitAnalysis,
  onRegenerate,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 5);
    const cardWidth = scrollRef.current.children[0]
      ? (scrollRef.current.children[0] as HTMLElement).offsetWidth + 12
      : 1;
    const newIndex = Math.round(scrollLeft / cardWidth);
    setActiveIndex(Math.min(newIndex, recommendations.length - 1));
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, [recommendations]);

  const scrollTo = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.children[0]
      ? (scrollRef.current.children[0] as HTMLElement).offsetWidth + 12
      : 300;
    const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (isGenerating) {
    return (
      <div
        className="rounded-3xl p-8 md-elevation-1 text-center space-y-3"
        style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto md-elevation-2"
          style={{ backgroundColor: 'var(--md-primary-container)' }}
        >
          <Sparkles className="w-6 h-6 animate-pulse" style={{ color: 'var(--md-on-primary-container)' }} />
        </div>
        <h3 className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>
          Stylist is curating your looks...
        </h3>
        <p className="text-xs max-w-[250px] mx-auto" style={{ color: 'var(--md-on-surface-variant)' }}>
          Analyzing weather, occasion, and your wardrobe to craft the perfect outfits.
        </p>
        <div className="flex justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: 'var(--md-primary)' }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div
        className="rounded-3xl p-6 md-elevation-1 text-center space-y-3"
        style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
      >
        <Sparkles className="w-8 h-8 mx-auto" style={{ color: 'var(--md-primary)' }} />
        <h3 className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>
          No recommendations yet
        </h3>
        <p className="text-xs max-w-[250px] mx-auto" style={{ color: 'var(--md-on-surface-variant)' }}>
          Select an occasion above and tap generate to get AI-powered outfit suggestions.
        </p>
        <button
          onClick={onRegenerate}
          className="px-5 py-2 rounded-full text-xs font-bold md-elevation-1 transition-all"
          style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
        >
          Generate Outfits
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        {canScrollLeft && (
          <button
            onClick={() => scrollTo('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full md-elevation-2 transition-colors"
            style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scrollTo('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full md-elevation-2 transition-colors"
            style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar py-1 px-1"
          style={{ scrollPaddingLeft: '4px' }}
        >
          {recommendations.map((rec, idx) => (
            <OutfitRecommendationCard
              key={`${rec.outfitName}-${idx}`}
              recommendation={rec}
              index={idx}
              totalCards={recommendations.length}
              onSwapItem={onSwapItem}
              onTryOn={onTryOn}
              onSave={onSave}
              onFitAnalysis={onFitAnalysis}
            />
          ))}
        </div>
      </div>

      {/* Dots Indicator + Regenerate */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          {recommendations.map((_, idx) => (
            <div
              key={idx}
              className="rounded-full transition-all duration-300"
              style={{
                width: idx === activeIndex ? 20 : 8,
                height: 8,
                backgroundColor: idx === activeIndex ? 'var(--md-primary)' : 'var(--md-surface-container-highest)',
              }}
            />
          ))}
        </div>

        <button
          onClick={onRegenerate}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-colors"
          style={{
            backgroundColor: 'var(--md-surface-container)',
            color: 'var(--md-on-surface)',
          }}
        >
          <RefreshCw className="w-3 h-3" style={{ color: 'var(--md-primary)' }} />
          <span>Regenerate</span>
        </button>
      </div>
    </div>
  );
};
