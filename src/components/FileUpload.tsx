import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileUploaded: (fileUrl: string, fileName: string) => void;
  accept?: Record<string, string[]>;
  maxSize?: number;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  error?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileUploaded,
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
  className
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to upload files",
        variant: "destructive"
      });
      return;
    }

    const newUploadingFiles: UploadingFile[] = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      const uploadIndex = uploadingFiles.length + i;

      try {
        // Generate unique filename with user ID folder structure
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        // Start progress simulation
        const progressInterval = setInterval(() => {
          setUploadingFiles(prev => 
            prev.map((f, idx) => 
              idx === uploadIndex && f.progress < 90 
                ? { ...f, progress: f.progress + 10 } 
                : f
            )
          );
        }, 200);

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from('project-files')
          .upload(fileName, file);

        clearInterval(progressInterval);

        if (error) {
          throw error;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('project-files')
          .getPublicUrl(fileName);

        // Update file status to success
        setUploadingFiles(prev => 
          prev.map((f, idx) => 
            idx === uploadIndex 
              ? { ...f, status: 'success', progress: 100, url: publicUrl }
              : f
          )
        );

        // Notify parent component
        onFileUploaded(fileName, file.name);

        toast({
          title: "File uploaded successfully",
          description: `${file.name} has been uploaded`,
        });

      } catch (error) {
        console.error('Upload error:', error);
        
        setUploadingFiles(prev => 
          prev.map((f, idx) => 
            idx === uploadIndex 
              ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Upload failed' }
              : f
          )
        );

        toast({
          title: "Upload failed",
          description: `Failed to upload ${file.name}`,
          variant: "destructive"
        });
      }
    }
  }, [user, onFileUploaded, toast, uploadingFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false // For now, single file upload
  });

  const removeFile = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card 
        {...getRootProps()} 
        className={cn(
          "border-dashed border-2 transition-colors cursor-pointer hover:border-primary/50",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        )}
      >
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <input {...getInputProps()} />
          <Upload className={cn(
            "h-10 w-10 mb-4 transition-colors",
            isDragActive ? "text-primary" : "text-muted-foreground"
          )} />
          {isDragActive ? (
            <p className="text-primary">Drop the file here...</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Drop your document here or click to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Supports PDF, DOC, DOCX, TXT (max {Math.round(maxSize / 1024 / 1024)}MB)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Progress */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-3">
          {uploadingFiles.map((uploadingFile, index) => (
            <Card key={index} className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium truncate">
                    {uploadingFile.file.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {uploadingFile.status === 'success' && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  {uploadingFile.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              {uploadingFile.status === 'uploading' && (
                <Progress value={uploadingFile.progress} className="h-2" />
              )}
              
              {uploadingFile.status === 'error' && (
                <p className="text-xs text-destructive mt-1">
                  {uploadingFile.error}
                </p>
              )}
              
              {uploadingFile.status === 'success' && (
                <p className="text-xs text-green-600 mt-1">
                  Upload complete
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;