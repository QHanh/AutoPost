import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

const DEBUG = true;
const log = (...args: any[]) => DEBUG && console.log('[SearchableSelect]', ...args);
const warn = (...args: any[]) => DEBUG && console.warn('[SearchableSelect]', ...args);

const useDebounce = (value: string, delay: number) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => {
      log('debounce -> set', value);
      setDebounced(value);
    }, delay);
    return () => {
      log('debounce -> clear for', value);
      clearTimeout(t);
    };
  }, [value, delay]);
  return debounced;
};

interface SearchableSelectProps {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  creatable?: boolean;
  onEdit?: (id: string, name: string) => void;
  onDelete?: (id: string) => void;
  onSearch?: (term: string) => Promise<{ id: string; name: string }[]>;
  alwaysOpen?: boolean;
}

const SearchableSelectComponentInner: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder,
  creatable = false,
  onDelete,
  onEdit,
  onSearch,
  alwaysOpen = false
}) => {
  useEffect(() => {
    log('MOUNT');
    return () => log('UNMOUNT');
  }, []);

  const [isOpen, setIsOpen] = useState(alwaysOpen || false);

  // Update isOpen when alwaysOpen prop changes
  useEffect(() => {
    if (alwaysOpen) {
      setIsOpen(true);
    }
  }, [alwaysOpen]);
  const [inputValue, setInputValue] = useState('');
  const [internalOptions, setInternalOptions] = useState(options);

  // ✅ QUAN TRỌNG: Cập nhật internalOptions khi options prop thay đổi
  useEffect(() => {
    log('options prop changed, updating internalOptions', { 
      oldCount: internalOptions.length, 
      newCount: options.length,
      oldOptions: internalOptions.map(o => o.name),
      newOptions: options.map(o => o.name)
    });
    
    // ✅ Cập nhật internalOptions với options mới
    setInternalOptions(options);
    
    // ✅ Debug: Log để kiểm tra state update
    log('internalOptions updated:', options.map(o => ({ id: o.id, name: o.name })));
  }, [options]);
  const [isLoading, setIsLoading] = useState(false);

  const lastSearchTermRef = useRef('');
  const selectRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestSeq = useRef(0);

  const debouncedSearchTerm = useDebounce(inputValue, 500);
  const selectedOption = options.find(o => o.id === value);

  const selectedNameRef = useRef<string | undefined>(selectedOption?.name);
  useEffect(() => { selectedNameRef.current = selectedOption?.name; }, [selectedOption]);

  // Sync input khi ĐÓNG (tránh giật khi đang mở)
  useEffect(() => {
    if (!isOpen) {
      const next = selectedOption?.name || (creatable && value ? value : '');
      log('sync inputValue (closed) ->', next);
      setInputValue(next);
    }
  }, [value, selectedOption, isOpen, creatable]);

  // ===== Outside click: listener gắn 1 lần, dùng ref để đọc isOpen hiện tại =====
  const isOpenRef = useRef(isOpen);
  useEffect(() => { isOpenRef.current = isOpen; }, [isOpen]);

  const handleGlobalPointerDown = useCallback((ev: PointerEvent) => {
    const root = selectRef.current;
    const outside = !(root && root.contains(ev.target as Node));
    // Only close if not alwaysOpen
    if (isOpenRef.current && outside && !alwaysOpen) {
      log('document pointerdown -> outside & open -> close');
      setIsOpen(false);
    }
  }, [alwaysOpen]);

  useEffect(() => {
    // Only add listener if not alwaysOpen
    if (!alwaysOpen) {
      log('add document pointerdown listener (once, no capture)');
      document.addEventListener('pointerdown', handleGlobalPointerDown, false);
      return () => {
        log('remove document pointerdown listener');
        document.removeEventListener('pointerdown', handleGlobalPointerDown, false);
      };
    }
  }, [handleGlobalPointerDown, alwaysOpen]);

  // ===== Search effect (deps tối thiểu) =====
  useEffect(() => {
    if (!onSearch || !isOpen) {
      log('search effect: skip (onSearch?', !!onSearch, 'isOpen?', isOpen, ')');
      return;
    }

    const term = debouncedSearchTerm.trim();
    log('🔍 [SearchableSelect] Search effect fired:', { 
      term, 
      lastSearchTerm: lastSearchTermRef.current, 
      isLoading, 
      selectedOption: selectedNameRef.current,
      hasOnSearch: !!onSearch,
      isOpen
    });

    if (term === '') {
      log('term empty -> use base options');
      setInternalOptions(options);
      setIsLoading(false);
      return;
    }

    if (selectedNameRef.current && term === selectedNameRef.current) {
      log('term equals selected option name -> skip search');
      setIsLoading(false);
      return;
    }

    if (lastSearchTermRef.current === term) {
      log('same as lastSearchTermRef -> skip search');
      return;
    }

    if (abortRef.current) {
      warn('abort previous request');
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    const id = ++requestSeq.current;
    lastSearchTermRef.current = term;
    setIsLoading(true);
    log(`🔍 [SearchableSelect] REQ#${id} start:`, { term, onSearch: !!onSearch });

    log(`🔍 [SearchableSelect] Calling onSearch with term:`, term);
    Promise.resolve(onSearch(term))
      .then(newOptions => {
        if (controller.signal.aborted) { warn(`REQ#${id} aborted (then)`); return; }
        
        // ✅ Đảm bảo newOptions có format đúng
        const validOptions = Array.isArray(newOptions) ? newOptions : [];
        log(`✅ [SearchableSelect] REQ#${id} success:`, { 
          count: validOptions.length, 
          options: validOptions.map(o => ({ id: o.id, name: o.name }))
        });
        
        // ✅ Cập nhật internalOptions với kết quả search
        setInternalOptions(validOptions);
        log(`🔄 [SearchableSelect] internalOptions updated:`, validOptions.map(o => ({ id: o.id, name: o.name })));
        setIsOpen(true); // giữ mở
      })
      .catch(err => {
        if (controller.signal.aborted) { warn(`REQ#${id} aborted (catch)`); return; }
        console.error(`[SearchableSelect] REQ#${id} failed:`, err);
        setInternalOptions([]);
        setIsOpen(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          log(`REQ#${id} finally -> setIsLoading(false)`);
          setIsLoading(false);
        }
      });

    return () => {
      warn(`cleanup -> abort REQ#${id}`);
      controller.abort();
    };
  }, [debouncedSearchTerm, isOpen, onSearch, options, isLoading]); // có thể bỏ options & isLoading nếu muốn ít rerun hơn

  const handleOptionSelect = (option: { id: string; name: string }) => {
    log('select option', option);
    onChange(option.id);
    setInputValue(option.name);
    setIsOpen(false);
  };

  const handleCreateOption = (name: string) => {
    if (!creatable) return;
    log('create option', name);
    onChange(name);
    setInputValue(name);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    log('input change ->', newValue);
    setInputValue(newValue);
    if (newValue.trim() !== lastSearchTermRef.current.trim()) {
      log('reset lastSearchTermRef');
      lastSearchTermRef.current = '';
    }
    if (!isOpenRef.current) {
      log('force open on input change');
      setIsOpen(true);
    }
  };

  const filteredOptions = onSearch
    ? internalOptions
    : options.filter(o => o.name.toLowerCase().includes(inputValue.toLowerCase()));

  // ✅ Debug: Log filteredOptions để theo dõi
  useEffect(() => {
    log('📋 [SearchableSelect] filteredOptions updated:', {
      hasOnSearch: !!onSearch,
      internalOptionsCount: internalOptions.length,
      optionsCount: options.length,
      filteredCount: filteredOptions.length,
      filteredOptions: filteredOptions.map(o => ({ id: o.id, name: o.name }))
    });
  }, [filteredOptions, onSearch, internalOptions, options]);

  const showCreateOption =
    creatable && inputValue && !filteredOptions.some(o => o.name.toLowerCase() === inputValue.toLowerCase());

  // ====== Non-creatable ======
  if (!creatable) {
    return (
      <div className="relative" ref={selectRef}>
        <div
          className="w-full p-2 border rounded-md bg-white cursor-pointer flex justify-between items-center"
          onClick={() => { 
            if (!alwaysOpen) {
              log('trigger click -> toggle', !isOpen); 
              setIsOpen(o => !o);
            }
          }}
        >
          {selectedOption ? selectedOption.name : <span className="text-gray-500">{placeholder || 'Select...'}</span>}
          <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {isOpen && (
          <div
            className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
            onPointerDown={e => { log('dropdown container pointerdown (stopPropagation)'); e.stopPropagation(); }}
          >
            <input
              type="text"
              className="w-full p-2 border-b border-gray-200"
              placeholder="Search..."
              value={inputValue}
              onChange={handleInputChange}
              onPointerDown={e => { log('input pointerdown (stopPropagation)'); e.stopPropagation(); }}
              autoFocus
              onFocus={() => {
                if (alwaysOpen) {
                  setIsOpen(true);
                }
              }}
            />
            <ul>
              {filteredOptions.length > 0 ? (
                filteredOptions.map(option => (
                  <li
                    key={option.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onPointerDown={() => handleOptionSelect(option)}
                  >
                    <span>{option.name}</span>
                    <div className="flex items-center">
                      {onEdit && (
                        <button
                          className="control-btn p-1 text-blue-500 hover:text-blue-700"
                          onPointerDown={e => { log('edit btn pointerdown (stopPropagation)'); e.stopPropagation(); }}
                          onClick={() => { log('edit btn click'); onEdit(option.id, option.name); setIsOpen(false); }}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="control-btn p-1 text-red-500 hover:text-red-700"
                          onPointerDown={e => { log('delete btn pointerdown (stopPropagation)'); e.stopPropagation(); }}
                          onClick={() => { log('delete btn click'); onDelete(option.id); setIsOpen(false); }}
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

  // ====== Creatable ======
  return (
    <div className="relative" ref={selectRef}>
      <input
        type="text"
        className="w-full p-2 border rounded-md"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => { log('input focus -> open'); setIsOpen(true); }}
        onPointerDown={e => { log('input pointerdown (stopPropagation) -> open'); e.stopPropagation(); setIsOpen(true); }}
        onKeyDown={e => {
          if (e.key === 'Enter' && showCreateOption) {
            e.preventDefault();
            handleCreateOption(inputValue);
          }
        }}
      />
      {isOpen && (
        <div
          className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto"
          onPointerDown={e => { log('dropdown container pointerdown (stopPropagation)'); e.stopPropagation(); }}
        >
          <ul>
            {filteredOptions.length > 0 ? (
              <>
                {filteredOptions.map(option => (
                  <li
                    key={option.id}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center"
                    onPointerDown={() => handleOptionSelect(option)}
                  >
                    <span>{option.name}</span>
                    <div className="flex items-center">
                      {onEdit && (
                        <button
                          className="control-btn p-1 text-blue-500 hover:text-blue-700"
                          onPointerDown={e => { log('edit btn pointerdown (stopPropagation)'); e.stopPropagation(); }}
                          onClick={() => { log('edit btn click'); onEdit(option.id, option.name); setIsOpen(false); }}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="control-btn p-1 text-red-500 hover:text-red-700"
                          onPointerDown={e => { log('delete btn pointerdown (stopPropagation)'); e.stopPropagation(); }}
                          onClick={() => { log('delete btn click'); onDelete(option.id); setIsOpen(false); }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
                {showCreateOption && (
                  <li className="p-2 hover:bg-gray-100 cursor-pointer" onPointerDown={() => handleCreateOption(inputValue)}>
                    Create "{inputValue}"
                  </li>
                )}
              </>
            ) : showCreateOption ? (
              <li className="p-2 hover:bg-gray-100 cursor-pointer" onPointerDown={() => handleCreateOption(inputValue)}>
                Create "{inputValue}"
              </li>
            ) : (
              <li className="p-2 text-gray-500">No options</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// Giúp giảm re-render nếu props không đổi (không giải quyết remount do key/điều kiện từ parent)
const SearchableSelectComponent = memo(SearchableSelectComponentInner);
export default SearchableSelectComponent;
