import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera, Upload, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileAvatarProps {
  avatarUrl?: string | null;
  userName: string;
  userId: string;
  onAvatarUpdate: (url: string | null) => void;
  editable?: boolean;
}

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
  avatarUrl,
  userName,
  userId,
  onAvatarUpdate,
  editable = false
}) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;
      
      // Delete existing avatar if it exists
      if (avatarUrl) {
        const oldPath = avatarUrl.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatars').remove([`${userId}/${oldPath}`]);
        }
      }

      // Upload new avatar
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update profile in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('user_id', userId);

      if (updateError) throw updateError;

      onAvatarUpdate(publicUrl);
      setShowUpload(false);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated successfully"
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Upload failed",
        description: "Failed to update your profile picture. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (!avatarUrl) return;

    try {
      setIsUploading(true);
      
      // Remove from storage
      const path = avatarUrl.split('/').pop();
      if (path) {
        await supabase.storage.from('avatars').remove([`${userId}/${path}`]);
      }

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('user_id', userId);

      if (error) throw error;

      onAvatarUpdate(null);
      setShowUpload(false);
      
      toast({
        title: "Avatar removed",
        description: "Your profile picture has been removed"
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: "Failed to remove avatar",
        description: "Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative group">
      <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
        <AvatarImage src={avatarUrl || undefined} alt={`${userName}'s avatar`} />
        <AvatarFallback className="text-lg font-semibold bg-primary text-primary-foreground">
          {getInitials(userName)}
        </AvatarFallback>
      </Avatar>
      
      {editable && (
        <>
          <Button
            size="sm"
            variant="secondary"
            className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setShowUpload(!showUpload)}
            disabled={isUploading}
          >
            <Camera className="w-4 h-4" />
          </Button>

          {showUpload && (
            <div className="absolute top-full left-0 mt-2 bg-card border rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
              <div className="space-y-2">
                <label htmlFor="avatar-upload">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    disabled={isUploading}
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload Photo'}
                    </span>
                  </Button>
                  <Input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                
                {avatarUrl && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full justify-start"
                    onClick={handleRemoveAvatar}
                    disabled={isUploading}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Photo
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowUpload(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};