import React from 'react';
import { Sun, CloudRain, Cloud, Wind, Droplets, Thermometer, Settings2, Sparkles } from 'lucide-react';
import { useWardrobe } from '../../context/WardrobeContext';

interface WeatherOccasionBarProps {
  selectedCategoryId: string;
  onSelectCategory: (categoryId: string) => void;
  onManageCategories: () => void;
}

const getWeatherIcon = (condition: string) => {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('drizzle')) return CloudRain;
  if (c.includes('cloud') || c.includes('overcast')) return Cloud;
  if (c.includes('wind')) return Wind;
  return Sun;
};

export const WeatherOccasionBar: React.FC<WeatherOccasionBarProps> = ({
  selectedCategoryId,
  onSelectCategory,
  onManageCategories,
}) => {
  const { categories, weather, isWeatherLoading } = useWardrobe();

  const WeatherIcon = weather ? getWeatherIcon(weather.condition) : Sun;

  return (
    <div className="space-y-2">
      {/* Weather Mini Display */}
      <div className="bg-white border border-[#e7e2d9] rounded-2xl p-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded-xl bg-[#f0e9df] text-[#8c5836]">
            <WeatherIcon className="w-4 h-4" />
          </div>
          {weather ? (
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-sm font-extrabold text-stone-900">{weather.tempC}°C</span>
                <span className="text-[10px] font-bold text-stone-500">Feels {weather.feelsLikeC}°C</span>
              </div>
              <span className="text-[11px] text-stone-600 font-medium">
                {weather.condition} in {weather.city}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-bold text-stone-700 block">
                {isWeatherLoading ? 'Fetching weather...' : 'No weather data'}
              </span>
              <span className="text-[11px] text-stone-500">
                {isWeatherLoading ? 'Getting GPS location' : 'Enable location for weather'}
              </span>
            </div>
          )}
        </div>

        {weather && (
          <div className="flex items-center space-x-2 text-[11px]">
            {weather.rainChance > 30 && (
              <span className="flex items-center space-x-0.5 text-[#8c5836] font-bold">
                <Droplets className="w-3 h-3" />
                <span>{weather.rainChance}%</span>
              </span>
            )}
            <span className="flex items-center space-x-0.5 text-stone-600 font-bold">
              <Wind className="w-3 h-3" />
              <span>{weather.windSpeedKmH}km/h</span>
            </span>
          </div>
        )}
      </div>

      {/* Occasion/Category Pills */}
      <div className="bg-white border border-[#e7e2d9] rounded-2xl p-2.5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-[10px] font-extrabold text-stone-900 uppercase tracking-wider flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-[#8c5836]" />
            <span>Occasion</span>
          </h3>
          <button
            onClick={onManageCategories}
            className="text-[10px] text-[#8c5836] hover:text-[#784a2c] font-bold flex items-center space-x-1"
          >
            <Settings2 className="w-3 h-3" />
            <span>Manage</span>
          </button>
        </div>
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const isSelected = cat.id === selectedCategoryId;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#8c5836] text-white border-[#8c5836] shadow-xs'
                    : 'bg-stone-50 text-stone-700 border-[#e7e2d9] hover:bg-stone-100'
                }`}
              >
                {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
