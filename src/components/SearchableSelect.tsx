import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface SearchableSelectProps {
    options: { id: string; name: string }[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    creatable?: boolean;
    onEdit?: (id: string, name: string) => void;
    onDelete?: (id: string) => void;
    onSearch?: (term: string) => Promise<{ id: string, name: string }[]>;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({ options, value, onChange, placeholder, creatable = false, onDelete, onEdit, onSearch }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [internalOptions, setInternalOptions] = useState(options);
    const [isLoading, setIsLoading] = useState(false);
    const selectRef = useRef<HTMLDivElement>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setInternalOptions(options);
    }, [options]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSearch = (term: string) => {
        if (!onSearch) return;
        
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        setSearchTerm(term);
        setIsLoading(true);

        debounceTimeoutRef.current = setTimeout(async () => {
            try {
                const newOptions = await onSearch(term);
                setInternalOptions(newOptions);
            } catch (error) {
                console.error("Failed to search:", error);
                setInternalOptions([]);
            } finally {
                setIsLoading(false);
            }
        }, 300); // 300ms debounce
    };

    // Handling for creatable select
    const [inputValue, setInputValue] = useState('');
    useEffect(() => {
        if (!creatable) return;
        const selectedOption = options.find(option => option.id === value);
        if (selectedOption) {
            setInputValue(selectedOption.name);
        } else if (creatable) {
            setInputValue(value);
        } else {
            setInputValue('');
        }
    }, [value, options, creatable]);
    
    const showCreateOption = creatable && inputValue && !internalOptions.some(o => o.name.toLowerCase() === inputValue.toLowerCase());

    useEffect(() => {
        if (!creatable) return;
        const handleClickOutside = (event: MouseEvent) => {
            if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                if (creatable && showCreateOption) {
                    onChange(inputValue);
                } else {
                    const selectedOption = internalOptions.find(option => option.id === value);
                    if (selectedOption) {
                        setInputValue(selectedOption.name);
                    } else if (creatable) {
                        setInputValue(value);
                    } else {
                        setInputValue('');
                    }
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [selectRef, inputValue, value, creatable, onChange, internalOptions, showCreateOption]);

    const handleSelectOption = (option: { id: string, name: string }) => {
        onChange(option.id);
        if (creatable) {
            setInputValue(option.name);
        }
        setIsOpen(false);
    };
    
    const handleCreateOption = (newValue: string) => {
        if (!creatable) return;
        onChange(newValue);
        setInputValue(newValue);
        setIsOpen(false);
    };
    // End of creatable select handling


    const handleSelect = (optionId: string) => {
        onChange(optionId);
        setIsOpen(false);
        setSearchTerm('');
    };

    const filteredOptions = onSearch 
        ? internalOptions 
        : options.filter(option =>
            option.name.toLowerCase().includes((creatable ? inputValue : searchTerm).toLowerCase())
        );
    
    const selectedOption = internalOptions.find(option => option.id === value);

    if (creatable) {
        return (
            <div className="relative" ref={selectRef}>
                <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder={placeholder}
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        if (onSearch) {
                            handleSearch(e.target.value);
                        }
                    }}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && showCreateOption) {
                            e.preventDefault();
                            handleCreateOption(inputValue);
                        }
                    }}
                />
                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        <ul>
                            {isLoading ? (
                                <li className="p-2 text-gray-500">Đang tìm kiếm...</li>
                            ) : (
                                <>
                                    {filteredOptions.map(option => (
                                        <li
                                            key={option.id}
                                            className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                            onMouseDown={(e) => {
                                                if (e.target instanceof HTMLElement && e.target.closest('.control-btn')) {
                                                  return; 
                                                }
                                                handleSelectOption(option);
                                            }}
                                        >
                                            <span>{option.name}</span>
                                            <div className="flex items-center">
                                                {onEdit && (
                                                    <button
                                                        className="control-btn p-1 text-blue-500 hover:text-blue-700"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEdit(option.id, option.name);
                                                            setIsOpen(false);
                                                        }}
                                                        title="Sửa"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        className="control-btn p-1 text-red-500 hover:text-red-700"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(option.id);
                                                            setIsOpen(false);
                                                        }}
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                    {showCreateOption && (
                                        <li
                                            className="p-2 hover:bg-gray-100 cursor-pointer"
                                            onMouseDown={() => handleCreateOption(inputValue)}
                                        >
                                            Tạo mới "{inputValue}"
                                        </li>
                                    )}
                                    {!showCreateOption && filteredOptions.length === 0 && (
                                         <li className="p-2 text-gray-500">Không có lựa chọn</li>
                                    )}
                                </>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="relative" ref={selectRef}>
            <div
                className="w-full p-2 border rounded-md bg-white cursor-pointer flex justify-between items-center"
                onClick={() => setIsOpen(!isOpen)}
            >
                {selectedOption ? selectedOption.name : <span className="text-gray-500">{placeholder || 'Select...'}</span>}
                <svg className={`w-4 h-4 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </div>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    <input
                        type="text"
                        className="w-full p-2 border-b"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => onSearch ? handleSearch(e.target.value) : setSearchTerm(e.target.value)}
                        autoFocus
                    />
                    <ul>
                        {isLoading ? (
                             <li className="p-2 text-gray-500">Đang tìm kiếm...</li>
                        ) : filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <li
                                    key={option.id}
                                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                    onClick={(e) => {
                                      if (e.target instanceof HTMLElement && e.target.closest('.control-btn')) {
                                        return; 
                                      }
                                      handleSelect(option.id);
                                    }}
                                >
                                    <span>{option.name}</span>
                                    <div className="flex items-center">
                                        {onEdit && (
                                            <button
                                                className="control-btn p-1 text-blue-500 hover:text-blue-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(option.id, option.name);
                                                    setIsOpen(false);
                                                }}
                                                title="Sửa"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                        )}
                                        {onDelete && (
                                            <button
                                                className="control-btn p-1 text-red-500 hover:text-red-700"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(option.id);
                                                    setIsOpen(false);
                                                }}
                                                title="Xóa"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))
                        ) : (
                            <li className="p-2 text-gray-500">No options found</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
}; 