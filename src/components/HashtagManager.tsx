import React, { useState, useEffect } from 'react';
import { Hash, Plus, X, Tag } from 'lucide-react';

interface HashtagManagerProps {
  content: string;
  onHashtagsChange: (hashtags: string[]) => void;
  lastGeneratedContent: string;
  onLastGeneratedContentChange: (content: string) => void;
}

export const HashtagManager: React.FC<HashtagManagerProps> = ({
  content,
  onHashtagsChange,
  lastGeneratedContent,
  onLastGeneratedContentChange
}) => {
  const [customHashtags, setCustomHashtags] = useState<string[]>(() => {
    const saved = localStorage.getItem('customHashtags');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [newHashtag, setNewHashtag] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Save custom hashtags to localStorage
  useEffect(() => {
    localStorage.setItem('customHashtags', JSON.stringify(customHashtags));
  }, [customHashtags]);

  // Update parent component when selected hashtags change
  useEffect(() => {
    onHashtagsChange(selectedHashtags);
  }, [selectedHashtags, onHashtagsChange]);

  const toggleHashtag = (hashtag: string) => {
    setSelectedHashtags(prev => 
      prev.includes(hashtag)
        ? prev.filter(h => h !== hashtag)
        : [...prev, hashtag]
    );
  };

  const addCustomHashtag = () => {
    const cleanHashtag = newHashtag.trim().replace('#', '');
    if (cleanHashtag && !customHashtags.includes(cleanHashtag)) {
      setCustomHashtags(prev => [...prev, cleanHashtag]);
      setNewHashtag('');
      setShowAddForm(false);
    }
  };

  const removeCustomHashtag = (hashtag: string) => {
    setCustomHashtags(prev => prev.filter(h => h !== hashtag));
    setSelectedHashtags(prev => prev.filter(h => h !== hashtag));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomHashtag();
    }
    if (e.key === 'Escape') {
      setShowAddForm(false);
      setNewHashtag('');
    }
  };

  return (
    <div className="space-y-4">
      {/* Custom Hashtags */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Tag className="text-blue-600" size={16} />
            <h4 className="font-medium text-gray-900">Your Custom Hashtags</h4>
          </div>
          
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={14} />
            Add
          </button>
        </div>

        {/* Add New Hashtag Form */}
        {showAddForm && (
          <div className="mb-3 p-3 bg-white border border-blue-300 rounded-lg">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                <input
                  type="text"
                  value={newHashtag}
                  onChange={(e) => setNewHashtag(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter hashtag (without #)"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  autoFocus
                />
              </div>
              <button
                type="button"
                onClick={addCustomHashtag}
                disabled={!newHashtag.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewHashtag('');
                }}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Press Enter to add, Escape to cancel
            </div>
          </div>
        )}

        {/* Custom Hashtags List */}
        {customHashtags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {customHashtags.map((hashtag, index) => (
              <div
                key={index}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 group ${
                  selectedHashtags.includes(hashtag)
                    ? 'bg-blue-500 text-white shadow-md'
                    : 'bg-white text-blue-700 border border-blue-300 hover:bg-blue-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleHashtag(hashtag)}
                  className="flex items-center gap-1"
                >
                  <Hash size={12} />
                  {hashtag}
                </button>
                <button
                  type="button"
                  onClick={() => removeCustomHashtag(hashtag)}
                  className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
                  title="Remove hashtag"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">
            <Tag className="mx-auto mb-2 text-gray-300" size={24} />
            <p className="text-sm">No custom hashtags yet</p>
            <p className="text-xs mt-1">Add hashtags you use frequently</p>
          </div>
        )}
      </div>

      {/* Selected Hashtags Summary */}
      {selectedHashtags.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-green-800">
              {selectedHashtags.length} hashtag{selectedHashtags.length !== 1 ? 's' : ''} will be added to your post
            </span>
          </div>
          <div className="text-xs text-green-700">
            {selectedHashtags.map(tag => `#${tag}`).join(' ')}
          </div>
        </div>
      )}
    </div>
  );
};