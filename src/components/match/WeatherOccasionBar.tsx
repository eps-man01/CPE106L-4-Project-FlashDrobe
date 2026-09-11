import React from 'react';
import { Sun, CloudRain, Cloud, Wind, Droplets, Settings2, Sparkles } from 'lucide-react';
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
    <div className="space-y-2.5">
      {/* Weather Mini Display */}
      <div
        className="rounded-2xl p-3 md-elevation-1 flex items-center justify-between"
        style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="p-1.5 rounded-xl"
            style={{ backgroundColor: 'var(--md-primary-container)', color: 'var(--md-on-primary-container)' }}
          >
            <WeatherIcon className="w-4 h-4" />
          </div>
          {weather ? (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold" style={{ color: 'var(--md-on-surface)' }}>{weather.tempC}°C</span>
                <span className="text-[10px] font-bold" style={{ color: 'var(--md-on-surface-variant)' }}>Feels {weather.feelsLikeC}°C</span>
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--md-on-surface-variant)' }}>
                {weather.condition} in {weather.city}
              </span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-bold block" style={{ color: 'var(--md-on-surface)' }}>
                {isWeatherLoading ? 'Fetching weather...' : 'No weather data'}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--md-on-surface-variant)' }}>
                {isWeatherLoading ? 'Getting GPS location' : 'Enable location for weather'}
              </span>
            </div>
          )}
        </div>

        {weather && (
          <div className="flex items-center gap-2 text-[11px]">
            {weather.rainChance > 30 && (
              <span className="flex items-center gap-0.5 font-bold" style={{ color: 'var(--md-primary)' }}>
                <Droplets className="w-3 h-3" />
                <span>{weather.rainChance}%</span>
              </span>
            )}
            <span className="flex items-center gap-0.5 font-bold" style={{ color: 'var(--md-on-surface-variant)' }}>
              <Wind className="w-3 h-3" />
              <span>{weather.windSpeedKmH}km/h</span>
            </span>
          </div>
        )}
      </div>

      {/* Occasion/Category Chips */}
      <div
        className="rounded-2xl p-2.5 md-elevation-1"
        style={{ backgroundColor: 'var(--md-surface-container-lowest)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3
            className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
            style={{ color: 'var(--md-on-surface)' }}
          >
            <Sparkles className="w-3 h-3" style={{ color: 'var(--md-primary)' }} />
            <span>Occasion</span>
          </h3>
          <button
            onClick={onManageCategories}
            className="text-[10px] font-bold flex items-center gap-1 transition-colors"
            style={{ color: 'var(--md-primary)' }}
          >
            <Settings2 className="w-3 h-3" />
            <span>Manage</span>
          </button>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => {
            const isSelected = cat.id === selectedCategoryId;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all"
                style={{
                  backgroundColor: isSelected ? 'var(--md-primary)' : 'var(--md-surface-container)',
                  color: isSelected ? 'var(--md-on-primary)' : 'var(--md-on-surface-variant)',
                }}
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
