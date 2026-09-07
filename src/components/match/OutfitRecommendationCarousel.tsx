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

    // Calculate active index based on scroll position
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
      <div className="bg-white border border-[#e7e2d9] rounded-3xl p-8 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8c5836] to-[#a16b47] flex items-center justify-center mx-auto shadow-lg shadow-[#8c5836]/20">
          <Sparkles className="w-6 h-6 text-white animate-pulse" />
        </div>
        <h3 className="text-sm font-extrabold text-stone-900">
          Stylist is curating your looks...
        </h3>
        <p className="text-xs text-stone-500 max-w-[250px] mx-auto">
          Analyzing weather, occasion, and your wardrobe to craft the perfect outfits.
        </p>
        <div className="flex justify-center space-x-1">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[#8c5836]"
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
      <div className="bg-white border border-[#e7e2d9] rounded-3xl p-6 shadow-xs text-center space-y-3">
        <Sparkles className="w-8 h-8 text-[#8c5836] mx-auto" />
        <h3 className="text-sm font-extrabold text-stone-900">
          No recommendations yet
        </h3>
        <p className="text-xs text-stone-500 max-w-[250px] mx-auto">
          Select an occasion above and tap generate to get AI-powered outfit suggestions.
        </p>
        <button
          onClick={onRegenerate}
          className="px-4 py-2 bg-[#8c5836] hover:bg-[#784a2c] text-white rounded-xl text-xs font-bold shadow-xs transition-all"
        >
          Generate Outfits
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Carousel Container */}
      <div className="relative">
        {/* Scroll arrows */}
        {canScrollLeft && (
          <button
            onClick={() => scrollTo('left')}
            className="absolute left-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/90 border border-[#e7e2d9] shadow-md text-stone-700 hover:text-[#8c5836] transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        {canScrollRight && (
          <button
            onClick={() => scrollTo('right')}
            className="absolute right-1 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-full bg-white/90 border border-[#e7e2d9] shadow-md text-stone-700 hover:text-[#8c5836] transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Cards */}
        <div
          ref={scrollRef}
          className="flex space-x-3 overflow-x-auto snap-x snap-mandatory no-scrollbar py-1 px-1"
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
        <div className="flex items-center space-x-1.5">
          {recommendations.map((_, idx) => (
            <div
              key={idx}
              className={`rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? 'w-5 h-2 bg-[#8c5836]'
                  : 'w-2 h-2 bg-stone-300'
              }`}
            />
          ))}
        </div>

        <button
          onClick={onRegenerate}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-[#e7e2d9] text-stone-700 text-[11px] font-bold transition-colors"
        >
          <RefreshCw className="w-3 h-3 text-[#8c5836]" />
          <span>Regenerate</span>
        </button>
      </div>
    </div>
  );
};
