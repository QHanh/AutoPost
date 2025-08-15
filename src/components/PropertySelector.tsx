import React, { useState, useEffect } from 'react';
import { Property } from '../types/productComponentTypes';
import { ChevronUp, ChevronDown, Plus, X, Check } from 'lucide-react';

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

  // Parse selected properties from JSON string
  let parsedSelectedProperties: any[] = [];
  try {
    parsedSelectedProperties = selectedProperties ? JSON.parse(selectedProperties) : [];
  } catch (e) {
    parsedSelectedProperties = [];
  }

  // Get available properties (those not already selected)
  const selectedPropertyKeys = parsedSelectedProperties.map((prop: any) => prop.key);
  const availableProperties = properties.filter(property => !selectedPropertyKeys.includes(property.key) || property.id === expandedPropertyId);

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

  const handleCheckboxChange = (propertyKey: string, value: string, checked: boolean) => {
    let currentProperties: { key: string, values: string[] }[] = [];
    try {
        currentProperties = selectedProperties ? JSON.parse(selectedProperties) : [];
    } catch (e) {
        currentProperties = [];
    }

    const propExists = currentProperties.some(p => p.key === propertyKey);

    let newProperties;

    if (checked) {
        if (propExists) {
            newProperties = currentProperties.map(prop => {
                if (prop.key === propertyKey) {
                    const newValues = prop.values.includes(value) ? prop.values : [...prop.values, value];
                    return { ...prop, values: newValues };
                }
                return prop;
            });
        } else {
            newProperties = [...currentProperties, { key: propertyKey, values: [value] }];
        }
    } else {
        newProperties = currentProperties
            .map(prop => {
                if (prop.key === propertyKey) {
                    const newValues = prop.values.filter(v => v !== value);
                    return { ...prop, values: newValues };
                }
                return prop;
            })
            .filter(prop => prop.values.length > 0);
    }

    onPropertiesChange(JSON.stringify(newProperties));
  };

  return (
    <div className="space-y-4">
      {/* Selected properties display */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Thuộc tính đã chọn</h4>
        <div className="min-h-[40px]">
          {parsedSelectedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {parsedSelectedProperties.map((property: any, index: number) => (
                <div 
                  key={index}
                  className="border border-blue-200 rounded-lg px-4 py-3 bg-blue-50 flex items-center justify-between"
                >
                  <div className="flex-1">
                    <div className="font-medium text-sm text-blue-900">{property.key}</div>
                    <div className="text-xs text-blue-600 mt-1">
                      {property.values && property.values.length > 0 
                        ? `${property.values.length} giá trị: ${property.values.join(', ')}`
                        : 'Chưa chọn giá trị'
                      }
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedProperties = parsedSelectedProperties.filter((_: any, i: number) => i !== index);
                      onPropertiesChange(JSON.stringify(updatedProperties));
                    }}
                    className="text-blue-400 hover:text-blue-600 ml-3 p-1 rounded-full hover:bg-blue-100 transition-colors"
                    title="Xóa thuộc tính"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
              <p className="text-gray-500 text-sm">Chưa chọn thuộc tính nào</p>
              <p className="text-gray-400 text-xs mt-1">Chọn thuộc tính từ danh sách bên dưới</p>
            </div>
          )}
        </div>
      </div>

      {/* Available properties selection */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Chọn thuộc tính</h4>
        <div className="space-y-3">
          {/* Available properties */}
          {availableProperties.map((property: Property) => (
            <div 
              key={property.id}
              className="border border-gray-200 rounded-lg p-4 bg-white hover:border-blue-300 transition-all duration-200"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-sm text-gray-900">{property.key}</div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      
                      // Kiểm tra xem thuộc tính này đã được chọn chưa
                      const existingPropIndex = parsedSelectedProperties.findIndex((p: any) => p.key === property.key);
                      
                      if (existingPropIndex !== -1) {
                        // Thuộc tính đã tồn tại, cập nhật giá trị
                        const updatedProperties = [...parsedSelectedProperties];
                        updatedProperties[existingPropIndex].values = [...(property.values || [])];
                        onPropertiesChange(JSON.stringify(updatedProperties));
                      } else {
                        // Thuộc tính chưa tồn tại, thêm mới
                        const updatedProperties = [
                          ...parsedSelectedProperties,
                          { key: property.key, values: [...(property.values || [])] }
                        ];
                        onPropertiesChange(JSON.stringify(updatedProperties));
                      }
                    }}
                    className="text-xs bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium flex items-center"
                  >
                    <Check size={14} className="mr-1" />
                    Chọn tất cả
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      togglePropertyExpansion(property.id);
                    }}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    {expandedPropertyId === property.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Property values */}
              {expandedPropertyId === property.id && (
                <div className="border-t border-gray-100 pt-3">
                  {property.values && property.values.length > 0 ? (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-gray-600 mb-2">Chọn giá trị cụ thể:</div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {property.values.map((value: string, index: number) => {
                          // Kiểm tra xem giá trị này có được chọn hay không
                          const isSelected = parsedSelectedProperties.some(
                            (prop: any) => prop.key === property.key && prop.values && prop.values.includes(value)
                          );
                          
                          return (
                            <label 
                              key={index}
                              className="flex items-center p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleCheckboxChange(property.key, value, e.target.checked)}
                                className="mr-2 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="text-sm text-gray-700">{value}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 p-3 text-center bg-gray-50 rounded-md">
                      Thuộc tính này không có giá trị cụ thể
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
              className="w-full text-left text-sm text-blue-600 hover:text-blue-800 py-3 px-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
            >
              <Plus className="inline mr-2 h-4 w-4" />
              Thêm thuộc tính mới
            </button>
          ) : (
            <div className="border-2 border-dashed border-blue-300 rounded-lg p-4 bg-blue-50">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tên thuộc tính</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={newPropertyKey}
                  onChange={(e) => setNewPropertyKey(e.target.value)}
                  placeholder="Nhập tên thuộc tính"
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Giá trị</label>
                {newPropertyValues.map((value, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md mr-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={value}
                      onChange={(e) => handleValueChange(index, e.target.value)}
                      placeholder="Nhập giá trị"
                    />
                    {newPropertyValues.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveValueField(index)}
                        className="text-red-500 hover:text-red-700 px-3 py-2 rounded-md hover:bg-red-50 transition-colors"
                        title="Xóa giá trị"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddNewValueField}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-100 px-3 py-2 rounded-md transition-colors"
                >
                  <Plus className="inline mr-1 h-4 w-4" />
                  Thêm giá trị
                </button>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewPropertyKey('');
                    setNewPropertyValues(['']);
                  }}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleAddNewProperty}
                  className="px-4 py-2 text-sm bg-blue-600 rounded-md text-white hover:bg-blue-700 transition-colors"
                >
                  Thêm thuộc tính
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
