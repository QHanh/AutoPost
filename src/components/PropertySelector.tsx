import React, { useState, useEffect } from 'react';
import { Property } from '../types/productComponentTypes';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface PropertySelectorProps {
  properties: Property[];
  selectedProperties: string; // JSON string of selected properties
  onPropertiesChange: (properties: string) => void;
  onAddNewProperty: (key: string, values: string[]) => void;
}

const PropertySelector: React.FC<PropertySelectorProps> = (props) => {
  const {
    properties,
    selectedProperties,
    onPropertiesChange,
    onAddNewProperty
  } = props;
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newPropertyKey, setNewPropertyKey] = useState('');
  const [newPropertyValues, setNewPropertyValues] = useState(['']);
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);
  const [internalSelectedValues, setInternalSelectedValues] = useState<Record<string, string[]>>({});

  // Parse selected properties from JSON string
  let parsedSelectedProperties: any[] = [];
  try {
    parsedSelectedProperties = selectedProperties ? JSON.parse(selectedProperties) : [];
  } catch (e) {
    parsedSelectedProperties = [];
  }

  // Get available properties (those not already selected)
  const selectedPropertyKeys = parsedSelectedProperties.map((prop: any) => prop.key);
  const availableProperties = properties.filter(property => !selectedPropertyKeys.includes(property.key));

  // Update internalSelectedValues when selectedProperties prop changes
  useEffect(() => {
    const newSelectedValues: Record<string, string[]> = {};
    parsedSelectedProperties.forEach((prop: any) => {
      if (prop.values) {
        newSelectedValues[prop.key] = prop.values;
      }
    });
    setInternalSelectedValues(newSelectedValues);
  }, [selectedProperties]);

  const handleAddNewValueField = () => {
    setNewPropertyValues([...newPropertyValues, '']);
  };

  const handleRemoveValueField = (index: number) => {
    if (newPropertyValues.length > 1) {
      const newValues = [...newPropertyValues];
      newValues.splice(index, 1);
      setNewPropertyValues(newValues);
    }
  };

  const handleValueChange = (index: number, value: string) => {
    const newValues = [...newPropertyValues];
    newValues[index] = value;
    setNewPropertyValues(newValues);
  };

  const handleAddNewProperty = () => {
    if (newPropertyKey.trim() && newPropertyValues.some(v => v.trim())) {
      const validValues = newPropertyValues.filter(v => v.trim());
      onAddNewProperty(newPropertyKey, validValues);
      setNewPropertyKey('');
      setNewPropertyValues(['']);
      setIsAddingNew(false);
    }
  };

  const togglePropertyExpansion = (propertyId: string) => {
    setExpandedPropertyId(expandedPropertyId === propertyId ? null : propertyId);
  };

  const handleValueSelect = (propertyKey: string, value: string) => {
    // Cập nhật internal state
    const currentValues = internalSelectedValues[propertyKey] || [];
    let newValues;
    
    if (currentValues.includes(value)) {
      // Nếu giá trị đã được chọn, bỏ chọn nó
      newValues = currentValues.filter(v => v !== value);
    } else {
      // Nếu giá trị chưa được chọn, thêm vào
      newValues = [...currentValues, value];
    }
    
    const newSelectedValues = {
      ...internalSelectedValues,
      [propertyKey]: newValues
    };
    
    setInternalSelectedValues(newSelectedValues);
    
    // Update the properties JSON string
    const updatedProperties = [...parsedSelectedProperties];
    const propIndex = updatedProperties.findIndex((p: any) => p.key === propertyKey);
    if (propIndex !== -1) {
      updatedProperties[propIndex].values = newValues;
    } else {
      updatedProperties.push({ key: propertyKey, values: newValues });
    }
    onPropertiesChange(JSON.stringify(updatedProperties));
  };

  return (
    <div className="border border-gray-300 rounded-md p-3 bg-white">
      <div className="mb-2">
        <h3 className="text-sm font-medium text-gray-700">Thuộc tính</h3>
      </div>
      
      {/* Selected properties */}
      <div className="mb-3 min-h-[40px]">
        {parsedSelectedProperties.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {parsedSelectedProperties.map((property: any, index: number) => (
              <div 
                key={index}
                className="border border-gray-300 rounded-md px-3 py-2 bg-gray-50 flex items-center justify-between w-full"
              >
                <div>
                  <div className="font-medium text-sm">{property.key}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {property.values ? property.values.join(', ') : 'N/A'}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updatedProperties = parsedSelectedProperties.filter((_: any, i: number) => i !== index);
                    onPropertiesChange(JSON.stringify(updatedProperties));
                  }}
                  className="text-gray-400 hover:text-gray-600 ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm italic">Chưa chọn thuộc tính nào</p>
        )}
      </div>

      {/* Property selection */}
      <div className="border border-dashed border-gray-300 rounded-md p-3 bg-gray-50">
        <div className="space-y-2">
          {/* Available properties */}
          {availableProperties.map((property: Property) => (
            <div 
              key={property.id}
              className="border border-gray-200 rounded-md p-2 bg-white hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{property.key}</div>
                <div className="flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Add property to selected properties
                      const updatedProperties = [
                        ...parsedSelectedProperties,
                        { key: property.key, values: property.values || [] }
                      ];
                      onPropertiesChange(JSON.stringify(updatedProperties));
                      
                      // Nếu thuộc tính có giá trị, chọn tất cả
                      if (property.values && property.values.length > 0) {
                        // Cập nhật internal state với tất cả giá trị
                        const newSelectedValues = {
                          ...internalSelectedValues,
                          [property.key]: [...property.values]
                        };
                        
                        setInternalSelectedValues(newSelectedValues);
                      }
                    }}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 mr-2"
                  >
                    Chọn
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePropertyExpansion(property.id);
                    }}
                  >
                    {expandedPropertyId === property.id ? (
                      <ChevronUp className="h-4 w-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Property values */}
              {expandedPropertyId === property.id && (
                <div className="mt-2 border-t border-gray-100 pt-2">
                  {property.values && property.values.length > 0 ? (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {property.values.map((value: string, index: number) => (
                        <div 
                          key={index}
                          className="flex items-center p-1 hover:bg-gray-50 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleValueSelect(property.key, value);
                          }}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={internalSelectedValues[property.key]?.includes(value) || false}
                              onChange={() => {}}
                              className="mr-2"
                            />
                            <span className="text-sm">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 p-2">
                      Không có giá trị nào
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {/* Add new property section */}
          {!isAddingNew ? (
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full text-left text-sm text-blue-600 hover:text-blue-800 py-2"
            >
              + Thêm thuộc tính mới
            </button>
          ) : (
            <div className="border-t border-gray-200 pt-3 mt-2">
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Tên thuộc tính</label>
                <input
                  type="text"
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                  value={newPropertyKey}
                  onChange={(e) => setNewPropertyKey(e.target.value)}
                  placeholder="Nhập tên thuộc tính"
                />
              </div>
              
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Giá trị</label>
                {newPropertyValues.map((value, index) => (
                  <div key={index} className="flex mb-1">
                    <input
                      type="text"
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md mr-1"
                      value={value}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      placeholder="Nhập giá trị"
                    />
                    {newPropertyValues.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveValueField(index)}
                        className="text-red-500 hover:text-red-700 px-2"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddNewValueField}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  + Thêm giá trị
                </button>
              </div>
              
              <div className="flex justify-end space-x-2 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewPropertyKey('');
                    setNewPropertyValues(['']);
                  }}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddNewProperty}
                  className="px-3 py-1 text-sm bg-blue-600 rounded-md text-white hover:bg-blue-700"
                >
                  Thêm
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertySelector;
