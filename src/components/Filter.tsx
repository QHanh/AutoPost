import React, { useState, useEffect } from 'react';
import { Filter as FilterIcon, X } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: 'select' | 'range-number';
  options?: FilterOption[];
}

interface FilterProps {
  config: FilterConfig[];
  onFilterChange: (filters: { [key: string]: any }) => void;
}

const Filter: React.FC<FilterProps> = ({ config, onFilterChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ [key: string]: any }>({});

  // Debug config changes
  useEffect(() => {
    console.log('Filter component received new config:', config);
    console.log('Config property_value options:', config.find(c => c.key === 'property_value')?.options);
  }, [config]);

  // Don't reset activeFilters when config changes to prevent dropdown from closing
  useEffect(() => {
    console.log('Filter config changed, but keeping activeFilters to prevent dropdown from closing');
    console.log('Current activeFilters:', activeFilters);
    console.log('New config:', config);
    console.log('Config property_value options length:', config.find(c => c.key === 'property_value')?.options?.length || 0);
    // Only reset if config is completely different (not just property_value options)
    // This prevents the dropdown from closing when user selects property_key
  }, [config]);

  const handleFilterChange = (filterKey: string, value: any, subKey?: 'min' | 'max') => {
    console.log(`Filter change: ${filterKey} = ${value} (subKey: ${subKey})`);
    console.log('Current activeFilters before change:', activeFilters);
    setActiveFilters(prev => {
      const newFilters = { ...prev };
      if (subKey) {
        // Handle range inputs
        const range = { ...(newFilters[filterKey] || {}) };
        if (value === '') {
          delete range[subKey];
        } else {
          range[subKey] = value;
        }
        if (Object.keys(range).length === 0) {
          delete newFilters[filterKey];
        } else {
          newFilters[filterKey] = range;
        }
      } else {
        // Handle select inputs
        if (value === '') {
          delete newFilters[filterKey];
        } else {
          newFilters[filterKey] = value;
        }
      }
      console.log('New active filters:', newFilters);
      
      // Don't call onFilterChange immediately when property_key changes
      // This prevents page reload every time user selects a property
      // User must click "Apply" button to actually apply the filters
      if (filterKey === 'property_key') {
        console.log('Property key changed but NOT calling onFilterChange immediately to prevent page reload');
        console.log('User must click Apply button to apply filters');
      }
      
      return newFilters;
    });
  };

  const applyFilters = () => {
    // Flatten the filters for the API call
    const flattenedFilters: { [key: string]: string } = {};
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if (value.min) flattenedFilters[`${key}_min`] = value.min;
        if (value.max) flattenedFilters[`${key}_max`] = value.max;
      } else {
        flattenedFilters[key] = value;
      }
    });
    console.log('=== APPLYING FILTERS ===');
    console.log('Active filters before applying:', activeFilters);
    console.log('Flattened filters:', flattenedFilters);
    console.log('Calling onFilterChange from applyFilters');
    onFilterChange(flattenedFilters);
    console.log('=== END APPLYING FILTERS ===');
    setIsOpen(false);
  };

  const resetFilters = () => {
    console.log('=== RESETTING FILTERS ===');
    console.log('Active filters before reset:', activeFilters);
    setActiveFilters({});
    console.log('Calling onFilterChange from resetFilters');
    onFilterChange({});
    console.log('=== END RESETTING FILTERS ===');
  };

  const getActiveFilterCount = () => {
    const count = Object.values(activeFilters).reduce((count, value) => {
        if (typeof value === 'object' && value !== null) {
            return count + (value.min ? 1 : 0) + (value.max ? 1 : 0);
        }
        return count + 1;
    }, 0);
    console.log('Active filter count:', count, 'Filters:', activeFilters);
    return count;
  };

  return (
    <div className="relative">
      {console.log('Filter component rendering with config:', config)}
      {console.log('Filter component rendering with activeFilters:', activeFilters)}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
      >
        <FilterIcon className="mr-2" size={18} />
        Bộ lọc
        {getActiveFilterCount() > 0 && (
          <span className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            {getActiveFilterCount()}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute z-10 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          {console.log('Filter dropdown is open, rendering with config:', config)}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Bộ lọc</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-gray-700">
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {console.log('Rendering filter config:', config)}
            {config.map(item => (
              <div key={item.key}>
                <label className="block text-sm font-medium text-gray-700 capitalize">
                  {item.label}
                </label>
                {item.type === 'select' && (
                  <div>
                    {console.log(`Rendering select for ${item.key}:`, item.options)}
                    {console.log(`Active filter for ${item.key}:`, activeFilters[item.key])}
                    <select
                      value={activeFilters[item.key] || ''}
                      onChange={(e) => handleFilterChange(item.key, e.target.value)}
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="">
                        {!Array.isArray(item.options) || item.options.length === 0 
                          ? 'Vui lòng chọn thuộc tính trước' 
                          : 'Tất cả'
                        }
                      </option>
                      {Array.isArray(item.options) && item.options.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    {!Array.isArray(item.options) || item.options.length === 0 ? (
                      <p className="mt-1 text-xs text-gray-500">
                        Vui lòng chọn một thuộc tính trước để xem các giá trị
                      </p>
                    ) : null}
                  </div>
                )}
                {item.type === 'range-number' && (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={activeFilters[item.key]?.min || ''}
                      onChange={(e) => handleFilterChange(item.key, e.target.value, 'min')}
                      className="w-1/2 block pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={activeFilters[item.key]?.max || ''}
                      onChange={(e) => handleFilterChange(item.key, e.target.value, 'max')}
                      className="w-1/2 block pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Reset
            </button>
            <button
              onClick={applyFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Filter; 