import React, { useState } from 'react';
import { Star, Trash2, MoveUp, MoveDown } from 'lucide-react';
import { ActivityImage, ImageUpdateRequest } from '../../../types/activity';

interface ImageGalleryUploaderProps {
  images: ActivityImage[];
  onUpload: (files: File[]) => Promise<void>;
  onUpdate: (imageId: string, data: ImageUpdateRequest) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
  maxImages?: number;
  disabled?: boolean;
}

const ImageGalleryUploader: React.FC<ImageGalleryUploaderProps> = ({
  images,
  onUpload,
  onUpdate,
  onDelete,
  maxImages = 10,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    await handleFiles(files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await handleFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFiles = async (files: File[]) => {
    if (images.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    const remainingSlots = maxImages - images.length;
    const validFiles = files
      .filter((file) => {
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          return false;
        }
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large. Maximum size is 5MB`);
          return false;
        }
        return true;
      })
      .slice(0, remainingSlots);

    if (validFiles.length > 0) {
      setIsUploading(true);
      try {
        await onUpload(validFiles);
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSetHero = async (imageId: string) => {
    try {
      await onUpdate(imageId, { is_hero: true });
    } catch (error) {
      console.error('Failed to set hero image:', error);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const currentImage = images[index];
    const prevImage = images[index - 1];

    try {
      await onUpdate(currentImage.id, { display_order: prevImage.display_order });
      await onUpdate(prevImage.id, { display_order: currentImage.display_order });
    } catch (error) {
      console.error('Failed to reorder images:', error);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === images.length - 1) return;

    const currentImage = images[index];
    const nextImage = images[index + 1];

    try {
      await onUpdate(currentImage.id, { display_order: nextImage.display_order });
      await onUpdate(nextImage.id, { display_order: currentImage.display_order });
    } catch (error) {
      console.error('Failed to reorder images:', error);
    }
  };

  const handleDelete = async (imageId: string) => {
    if (confirm('Are you sure you want to delete this image?')) {
      try {
        await onDelete(imageId);
      } catch (error) {
        console.error('Failed to delete image:', error);
      }
    }
  };

  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-primary-600 bg-primary-50'
            : 'border-border hover:border-primary-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          disabled={disabled}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <svg
            className="w-12 h-12 text-muted mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>

          <p className="text-sm text-primary mb-1">
            <span className="text-primary-600 font-medium">Click to upload</span> or drag
            and drop
          </p>
          <p className="text-xs text-muted">
            PNG, JPG, GIF up to 5MB ({images.length}/{maxImages} images)
          </p>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-sm text-muted mt-2">Uploading...</p>
          </div>
        )}
      </div>

      {/* Image Grid */}
      {sortedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {sortedImages.map((image, index) => (
            <div
              key={image.id}
              className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border hover:border-primary-500 transition-colors"
            >
              <img
                src={image.file_url || `${API_URL}${image.file_path}`}
                alt={`Upload ${index + 1}`}
                className="w-full h-full object-cover"
              />

              {/* Hero Badge */}
              {image.is_hero && (
                <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-md bg-yellow-500 text-white text-xs font-medium">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Hero
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!image.is_hero && (
                  <button
                    type="button"
                    onClick={() => handleSetHero(image.id)}
                    className="p-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
                    title="Set as hero image"
                    disabled={disabled}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleMoveUp(index)}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                  title="Move up"
                  disabled={disabled || index === 0}
                >
                  <MoveUp className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleMoveDown(index)}
                  className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50"
                  title="Move down"
                  disabled={disabled || index === sortedImages.length - 1}
                >
                  <MoveDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => handleDelete(image.id)}
                  className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  title="Delete image"
                  disabled={disabled}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Display Order */}
              <div className="absolute bottom-2 left-2">
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-black bg-opacity-50 text-white text-xs font-medium">
                  {index + 1}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageGalleryUploader;
