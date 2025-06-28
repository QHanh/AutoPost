import React, { useCallback, useState } from 'react';
import { Upload, X, Play, Image as ImageIcon, Film, AlertCircle } from 'lucide-react';
import { MediaFile } from '../types/platform';
import { createMediaFile, formatFileSize, formatDuration } from '../utils/mediaUtils';

interface MediaUploaderProps {
  media: MediaFile[];
  onMediaChange: (media: MediaFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  media,
  onMediaChange,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*']
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  }, [media]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = ''; // Reset input
  }, [media]);

  const processFiles = async (files: File[]) => {
    if (media.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setIsUploading(true);
    
    try {
      const newMediaFiles = await Promise.all(
        files.map(file => createMediaFile(file))
      );
      
      onMediaChange([...media, ...newMediaFiles]);
    } catch (error) {
      console.error('Error processing files:', error);
      alert('Error processing some files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = (mediaId: string) => {
    const updatedMedia = media.filter(m => m.id !== mediaId);
    onMediaChange(updatedMedia);
    
    // Clean up object URLs
    const mediaToRemove = media.find(m => m.id === mediaId);
    if (mediaToRemove) {
      URL.revokeObjectURL(mediaToRemove.url);
      if (mediaToRemove.thumbnail) {
        URL.revokeObjectURL(mediaToRemove.thumbnail);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-full">
              <Upload className="text-white" size={24} />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isUploading ? 'Processing files...' : 'Upload Media Files'}
            </h3>
            <p className="text-gray-600">
              Drag and drop your images and videos here, or click to browse
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports: JPG, PNG, GIF, MP4, MOV, AVI • Max {maxFiles} files
            </p>
          </div>
          
          {isUploading && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* Media Preview Grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((mediaFile) => (
            <div
              key={mediaFile.id}
              className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square"
            >
              {/* Media Preview */}
              {mediaFile.type === 'image' ? (
                <img
                  src={mediaFile.url}
                  alt={mediaFile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  {mediaFile.thumbnail ? (
                    <img
                      src={mediaFile.thumbnail}
                      alt={mediaFile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Film className="text-gray-400" size={32} />
                    </div>
                  )}
                  
                  {/* Video Play Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                    <div className="bg-white bg-opacity-90 rounded-full p-2">
                      <Play className="text-gray-800" size={20} />
                    </div>
                  </div>
                  
                  {/* Duration Badge */}
                  {mediaFile.duration && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(mediaFile.duration)}
                    </div>
                  )}
                </div>
              )}

              {/* Media Info Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-end">
                <div className="w-full p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                      {mediaFile.type === 'image' ? (
                        <ImageIcon size={14} />
                      ) : (
                        <Film size={14} />
                      )}
                      <span className="text-xs font-medium">
                        {mediaFile.type.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-xs">
                      {formatFileSize(mediaFile.size)}
                    </span>
                  </div>
                  <p className="text-xs mt-1 truncate" title={mediaFile.name}>
                    {mediaFile.name}
                  </p>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => removeMedia(mediaFile.id)}
                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-90 hover:scale-100"
              >
                <X size={14} />
              </button>

              {/* Type Badge */}
              <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {mediaFile.type === 'image' ? (
                  <ImageIcon size={12} />
                ) : (
                  <Film size={12} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Count Info */}
      {media.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <span>
            {media.length} file{media.length !== 1 ? 's' : ''} selected
          </span>
          <span>
            Total size: {formatFileSize(media.reduce((sum, m) => sum + m.size, 0))}
          </span>
        </div>
      )}
    </div>
  );
};