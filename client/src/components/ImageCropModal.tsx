import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ZoomIn, Upload, X } from "lucide-react";

interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Point {
  x: number;
  y: number;
}

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  onCropComplete: (croppedImageBlob: Blob) => void;
}

// Helper function to create cropped image
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', error => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

// Helper function to get cropped image
const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Set canvas size to desired output size (square for circular crop)
  const size = 300; // Final size for profile picture
  canvas.width = size;
  canvas.height = size;

  // Calculate scale to fit the cropped area into the canvas
  const scaleX = size / pixelCrop.width;
  const scaleY = size / pixelCrop.height;
  const scale = Math.min(scaleX, scaleY);

  // Center the cropped image in the canvas
  const offsetX = (size - pixelCrop.width * scale) / 2;
  const offsetY = (size - pixelCrop.height * scale) / 2;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    offsetX,
    offsetY,
    pixelCrop.width * scale,
    pixelCrop.height * scale
  );

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to create blob'));
      }
    }, 'image/jpeg', 0.9);
  });
};

export function ImageCropModal({ isOpen, onClose, imageSrc, onCropComplete }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = useCallback((crop: Point) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number) => {
    setZoom(zoom);
  }, []);

  const onCropCompleteHandler = useCallback(
    (croppedArea: Area, croppedAreaPixels: Area) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (!croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImageBlob);
      onClose();
    } catch (error) {
      console.error('Error creating cropped image:', error);
      alert('Ralat memproses gambar. Sila cuba lagi.');
    } finally {
      setIsProcessing(false);
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete, onClose]);

  const handleCancel = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl h-[600px] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2 text-lg font-semibold">
            <ZoomIn className="w-5 h-5 text-cyan-600" />
            Crop Gambar Profile
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Drag dan zoom gambar untuk posisi terbaik dalam avatar bulat
          </DialogDescription>
        </DialogHeader>

        <div className="relative flex-1 bg-black rounded-lg mx-6 overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1} // Square aspect ratio for circular crop
            cropShape="round" // This creates the circular crop overlay
            showGrid={false}
            onCropChange={onCropChange}
            onZoomChange={onZoomChange}
            onCropComplete={onCropCompleteHandler}
          />
        </div>

        {/* Zoom Control */}
        <div className="px-6 py-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 min-w-[40px]">Zoom:</span>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 min-w-[40px]">{zoom.toFixed(1)}x</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center px-6 py-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Drag untuk posisi, gunakan zoom untuk saiz yang sesuai
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isProcessing}
              data-testid="button-cancel-crop"
            >
              <X className="w-4 h-4 mr-1" />
              Batal
            </Button>
            <Button
              onClick={handleUpload}
              disabled={isProcessing || !croppedAreaPixels}
              className="bg-gradient-to-r from-slate-900 via-blue-900 to-cyan-800 hover:from-slate-800 hover:via-blue-800 hover:to-cyan-700"
              data-testid="button-upload-cropped"
            >
              <Upload className="w-4 h-4 mr-1" />
              {isProcessing ? "Memproses..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}