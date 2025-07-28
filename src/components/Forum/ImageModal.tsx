import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ForumPostImage {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  url: string;
}

interface ImageModalProps {
  images: ForumPostImage[];
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
}

export const ImageModal = ({ images, initialIndex = 0, isOpen, onClose }: ImageModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowLeft') {
      goToPrevious();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  // Add keyboard event listener
  useState(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative max-w-4xl max-h-full p-4">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
        >
          <X className="h-6 w-6" />
        </Button>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 text-white hover:bg-opacity-70"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Image */}
        <div className="flex flex-col items-center">
          <img
            src={currentImage.url}
            alt={currentImage.file_name}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />
          
          {/* Image Info */}
          <div className="mt-4 text-white text-center">
            <p className="font-medium">{currentImage.file_name}</p>
            <p className="text-sm text-muted-foreground">
              {(currentImage.file_size / 1024 / 1024).toFixed(2)} MB • 
              {currentIndex + 1} de {images.length}
            </p>
          </div>
        </div>

        {/* Thumbnail Navigation */}
        {images.length > 1 && (
          <div className="flex justify-center mt-4 space-x-2">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => setCurrentIndex(index)}
                className={`w-16 h-16 rounded-lg border-2 overflow-hidden ${
                  index === currentIndex ? 'border-blue-500' : 'border-gray-600'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.file_name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 