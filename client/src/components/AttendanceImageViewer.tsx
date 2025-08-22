import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye, X, Camera } from "lucide-react";

interface AttendanceImageViewerProps {
  clockInImage?: string | null;
  clockOutImage?: string | null;
  breakInImage?: string | null;
  breakOutImage?: string | null;
  clockInTime?: string | null;
  clockOutTime?: string | null;
  breakInTime?: string | null;
  breakOutTime?: string | null;
}

export function AttendanceImageViewer({ 
  clockInImage, 
  clockOutImage, 
  breakInImage, 
  breakOutImage,
  clockInTime,
  clockOutTime,
  breakInTime,
  breakOutTime 
}: AttendanceImageViewerProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    title: string;
    time?: string;
  } | null>(null);

  // Function to format image URL for serving
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return null;
    
    // If it's already a full URL, return as-is
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    // If it's an object storage path, serve via our backend endpoint
    if (imagePath.startsWith('/objects/')) {
      return imagePath; // Backend will handle serving this
    }
    
    // For other paths, assume they're served from objects endpoint
    return `/objects/${imagePath.replace(/^\/+/, '')}`;
  };

  // Function to format time
  const formatTime = (timeString?: string | null) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleTimeString('ms-MY', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return 'N/A';
    }
  };

  // Check which images are available
  const images = [
    {
      type: 'Clock In',
      url: clockInImage ? getImageUrl(clockInImage) : null,
      time: formatTime(clockInTime),
      color: 'bg-green-100 text-green-800'
    },
    {
      type: 'Clock Out', 
      url: clockOutImage ? getImageUrl(clockOutImage) : null,
      time: formatTime(clockOutTime),
      color: 'bg-red-100 text-red-800'
    },
    {
      type: 'Break Out',
      url: breakOutImage ? getImageUrl(breakOutImage) : null,
      time: formatTime(breakOutTime),
      color: 'bg-peoplee-100 text-peoplee-800'
    },
    {
      type: 'Break In',
      url: breakInImage ? getImageUrl(breakInImage) : null,
      time: formatTime(breakInTime),
      color: 'bg-blue-100 text-blue-800'
    }
  ];

  const availableImages = images.filter(img => img.url);

  const handleImageClick = (image: typeof images[0]) => {
    if (image.url) {
      setSelectedImage({
        url: image.url,
        title: `${image.type} - ${image.time}`,
        time: image.time
      });
    }
  };

  if (availableImages.length === 0) {
    return (
      <div className="flex items-center text-gray-500">
        <Camera className="h-4 w-4 mr-1" />
        <span className="text-sm">Tiada Gambar</span>
      </div>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDialog(true)}
        className="h-8 px-2"
        data-testid="button-view-images"
      >
        <Eye className="h-4 w-4 mr-1" />
        <span>Lihat ({availableImages.length})</span>
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Gambar Kehadiran
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {images.map((image, index) => (
                <div key={index} className={`p-4 rounded-lg border ${image.url ? 'cursor-pointer hover:shadow-md' : 'opacity-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${image.color}`}>
                      {image.type}
                    </span>
                    <span className="text-sm text-gray-600">{image.time}</span>
                  </div>
                  
                  {image.url ? (
                    <div 
                      className="relative group"
                      onClick={() => handleImageClick(image)}
                    >
                      <img
                        src={image.url}
                        alt={`${image.type} image`}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          console.error(`Failed to load image: ${image.url}`);
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyIDJMMTMuMDkgOC4yNkwyMCA5TDEzLjA5IDE1Ljc0TDEyIDIyTDEwLjkxIDE1Ljc0TDQgOUwxMC45MSA4LjI2TDEyIDJaIiBzdHJva2U9IiM5Q0E0QUYiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo=';
                        }}
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                      <div className="text-center text-gray-500">
                        <Camera className="h-8 w-8 mx-auto mb-2" />
                        <p className="text-sm">Tiada Gambar</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Size Image Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-5xl max-h-[95vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between">
                <span>{selectedImage.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedImage(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogTitle>
            </DialogHeader>
            <div className="flex justify-center">
              <img
                src={selectedImage.url}
                alt="Full size attendance image"
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={(e) => {
                  console.error(`Failed to load full size image: ${selectedImage.url}`);
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}