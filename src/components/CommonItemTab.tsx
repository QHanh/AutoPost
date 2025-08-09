import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Edit, Search, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import {
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    closestCenter,
    useDraggable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { productComponentService } from '../services/productComponentService';
import { CommonItem, CommonItemCreate, FlattenedCommonItem } from '../types/commonComponentTypes';
import { Property } from '../types/productComponentTypes';

interface CommonItemWithChildren extends CommonItem {
  children: CommonItemWithChildren[];
}

type ItemType = 'category' | 'property';

interface CommonItemTabProps {
  isAuthenticated: boolean;
  itemType: ItemType;
  title: string;
}

const buildItemTree = (items: CommonItem[], parentId: string | null = null): CommonItemWithChildren[] => {
    return items
        .filter(item => item.parent_id === parentId)
        .map(item => ({
            ...item,
            children: buildItemTree(items, item.id)
        }));
};

const flattenTree = (tree: CommonItemWithChildren[], level = 0): FlattenedCommonItem[] => {
    return tree.reduce<FlattenedCommonItem[]>((acc, node) => {
        return [...acc, { ...node, level }, ...flattenTree(node.children, level + 1)];
    }, []);
};

const INDENTATION_WIDTH = 24;

const DraggableItemNode: React.FC<{
  node: FlattenedCommonItem;
  onEdit: (item: CommonItem) => void;
  onDelete: (id: string) => void;
  onAdd: (parentId: string) => void;
  isOverlay?: boolean;
  isDragging?: boolean;
  isCollapsed: boolean;
  onCollapse: () => void;
  itemType: ItemType;
}> = ({ node, onEdit, onDelete, onAdd, isOverlay, isDragging, isCollapsed, onCollapse, itemType }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: node.id,
        data: { type: 'item' },
    });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    return (
        <div ref={setNodeRef} style={style} className={`relative group ${isDragging ? 'opacity-50' : ''}`}>
             <div
                className={`flex items-center justify-between p-2 rounded-md ${isOverlay ? 'bg-white shadow-lg' : 'hover:bg-gray-50'}`}
                style={{ paddingLeft: `${node.level * INDENTATION_WIDTH}px` }}
            >
                <div className="flex items-center flex-grow">
                    <div {...listeners} {...attributes} className="p-1 cursor-grab touch-none mr-2">
                        <GripVertical size={16} className="text-gray-400" />
                    </div>
                    {node.children && node.children.length > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); onCollapse(); }} className="mr-2 p-1 rounded-full hover:bg-gray-200">
                            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                    <span className="text-sm font-medium text-gray-800">{node.name}{itemType === 'property' && node.values && node.values.length > 0 ? `: ${node.values.join(', ')}` : ''}</span>
                </div>
                {!isOverlay && (
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => onAdd(node.id)} className="text-green-600 hover:text-green-900 p-1" title="Thêm danh mục con"><Plus size={16} /></button>
                        <button onClick={() => onEdit(node)} className="text-indigo-600 hover:text-indigo-900 p-1"><Edit size={16} /></button>
                        <button onClick={() => onDelete(node.id)} className="text-red-600 hover:text-red-900 p-1"><Trash2 size={16} /></button>
                    </div>
                )}
            </div>
        </div>
    );
};

