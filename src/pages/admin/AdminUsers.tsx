import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Users, Search, UserPlus, Edit, Trash2, Crown, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateUserDialog } from '@/components/CreateUserDialog';

interface Profile {
  id: string;
  user_id: string;
  name: string;
  role: string;
  department_id: string | null;
  avatar_url: string | null;
  created_at: string;
  departments?: {
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch all user profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*, departments(name)')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (departmentsError) throw departmentsError;

      setProfiles(profilesData || []);
      setDepartments(departmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load user data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (profileId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      setProfiles(profiles.map(p => 
        p.id === profileId ? { ...p, role: newRole } : p
      ));

      toast({
        title: "Role updated",
        description: `User role has been updated to ${newRole}`
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive"
      });
    }
  };

  const updateUserDepartment = async (profileId: string, departmentId: string | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ department_id: departmentId })
        .eq('id', profileId);

      if (error) throw error;

      // Update local state
      const updatedDepartment = departmentId 
        ? departments.find(d => d.id === departmentId)
        : null;
      
      setProfiles(profiles.map(p => 
        p.id === profileId 
          ? { 
              ...p, 
              department_id: departmentId,
              departments: updatedDepartment ? { name: updatedDepartment.name } : undefined
            } 
          : p
      ));

      toast({
        title: "Department updated",
        description: "User department has been updated"
      });
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: "Error",
        description: "Failed to update user department",
        variant: "destructive"
      });
    }
  };

  const deleteUser = async (profile: Profile) => {
    try {
      // Note: Deleting from profiles will cascade due to auth.users foreign key
      const { error } = await supabase.auth.admin.deleteUser(profile.user_id);

      if (error) throw error;

      // Remove from local state
      setProfiles(profiles.filter(p => p.id !== profile.id));

      toast({
        title: "User deleted",
        description: "User has been permanently deleted"
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error",
        description: "Failed to delete user. You may not have admin permissions.",
        variant: "destructive"
      });
    }
  };

  // Filter profiles based on search and filters
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = 
      profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (profile.departments?.name || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || profile.role === roleFilter;
    const matchesDepartment = departmentFilter === 'all' || profile.department_id === departmentFilter;

    return matchesSearch && matchesRole && matchesDepartment;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8" />
            User Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage user accounts, roles, and departments
          </p>
        </div>
        <CreateUserDialog departments={departments} onUserCreated={fetchData} />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchData}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredProfiles.length})</CardTitle>
          <CardDescription>
            Manage user roles, departments, and account settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={profile.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {getInitials(profile.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{profile.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {profile.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={profile.role}
                        onValueChange={(value) => updateUserRole(profile.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Student
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Crown className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={profile.department_id || 'none'}
                        onValueChange={(value) => updateUserDepartment(
                          profile.id, 
                          value === 'none' ? null : value
                        )}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Department</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(profile.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete {profile.name}? This action cannot be undone and will permanently remove their account and all associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUser(profile)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete User
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No users found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsers;