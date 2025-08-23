import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, File, ExternalLink, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FileViewerProps {
  fileUrl: string | null;
  fileName?: string;
  className?: string;
  showPreview?: boolean;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  fileUrl,
  fileName = 'Document',
  className,
  showPreview = true
}) => {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!fileUrl) {
    return (
      <Card className={cn("border-dashed border-2 border-muted-foreground/25", className)}>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <File className="h-8 w-8 mb-3 text-muted-foreground opacity-50" />
          <p className="text-sm text-muted-foreground">No document uploaded</p>
        </CardContent>
      </Card>
    );
  }

  const getFileExtension = () => {
    return fileUrl.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = () => {
    const ext = getFileExtension();
    switch (ext) {
      case 'pdf':
        return { type: 'PDF', color: 'bg-red-100 text-red-800' };
      case 'doc':
      case 'docx':
        return { type: 'DOC', color: 'bg-blue-100 text-blue-800' };
      case 'txt':
        return { type: 'TXT', color: 'bg-gray-100 text-gray-800' };
      default:
        return { type: 'FILE', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const handleDownload = async () => {
    if (!fileUrl) return;

    setIsDownloading(true);
    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .download(fileUrl);

      if (error) {
        throw error;
      }

      // Create download link
      const blob = new Blob([data]);
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Download started",
        description: "Your file is being downloaded",
      });

    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Unable to download file",
        variant: "destructive"
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewInNewTab = async () => {
    if (!fileUrl) return;

    try {
      const { data, error } = await supabase.storage
        .from('project-files')
        .createSignedUrl(fileUrl, 3600); // 1 hour expiry

      if (error) {
        throw error;
      }

      window.open(data.signedUrl, '_blank');

    } catch (error) {
      console.error('View error:', error);
      toast({
        title: "Unable to open file",
        description: "Please try downloading the file instead",
        variant: "destructive"
      });
    }
  };

  const fileType = getFileType();

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <File className="h-4 w-4" />
          Attached Document
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className={fileType.color}>
              {fileType.type}
            </Badge>
            <span className="text-sm font-medium truncate">{fileName}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
          
          {showPreview && getFileExtension() === 'pdf' && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleViewInNewTab}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FileViewer;