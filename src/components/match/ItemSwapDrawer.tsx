import React, { useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';
import { ClothingClassification } from '../../types';

interface ItemSwapDrawerProps {
  classification: ClothingClassification;
  currentItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onClose: () => void;
}

export const ItemSwapDrawer: React.FC<ItemSwapDrawerProps> = ({
  classification,
  currentItemId,
  onSelectItem,
  onClose,
}) => {
  const { wardrobe } = useWardrobe();

  const items = useMemo(
    () => wardrobe.filter((item) => item.classification === classification),
    [wardrobe, classification]
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end justify-center">
      <div className="bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[70vh] overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-300">
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
                        ? 'bg-[#f5ede3] border-[#8c5836] ring-2 ring-[#8c5836]/30 shadow-xs'
                        : 'bg-stone-50 border-[#e7e2d9] hover:bg-stone-100 active:scale-95'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 z-10 w-4 h-4 rounded-full bg-[#8c5836] flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                      </div>
                    )}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full aspect-square object-cover rounded-xl border border-[#e7e2d9]"
                    />
                    <span className="text-[10px] font-bold text-stone-900 truncate mt-1.5">
                      {item.name}
                    </span>
                    <span className="text-[9px] text-[#8c5836] font-semibold truncate">
                      {item.subType}
                    </span>
                    <div className="flex items-center space-x-1 mt-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-[#e7e2d9]"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-[9px] text-stone-500 font-medium">{item.colorName}</span>
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
