import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { BiologicalSex, BodyTypeInfo } from '../../types';
import { getBodyTypesForSex } from '../../data/bodyTypes';
import { BodySilhouetteSvg } from '../auth/BodySilhouetteSvg';

interface UpdateBodyTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSex?: BiologicalSex;
  currentBodyType?: BodyTypeInfo;
  onSave: (sex: BiologicalSex, bodyType: BodyTypeInfo) => void;
}

export const UpdateBodyTypeModal: React.FC<UpdateBodyTypeModalProps> = ({
  isOpen,
  onClose,
  currentSex,
  currentBodyType,
  onSave,
}) => {
  const initialSex: BiologicalSex = currentSex === 'female' ? 'female' : 'male';
  const [sex, setSex] = useState<BiologicalSex>(initialSex);
  const [selectedBodyType, setSelectedBodyType] = useState<BodyTypeInfo>(() => {
    if (currentBodyType) return currentBodyType;
    return getBodyTypesForSex(initialSex)[3];
  });

  if (!isOpen) return null;

  const handleSexChange = (newSex: BiologicalSex) => {
    setSex(newSex);
    const types = getBodyTypesForSex(newSex);
    setSelectedBodyType(types[3]);
  };

  const handleConfirm = () => {
    if (selectedBodyType) {
      onSave(sex, selectedBodyType);
      onClose();
    }
  };

  const availableBodyTypes = getBodyTypesForSex(sex);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white border border-stone-200 w-full max-w-md rounded-3xl p-5 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-stone-900">Update Body Silhouette</h3>
            <p className="text-xs text-stone-500">Fine-tune your build for tailored styling advice</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Sex toggle */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Biological Sex
            </label>
            <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => handleSexChange('male')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  sex === 'male'
                    ? 'bg-stone-900 text-amber-50 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Male (01–09)
              </button>
              <button
                type="button"
                onClick={() => handleSexChange('female')}
                className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                  sex === 'female'
                    ? 'bg-stone-900 text-amber-50 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Female (10–18)
              </button>
            </div>
          </div>

          {/* Body Types List */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Select Body Type Silhouette
            </label>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {availableBodyTypes.map((bt) => {
                const isSelected = selectedBodyType?.code === bt.code;
                return (
                  <button
                    key={bt.code}
                    type="button"
                    onClick={() => setSelectedBodyType(bt)}
                    className={`w-full p-2.5 rounded-xl border flex items-center gap-3 text-left transition-all ${
                      isSelected
                        ? 'border-stone-900 bg-amber-50/40 ring-1 ring-stone-900'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/50'
                    }`}
                  >
                    <div className="w-10 h-14 shrink-0 flex items-center justify-center bg-white rounded-lg border border-stone-200/60 p-0.5">
                      <BodySilhouetteSvg
                        code={bt.code}
                        sex={sex}
                        isSelected={isSelected}
                        className="w-9 h-13"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-stone-900">Type {bt.code}</span>
                        <span className="text-[10px] uppercase font-medium px-1.5 py-0.2 rounded bg-stone-200/70 text-stone-700">
                          {bt.category}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-stone-800 truncate">{bt.label}</p>
                      <p className="text-[11px] text-stone-500 line-clamp-1">{bt.description}</p>
                    </div>
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
          </div>

          {/* Selected Styling Tip Preview */}
          {selectedBodyType && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start gap-2 text-xs text-stone-800">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-stone-900">
                  Type {selectedBodyType.code}: {selectedBodyType.label}
                </p>
                <p className="text-stone-600 text-[11px] mt-0.5">
                  {selectedBodyType.stylingTip}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-2 pt-3 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-stone-200 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-2 py-2.5 bg-stone-900 hover:bg-stone-800 text-amber-50 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5"
          >
            <span>Update Silhouette</span>
            <Check className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
