import React, { useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { ClothingClassification } from '../../types';
import { useDelayedRender } from '../../hooks/useDelayedRender';

interface ItemSwapDrawerProps {
  isOpen: boolean;
  classification: ClothingClassification;
  currentItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onClose: () => void;
}

export const ItemSwapDrawer: React.FC<ItemSwapDrawerProps> = ({
  isOpen,
  classification,
  currentItemId,
  onSelectItem,
  onClose,
}) => {
  const { wardrobe } = useWardrobe();
  const [shouldRender, isExiting] = useDelayedRender(isOpen);

  const items = useMemo(
    () => wardrobe.filter((item) => item.classification === classification),
    [wardrobe, classification]
  );

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-end justify-center p-0 sm:p-4 backdrop-blur-sm ${isExiting ? 'animate-md-fade-out' : 'animate-in fade-in duration-150'}`} style={{ backgroundColor: 'rgba(0,0,0,0.35)' }}>
      <div className={`bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[70vh] overflow-hidden shadow-2xl ${isExiting ? 'animate-md-exit' : 'animate-md-sheet'}`}>
        {/* Header */}
        <div className="border-b border-[#eee9df] px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">Swap {classification}</h3>
            <p className="text-[11px] text-stone-500">
              {items.length} item{items.length !== 1 ? 's' : ''} available
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-stone-100 text-stone-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item Grid */}
        <div className="p-3 overflow-y-auto max-h-[calc(70vh-60px)]">
          {items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-xs font-bold text-stone-500">No {classification.toLowerCase()} in your wardrobe</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {items.map((item) => {
                const isSelected = item.id === currentItemId;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectItem(item.id);
                      onClose();
                    }}
                    className={`relative flex flex-col rounded-2xl p-1.5 text-left border transition-all ${
                      isSelected
                        ? 'border-2'
                        : 'hover:bg-stone-100 active:scale-95'
                    }`}
                    style={{
                      backgroundColor: isSelected ? 'var(--md-primary-container)' : 'var(--md-surface-container)',
                      borderColor: isSelected ? 'var(--md-primary)' : 'var(--md-outline-variant)',
                    }}
                  >
                    {isSelected && (
                      <div
                        className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--md-primary)' }}
                      >
                        <Check className="w-2.5 h-2.5" strokeWidth={3} style={{ color: 'var(--md-on-primary)' }} />
                      </div>
                    )}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full aspect-square object-cover rounded-xl border border-[var(--md-outline-variant)]"
                    />
                    <span className="text-[10px] font-bold truncate mt-1.5" style={{ color: 'var(--md-on-surface)' }}>
                      {item.name}
                    </span>
                    <span className="text-[9px] font-semibold truncate" style={{ color: 'var(--md-primary)' }}>
                      {item.subType}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full border"
                        style={{ backgroundColor: item.color, borderColor: 'var(--md-outline-variant)' }}
                      />
                      <span className="text-[9px] font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>{item.colorName}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
