import { useRef, useState } from 'react';
import { Camera, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ScreenshotAttachmentProps {
  imageUrl: string | null;
  isUploading: boolean;
  progress: number;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  className?: string;
}

export function ScreenshotAttachment({
  imageUrl,
  isUploading,
  progress,
  onFileSelect,
  onRemove,
  className,
}: ScreenshotAttachmentProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create local preview immediately
      const localPreview = URL.createObjectURL(file);
      setPreviewUrl(localPreview);
      onFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    onRemove();
  };

  const displayUrl = imageUrl || previewUrl;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Image preview or upload button */}
      {displayUrl ? (
        <div className="relative rounded-lg overflow-hidden">
          <img
            src={displayUrl}
            alt="스크린샷 미리보기"
            className="w-full h-48 object-cover"
          />
          
          {/* Loading overlay */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
              <Progress value={progress} className="w-2/3 h-2" />
              <span className="text-white text-sm">업로드 중... {progress}%</span>
            </div>
          )}
          
          {/* Remove button */}
          {!isUploading && (
            <button
              onClick={handleRemove}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
              aria-label="이미지 삭제"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="w-full h-14 border-2 border-dashed hover:border-primary hover:bg-primary/5 transition-all"
        >
          <Camera className="h-5 w-5 mr-2" />
          📷 스크린샷 첨부
        </Button>
      )}
    </div>
  );
}
