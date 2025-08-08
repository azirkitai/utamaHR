import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { resizeImage, isValidImage, formatFileSize } from "@/lib/imageUtils";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
  resizeImages?: boolean;
  maxImageWidth?: number;
  maxImageHeight?: number;
  imageQuality?: number;
}

/**
 * A file upload component that renders as a button and provides a modal interface for
 * file management.
 * 
 * Features:
 * - Renders as a customizable button that opens a file upload modal
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 * All file management features are automatically handled by the Uppy dashboard modal.
 * 
 * @param props - Component props
 * @param props.maxNumberOfFiles - Maximum number of files allowed to be uploaded
 *   (default: 1)
 * @param props.maxFileSize - Maximum file size in bytes (default: 10MB)
 * @param props.onGetUploadParameters - Function to get upload parameters (method and URL).
 *   Typically used to fetch a presigned URL from the backend server for direct-to-S3
 *   uploads.
 * @param props.onComplete - Callback function called when upload is complete. Typically
 *   used to make post-upload API calls to update server state and set object ACL
 *   policies.
 * @param props.buttonClassName - Optional CSS class name for the button
 * @param props.children - Content to be rendered inside the button
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
  resizeImages = true,
  maxImageWidth = 400,
  maxImageHeight = 400,
  imageQuality = 0.8,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
        allowedFileTypes: ['image/*'], // Only allow images for profile pictures
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on('file-added', async (file) => {
        if (resizeImages && file.type && file.type.startsWith('image/')) {
          try {
            // Convert UppyFile to File object for processing
            const originalFile = new File([file.data], file.name || 'image', { type: file.type });
            
            // Validate image
            if (!isValidImage(originalFile)) {
              uppy.removeFile(file.id);
              alert('Jenis fail tidak disokong. Sila pilih gambar (JPEG, PNG, WebP, atau GIF).');
              return;
            }

            // Resize image
            const resizedFile = await resizeImage(originalFile, {
              maxWidth: maxImageWidth,
              maxHeight: maxImageHeight,
              quality: imageQuality,
              format: 'jpeg' // Convert all to JPEG for consistency
            });

            // Update uppy file with resized data
            uppy.setFileState(file.id, {
              data: resizedFile,
              size: resizedFile.size,
              type: resizedFile.type,
              name: resizedFile.name,
            });

            console.log(`Image resized: ${formatFileSize(originalFile.size)} → ${formatFileSize(resizedFile.size)}`);
            
          } catch (error) {
            console.error('Error processing image:', error);
            uppy.removeFile(file.id);
            alert('Ralat memproses gambar. Sila cuba dengan gambar lain.');
          }
        }
      })
      .on("complete", (result) => {
        setShowModal(false); // Close modal after upload
        onComplete?.(result);
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName}>
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}