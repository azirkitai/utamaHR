/**
 * Utility functions for image processing and resizing
 */

export interface ResizeOptions {
  maxWidth: number;
  maxHeight: number;
  quality?: number; // JPEG quality (0-1)
  format?: 'jpeg' | 'png' | 'webp';
}

/**
 * Resizes an image file to specified dimensions while maintaining aspect ratio
 * @param file - The image file to resize
 * @param options - Resize options including max dimensions and quality
 * @returns Promise<File> - The resized image as a new File object
 */
export async function resizeImage(file: File, options: ResizeOptions): Promise<File> {
  return new Promise((resolve, reject) => {
    const { maxWidth, maxHeight, quality = 0.8, format = 'jpeg' } = options;

    // Create image element
    const img = new Image();
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw resized image
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob
      const mimeType = format === 'png' ? 'image/png' : 
                      format === 'webp' ? 'image/webp' : 'image/jpeg';
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }

        // Create new file with original name but potentially different extension
        const originalName = file.name.split('.').slice(0, -1).join('.');
        const extension = format === 'png' ? 'png' : 
                         format === 'webp' ? 'webp' : 'jpg';
        const newFileName = `${originalName}_resized.${extension}`;

        const resizedFile = new File([blob], newFileName, {
          type: mimeType,
          lastModified: Date.now(),
        });

        resolve(resizedFile);
      }, mimeType, quality);
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Start loading image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Validates if a file is a valid image
 * @param file - File to validate
 * @returns boolean - True if file is a valid image
 */
export function isValidImage(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type);
}

/**
 * Gets image dimensions
 * @param file - Image file
 * @returns Promise<{width: number, height: number}> - Image dimensions
 */
export function getImageDimensions(file: File): Promise<{width: number, height: number}> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Formats file size for display
 * @param bytes - File size in bytes
 * @returns string - Formatted size (e.g., "1.2 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}