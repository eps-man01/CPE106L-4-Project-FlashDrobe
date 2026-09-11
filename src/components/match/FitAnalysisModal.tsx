import React from 'react';
import { X, ShieldCheck, Scissors, RefreshCw } from 'lucide-react';
import { VirtualTryOnResult } from '../../types';
import { useDelayedRender } from '../../hooks/useDelayedRender';

interface FitAnalysisModalProps {
  isOpen: boolean;
  result: VirtualTryOnResult;
  onClose: () => void;
  onReEvaluate: () => void;
  isReEvaluating: boolean;
}

export const FitAnalysisModal: React.FC<FitAnalysisModalProps> = ({
  isOpen,
  result,
  onClose,
  onReEvaluate,
  isReEvaluating,
}) => {
  const [shouldRender, isExiting] = useDelayedRender(isOpen);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm ${isExiting ? 'animate-md-fade-out' : 'animate-in fade-in duration-150'}`} style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <div className={`bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[85vh] overflow-y-auto shadow-2xl ${isExiting ? 'animate-md-exit' : 'animate-md-sheet'}`}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-[#eee9df] px-4 py-3 flex items-center justify-between z-10">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#5e7d48]" />
            <h3 className="text-sm font-extrabold text-stone-900">Fit Analysis</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Fit Score Badge */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-600">Overall Fit Score</span>
            <div className="flex items-center space-x-1 px-3 py-1 rounded-xl bg-[#eef3e8] border border-[#cfdec3] text-[#4d663b]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#5e7d48]" />
              <span className="text-sm font-black">{result.fitScore}%</span>
            </div>
          </div>

          {/* Style Vibe */}
          {result.styleVibe && (
            <div className="bg-[#fbf9f5] border border-[#eee9df] rounded-2xl p-3">
              <span className="text-[10px] font-bold text-[#8c5836] uppercase tracking-wider block mb-1">
                Style Vibe
              </span>
              <p className="text-xs font-bold text-stone-900">{result.styleVibe}</p>
            </div>
          )}

          {/* Silhouette Analysis */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
              Silhouette Analysis
            </span>
            <p className="text-xs text-stone-700 leading-relaxed bg-[#fbf9f5] p-3 rounded-2xl border border-[#eee9df]">
              {result.silhouetteAnalysis}
            </p>
          </div>

          {/* Proportions Feedback */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
              Proportion Harmony
            </span>
            <p className="text-xs text-stone-600">{result.proportionsFeedback}</p>
          </div>

          {/* Garment Breakdown */}
          {result.garmentBreakdown && result.garmentBreakdown.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider block">
                Garment Breakdown
              </span>
              <div className="space-y-1.5">
                {result.garmentBreakdown.map((g, idx) => (
                  <div key={idx} className="bg-stone-50 border border-[#e7e2d9] rounded-xl p-2.5">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-[#8c5836] uppercase">{g.classification}</span>
                      <span className="text-[10px] font-bold text-stone-500">{g.fitType}</span>
                    </div>
                    <span className="text-xs font-bold text-stone-900 block">{g.itemTitle}</span>
                    <p className="text-[11px] text-stone-600 mt-0.5">{g.commentary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Body Type Flatter Rating */}
          <div className="flex items-center justify-between bg-[#fbf9f5] border border-[#eee9df] rounded-xl p-3">
            <span className="text-xs font-bold text-stone-700">Body Type Flattery</span>
            <span className="text-sm font-black text-[#4d663b]">{result.bodyTypeFlatterRating}/100</span>
          </div>

          {/* Tailoring Advice */}
          {result.tailoringAdvice && result.tailoringAdvice.length > 0 && (
            <div className="space-y-1.5 pt-2 border-t border-[#eee9df]">
              <span className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center space-x-1">
                <Scissors className="w-3 h-3 text-[#8c5836]" />
                <span>Tailoring Adjustments</span>
              </span>
              <ul className="space-y-1 text-xs text-stone-600 list-disc list-inside">
                {result.tailoringAdvice.map((tip, idx) => (
                  <li key={idx} className="leading-snug">
                    <span className="text-stone-800">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Re-evaluate Button */}
          <button
            onClick={onReEvaluate}
            disabled={isReEvaluating}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 border border-[#e7e2d9] rounded-xl text-xs font-bold text-stone-800 flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isReEvaluating ? 'animate-spin' : ''}`} />
            <span>{isReEvaluating ? 'Re-analyzing...' : 'Re-evaluate Silhouette'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
