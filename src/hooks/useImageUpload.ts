import { useState } from 'react';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseImageUploadOptions {
  bucket?: string;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  quality?: number;
}

interface UploadResult {
  url: string;
  path: string;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const {
    bucket = 'screenshots',
    maxSizeMB = 1,
    maxWidthOrHeight = 800,
    quality = 0.8,
  } = options;

  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const compressImage = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB,
      maxWidthOrHeight,
      useWebWorker: true,
      fileType: 'image/webp' as const,
      initialQuality: quality,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      // Return original file if compression fails
      return file;
    }
  };

  const uploadImage = async (file: File, userId: string): Promise<UploadResult | null> => {
    setIsUploading(true);
    setProgress(10);

    try {
      // Compress and convert to webp
      setProgress(30);
      const compressedFile = await compressImage(file);
      
      setProgress(50);
      
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${timestamp}.webp`;
      const filePath = `${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, compressedFile, {
          contentType: 'image/webp',
          upsert: false,
        });

      setProgress(80);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setProgress(100);

      return {
        url: publicUrlData.publicUrl,
        path: filePath,
      };
    } catch (error: any) {
      console.error('Image upload failed:', error);
      toast({
        title: '이미지 업로드 실패',
        description: '이미지 업로드에 실패했습니다. 다시 시도해주세요.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const deleteImage = async (filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Image delete failed:', error);
      return false;
    }
  };

  return {
    uploadImage,
    deleteImage,
    compressImage,
    isUploading,
    progress,
  };
}