const CommonItemTab: React.FC<CommonItemTabProps> = ({ isAuthenticated, itemType, title }) => {
  const [items, setItems] = useState<CommonItem[]>([]);
  const [flattenedItems, setFlattenedItems] = useState<FlattenedCommonItem[]>([]);
  const [collapsedItems, setCollapsedItems] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CommonItem | null>(null);
  const [formData, setFormData] = useState<CommonItemCreate>({ name: '' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const fetchItems = async () => {
    try {
      if (itemType === 'category') {
        const categories = await productComponentService.getAllCategories(0, 1000);
        setItems(categories);
      } else {
        const properties = await productComponentService.getAllProperties(0, 1000);
        // Convert properties to common items
        const commonItems: CommonItem[] = properties.map((prop: Property) => ({
          id: prop.id,
          name: prop.key, // Use key as name for properties
          parent_id: prop.parent_id,
          created_at: prop.created_at,
          updated_at: prop.updated_at,
          values: prop.values // Include values field for properties
        }));
        setItems(commonItems);
      }
    } catch (error) {
      console.error(`Error fetching ${itemType}s:`, error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [itemType]);

  useEffect(() => {
    const tree = buildItemTree(items);
    const flattened = flattenTree(tree);
    setFlattenedItems(flattened);
  }, [items]);

  const isVisible = (node: FlattenedCommonItem): boolean => {
    if (node.level === 0) return true;
    
    let parentId = node.parent_id;
    while (parentId) {
      if (collapsedItems.has(parentId)) return false;
      const parent = items.find(item => item.id === parentId);
      if (!parent) break;
      parentId = parent.parent_id;
    }
    return true;
  };

  const filteredItems = useMemo(() => {
    if (!searchTerm) return flattenedItems;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return flattenedItems.filter(item => 
      item.name.toLowerCase().includes(lowerSearchTerm)
    );
  }, [flattenedItems, searchTerm]);

  const visibleItems = useMemo(() => {
    return filteredItems.filter(item => isVisible(item));
  }, [filteredItems, collapsedItems]);

  const handleOpenModal = (item?: CommonItem, parentId?: string | null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name,
        values: item.values || [],
        parent_id: item.parent_id
      });
    } else {
      setEditingItem(null);
      setFormData({
        name: '',
        parent_id: parentId || undefined
      });
    }
    
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ name: '', values: [] });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Tên là bắt buộc';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveItem = async () => {
    if (!validateForm()) return;
    
    try {
      if (editingItem) {
        // Update existing item
        const updateData = {
          name: formData.name,
          parent_id: formData.parent_id
        };
        
        if (itemType === 'category') {
          await productComponentService.updateCategory(editingItem.id, updateData);
        } else {
          // For properties, we need to convert name back to key and include values
          const propertyUpdateData = {
            key: updateData.name,
            values: formData.values,
            parent_id: formData.parent_id
          };
          await productComponentService.updateProperty(editingItem.id, propertyUpdateData);
        }
      } else {
        // Create new item
        if (itemType === 'category') {
          await productComponentService.createCategory(formData as any);
        } else {
          // For properties, we need to convert name to key and include values
          const propertyCreateData = {
            key: formData.name,
            values: formData.values,
            parent_id: formData.parent_id
          };
          await productComponentService.createProperty(propertyCreateData as any);
        }
      }
      
      await fetchItems();
      handleCloseModal();
    } catch (error) {
      console.error(`Error saving ${itemType}:`, error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${itemType} này?`)) return;
    
    try {
      if (itemType === 'category') {
        await productComponentService.deleteCategory(id);
      } else {
        await productComponentService.deleteProperty(id);
      }
      
      await fetchItems();
    } catch (error) {
      console.error(`Error deleting ${itemType}:`, error);
    }
  };

  const handleToggleCollapse = (itemId: string) => {
    setCollapsedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    
    if (!over || active.id === over.id) return;
    
    const activeItem = flattenedItems.find(item => item.id === active.id);
    const overItem = flattenedItems.find(item => item.id === over.id);
    
    if (!activeItem || !overItem) return;
    
    // Calculate new parent_id based on drop position
    try {
      const updateData = {
        parent_id: overItem.parent_id
      };
      
      if (itemType === 'category') {
        await productComponentService.updateCategory(activeItem.id, updateData);
      } else {
        await productComponentService.updateProperty(activeItem.id, updateData);
      }
      
      await fetchItems();
    } catch (error) {
      console.error(`Error updating ${itemType} position:`, error);
    }
  };

  const activeNode = activeId ? flattenedItems.find(item => item.id === activeId) : null;

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          {isAuthenticated && (
            <button
              onClick={() => handleOpenModal()}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus size={18} className="mr-2" />
              Thêm {itemType === 'category' ? 'Danh Mục' : 'Thuộc Tính'}
            </button>
          )}
        </div>
        
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={18} />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {visibleItems.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có dữ liệu</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {visibleItems.map((item) => (
                <DraggableItemNode
                  key={item.id}
                  node={item}
                  onEdit={(item) => handleOpenModal(item)}
                  onDelete={handleDeleteItem}
                  onAdd={(parentId) => handleOpenModal(undefined, parentId)}
                  isCollapsed={collapsedItems.has(item.id)}
                  onCollapse={() => handleToggleCollapse(item.id)}
                  itemType={itemType}
                />
              ))}
            </div>
          )}
        </div>
        <DragOverlay>
          {activeNode ? (
            <DraggableItemNode
              node={activeNode}
              onEdit={() => {}}
              onDelete={() => {}}
              onAdd={() => {}}
              isOverlay
              isCollapsed={false}
              onCollapse={() => {}}
              itemType={itemType}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingItem ? `Cập nhật ${itemType === 'category' ? 'Danh Mục' : 'Thuộc Tính'}` : `Thêm ${itemType === 'category' ? 'Danh Mục' : 'Thuộc Tính'}`}
              </h3>
            </div>
            <div className="px-6 py-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên *
                </label>
                <input
                  type="text"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${formErrors.name ? 'border-red-500' : 'border-gray-300'}`}
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
                {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
              </div>
              
              {itemType === 'property' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Giá trị
                  </label>
                  {(formData.values || ['']).map((value, index) => (
                    <div key={index} className="flex mb-2">
                      <input
                        type="text"
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={value || ''}
                        onChange={(e) => {
                          const newValues = [...(formData.values || [''])];
                          newValues[index] = e.target.value;
                          setFormData({...formData, values: newValues});
                        }}
                        placeholder={`Giá trị ${index + 1}`}
                      />
                      <button
                        type="button"
                        className="ml-2 px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                        onClick={() => {
                          const newValues = [...(formData.values || [''])];
                          newValues.splice(index, 1);
                          setFormData({...formData, values: newValues});
                        }}
                      >
                        Xóa
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                    onClick={() => {
                      const newValues = [...(formData.values || []), ''];
                      setFormData({...formData, values: newValues});
                    }}
                  >
                    Thêm giá trị
                  </button>
                </div>
              )}
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {itemType === 'category' ? 'Danh Mục Cha' : 'Thuộc Tính Cha'}
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.parent_id ?? ''}
                  onChange={(e) => setFormData({...formData, parent_id: e.target.value === '' ? undefined : e.target.value})}
                >
                  <option value="">Không có</option>
                  {items
                    .filter(i => !editingItem || i.id !== editingItem.id)
                    .map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveItem}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonItemTab;
