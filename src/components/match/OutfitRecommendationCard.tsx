import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Sparkles,
  Heart,
  ShieldCheck,
  ArrowRight,
  Shuffle,
  Shirt,
  Replace,
} from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { GeminiOutfitResult, ClothingItem } from '../../types';

interface OutfitRecommendationCardProps {
  recommendation: GeminiOutfitResult;
  index: number;
  totalCards: number;
  onSwapItem: (classification: string, currentItemId: string | null, recIndex: number) => void;
  onTryOn: (itemIds: string[]) => void;
  onSave: (rec: GeminiOutfitResult) => void;
  onFitAnalysis: (itemIds: string[]) => void;
}

const CLASSIFICATION_LABELS: Record<string, string> = {
  Tops: 'Top',
  Bottoms: 'Bottom',
  Outerwear: 'Outerwear',
  Footwear: 'Footwear',
  Accessories: 'Accessory',
};

export const OutfitRecommendationCard: React.FC<OutfitRecommendationCardProps> = ({
  recommendation,
  index,
  totalCards,
  onSwapItem,
  onTryOn,
  onSave,
  onFitAnalysis,
}) => {
  const { wardrobe } = useWardrobe();

  const selectedItems = useMemo(() => {
    return recommendation.selectedItemIds
      .map((id) => wardrobe.find((w) => w.id === id))
      .filter(Boolean) as ClothingItem[];
  }, [recommendation.selectedItemIds, wardrobe]);

  const itemsByClassification = useMemo(() => {
    const groups: Record<string, ClothingItem[]> = {};
    selectedItems.forEach((item) => {
      if (!groups[item.classification]) {
        groups[item.classification] = [];
      }
      groups[item.classification].push(item);
    });
    return groups;
  }, [selectedItems]);

  const classificationOrder = ['Outerwear', 'Tops', 'Bottoms', 'Footwear', 'Accessories'];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-[#4d663b] bg-[#eef3e8] border-[#cfdec3]';
    if (score >= 70) return 'text-[#8c5836] bg-[#f0e9df] border-[#ddcfbe]';
    return 'text-amber-800 bg-amber-50 border-amber-200';
  };

  return (
    <motion.div
      className="bg-white border border-[#e7e2d9] rounded-3xl p-4 shadow-sm flex-shrink-0 w-[85vw] sm:w-[380px] snap-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#eee9df] mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1.5 mb-0.5">
            <span className="text-[9px] uppercase font-bold text-[#8c5836]">
              Look {index + 1} of {totalCards}
            </span>
          </div>
          <h4 className="text-sm font-extrabold text-stone-900 truncate">
            {recommendation.outfitName}
          </h4>
        </div>
        <div className={`px-2.5 py-1 rounded-xl border text-xs font-black ${getScoreColor(recommendation.weatherScore)}`}>
          {recommendation.weatherScore}%
        </div>
      </div>

      {/* Item Grid */}
      <div className="space-y-2 mb-3">
        {classificationOrder.map((cls) => {
          const items = itemsByClassification[cls];
          if (!items || items.length === 0) return null;
          return items.map((item) => (
            <div
              key={item.id}
              className="flex items-center space-x-2.5 bg-[#fbf9f5] border border-[#eee9df] rounded-xl p-2 group"
            >
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-10 h-10 object-cover rounded-lg border border-[#e7e2d9] flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold text-[#8c5836] uppercase block">
                  {CLASSIFICATION_LABELS[cls] || cls}
                </span>
                <span className="text-xs font-bold text-stone-900 truncate block">{item.name}</span>
                <span className="text-[10px] text-stone-500 block">{item.colorName}</span>
              </div>
              <button
                onClick={() => onSwapItem(cls, item.id, index)}
                className="p-1.5 rounded-lg bg-white border border-[#e7e2d9] text-stone-500 hover:text-[#8c5836] hover:border-[#8c5836] opacity-60 group-hover:opacity-100 transition-all"
                title={`Swap ${CLASSIFICATION_LABELS[cls]}`}
              >
                <Replace className="w-3.5 h-3.5" />
              </button>
            </div>
          ));
        })}
      </div>

      {/* Weather Compatibility */}
      <div className="bg-[#fbf9f5] border border-[#eee9df] rounded-2xl p-3 mb-3">
        <p className="text-xs text-stone-700 leading-relaxed">
          {recommendation.weatherCompatibility}
        </p>
      </div>

      {/* Color Harmony */}
      {recommendation.colorHarmony && (
        <div className="mb-3">
          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
            Color Harmony
          </span>
          <p className="text-xs text-stone-600">{recommendation.colorHarmony}</p>
        </div>
      )}

      {/* Styling Tips */}
      {recommendation.stylingTips && recommendation.stylingTips.length > 0 && (
        <div className="mb-3 pt-2 border-t border-[#eee9df]">
          <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block mb-1">
            Styling Tips
          </span>
          <ul className="space-y-0.5">
            {recommendation.stylingTips.map((tip, idx) => (
              <li key={idx} className="text-[11px] flex items-start gap-1" style={{ color: 'var(--md-on-surface-variant)' }}>
                <Sparkles className="w-2.5 h-2.5 mt-0.5 flex-shrink-0" style={{ color: 'var(--md-primary)' }} />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: 'var(--md-outline-variant)' }}>
        <button
          onClick={() => onTryOn(recommendation.selectedItemIds)}
          className="py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
          style={{ backgroundColor: 'var(--md-primary)', color: 'var(--md-on-primary)' }}
        >
          <Shirt className="w-3 h-3" />
          <span>Try On</span>
        </button>
        <button
          onClick={() => onSave(recommendation)}
          className="py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
          style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
        >
          <Heart className="w-3 h-3" style={{ color: 'var(--md-tertiary)' }} />
          <span>Save</span>
        </button>
        <button
          onClick={() => onFitAnalysis(recommendation.selectedItemIds)}
          className="py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
          style={{ backgroundColor: 'var(--md-surface-container)', color: 'var(--md-on-surface)' }}
        >
          <ShieldCheck className="w-3 h-3" style={{ color: 'var(--md-tertiary)' }} />
          <span>Fit</span>
        </button>
      </div>
    </motion.div>
  );
};
