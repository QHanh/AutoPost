import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

// Custom hook to manage debounce
const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

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

export const SearchableSelectComponent: React.FC<SearchableSelectProps> = ({
    options,
    value,
    onChange,
    placeholder,
    creatable = false,
    onDelete,
    onEdit,
    onSearch
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [internalOptions, setInternalOptions] = useState(options);
    const [isLoading, setIsLoading] = useState(false);
    const [lastSearchTerm, setLastSearchTerm] = useState('');
    const selectRef = useRef<HTMLDivElement>(null);

    const debouncedSearchTerm = useDebounce(inputValue, 500);
    const selectedOption = options.find(option => option.id === value);

    // Effect to sync inputValue with the selected value name when not open
    useEffect(() => {
        if (!isOpen) {
            setInputValue(selectedOption?.name || (creatable && value ? value : ''));
        }
    }, [value, selectedOption, isOpen, creatable]);

    // Effect for API search
    useEffect(() => {
        if (!onSearch || !isOpen) {
            return;
        }

        if (debouncedSearchTerm.trim() === '') {
            setInternalOptions(options);
            setIsLoading(false);
            return;
        }
        
        if (selectedOption && debouncedSearchTerm === selectedOption.name) {
            setIsLoading(false);
            return;
        }
        
        // Nếu giá trị tìm kiếm không thay đổi, không gọi API
        if (lastSearchTerm === debouncedSearchTerm) {
            return;
        }

        // Tránh gọi API khi đang loading
        if (isLoading) {
            return;
        }
        
        // Cập nhật giá trị tìm kiếm cuối cùng
        setLastSearchTerm(debouncedSearchTerm);

        setIsLoading(true);
        onSearch(debouncedSearchTerm)
            .then(newOptions => {
                setInternalOptions(newOptions);
                setIsOpen(true); // Đảm bảo dropdown vẫn mở sau khi tìm kiếm hoàn tất
            })
            .catch(error => {
                console.error("Failed to search:", error);
                setInternalOptions([]);
                setIsOpen(true); // Đảm bảo dropdown vẫn mở ngay cả khi có lỗi
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [debouncedSearchTerm, isOpen, onSearch, options, selectedOption, isLoading]);

    // Effect to handle clicks outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // Chỉ đóng dropdown khi click bên ngoài component và không phải đang loading
            if (selectRef.current && !selectRef.current.contains(event.target as Node) && !isLoading) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isLoading]);

    const handleOptionSelect = (option: { id: string, name: string }) => {
        onChange(option.id);
        setInputValue(option.name);
        setIsOpen(false);
    };

    const handleCreateOption = (name: string) => {
        if (!creatable) return;
        onChange(name);
        setInputValue(name);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        
        // Nếu giá trị nhập vào thay đổi, đánh dấu để cần tìm kiếm lại
        if (newValue.trim() !== lastSearchTerm.trim()) {
            // Reset lastSearchTerm khi người dùng thay đổi input
            // Điều này sẽ cho phép useEffect gọi API khi debouncedSearchTerm thay đổi
            setLastSearchTerm('');
        }
        
        setIsOpen(true); // Luôn mở dropdown khi người dùng nhập
    };

    const handleInputFocus = () => {
        setIsOpen(true);
    };
    
    const handleInputClick = (e: React.MouseEvent) => {
        // Luôn mở dropdown khi click vào input, bất kể trạng thái hiện tại
        setIsOpen(true);
        
        // Ngăn chặn sự kiện click lan truyền để tránh đóng dropdown
        e.stopPropagation();
    };

    const filteredOptions = onSearch
        ? internalOptions
        : options.filter(option =>
            option.name.toLowerCase().includes(inputValue.toLowerCase())
        );

    const showCreateOption = creatable && inputValue && !filteredOptions.some(o => o.name.toLowerCase() === inputValue.toLowerCase());
    const displayValue = selectedOption?.name || (creatable && value ? value : '');

    if (!creatable) {
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
                    <div 
                        className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <input
                            type="text"
                            className="w-full p-2 border-b border-gray-200"
                            placeholder="Search..."
                            value={inputValue}
                            onChange={handleInputChange}
                            onClick={(e) => handleInputClick(e)}
                            autoFocus
                        />
                        <ul>
                            {isLoading ? (
                                <li className="p-2 text-gray-500">Searching...</li>
                            ) : filteredOptions.length > 0 ? (
                                filteredOptions.map(option => (
                                    <li
                                        key={option.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                        onMouseDown={() => handleOptionSelect(option)}
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
                                                    title="Edit"
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
                                                    title="Delete"
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
    }

    return (
        <div className="relative" ref={selectRef}>
            <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder={placeholder}
                value={inputValue}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onClick={(e) => handleInputClick(e)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && showCreateOption) {
                        e.preventDefault();
                        handleCreateOption(inputValue);
                    }
                }}
            />
            {isOpen && (
                <div 
                    className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    <ul>
                        {isLoading ? (
                            <li className="p-2 text-gray-500">Searching...</li>
                        ) : (
                            <>
                                {filteredOptions.map(option => (
                                    <li
                                        key={option.id}
                                        className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                                        onMouseDown={() => handleOptionSelect(option)}
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
                                                    title="Edit"
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
                                                    title="Delete"
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
                                        Create "{inputValue}"
                                    </li>
                                )}
                                {!showCreateOption && filteredOptions.length === 0 && (
                                     <li className="p-2 text-gray-500">No options</li>
                                )}
                            </>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default SearchableSelectComponent;