import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ProfileAvatar } from '@/components/ProfileAvatar';
import { ProfileEditForm } from '@/components/ProfileEditForm';
import { User, Mail, Calendar, Building, Edit, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  department_id: string | null;
  avatar_url: string | null;
  created_at: string;
  matriculation_number?: string | null;
  departments?: {
    name: string;
  };
}

interface ProfileStats {
  totalProjects: number;
  thisYearProjects: number;
  joinedDate: string;
}

const Profile = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*, departments(name)')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Get user's project statistics
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('year, created_at')
        .eq('student_id', profileData.id);

      if (projectsError) throw projectsError;

      const currentYear = new Date().getFullYear();
      const stats: ProfileStats = {
        totalProjects: projects?.length || 0,
        thisYearProjects: projects?.filter(p => p.year === currentYear).length || 0,
        joinedDate: profileData.created_at
      };

      setStats(stats);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setIsEditing(false);
  };

  const handleAvatarUpdate = (url: string | null) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'student':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Profile Not Found</h1>
          <p className="text-muted-foreground">Unable to load your profile information.</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => setIsEditing(false)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Profile
        </Button>
        <ProfileEditForm
          profile={profile}
          onUpdate={handleProfileUpdate}
          onCancel={() => setIsEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
        <Button onClick={() => setIsEditing(true)}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start gap-6">
                <ProfileAvatar
                  avatarUrl={profile.avatar_url}
                  userName={profile.name}
                  userId={profile.user_id}
                  onAvatarUpdate={handleAvatarUpdate}
                  editable={true}
                />
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{profile.name}</CardTitle>
                    <div className="flex items-center gap-2 mb-3">
                      {userRole && (
                        <Badge variant={getRoleBadgeVariant(userRole)}>
                          {userRole}
                        </Badge>
                      )}
                      {profile.departments && (
                        <Badge variant="outline">
                          {profile.departments.name}
                        </Badge>
                      )}
                    </div>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Joined {formatDate(profile.created_at)}
                    </div>
                    {profile.departments && (
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4" />
                        {profile.departments.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      User ID
                    </Label>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1">
                      {profile.user_id.slice(0, 8)}...
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Account Type
                    </Label>
                    <p className="text-sm capitalize mt-1">{userRole || 'student'}</p>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Department
                  </Label>
                  <p className="text-sm mt-1">
                    {profile.departments?.name || 'No department assigned'}
                  </p>
                </div>

                <Separator />
                
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Matriculation Number
                  </Label>
                  <p className="text-sm mt-1">
                    {profile.matriculation_number || 'Not set'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {stats.totalProjects}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Projects</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <div className="text-2xl font-semibold">
                      {stats.thisYearProjects}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Projects This Year
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <div className="text-lg font-medium">
                      {Math.floor((Date.now() - new Date(stats.joinedDate).getTime()) / (1000 * 60 * 60 * 24))}
                    </div>
                    <p className="text-sm text-muted-foreground">Days as Member</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/submit'}
                >
                  Submit New Project
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => window.location.href = '/projects'}
                >
                  View My Projects
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;