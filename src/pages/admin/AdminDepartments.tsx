import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Building, Plus, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const departmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100, 'Name must be less than 100 characters'),
});

type DepartmentFormData = z.infer<typeof departmentSchema>;

interface Department {
  id: string;
  name: string;
  created_at: string;
  user_count?: number;
  project_count?: number;
}

const AdminDepartments = () => {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const form = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
    }
  });

  const editForm = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      name: '',
    }
  });

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setIsLoading(true);

      // Fetch departments with user and project counts
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (departmentsError) throw departmentsError;

      // Get user counts for each department
      const departmentsWithCounts = await Promise.all(
        (departmentsData || []).map(async (dept) => {
          const [userCountResult, projectCountResult] = await Promise.all([
            supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true })
              .eq('department_id', dept.id),
            supabase
              .from('projects')
              .select('*', { count: 'exact', head: true })
              .eq('department_id', dept.id)
          ]);

          return {
            ...dept,
            user_count: userCountResult.count || 0,
            project_count: projectCountResult.count || 0
          };
        })
      );

      setDepartments(departmentsWithCounts);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast({
        title: "Error",
        description: "Failed to load departments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createDepartment = async (data: DepartmentFormData) => {
    try {
      const { data: newDepartment, error } = await supabase
        .from('departments')
        .insert([{ name: data.name }])
        .select()
        .single();

      if (error) throw error;

      setDepartments([...departments, { ...newDepartment, user_count: 0, project_count: 0 }]);
      setIsCreateOpen(false);
      form.reset();

      toast({
        title: "Department created",
        description: `${data.name} has been created successfully`
      });
    } catch (error) {
      console.error('Error creating department:', error);
      toast({
        title: "Error",
        description: "Failed to create department",
        variant: "destructive"
      });
    }
  };

  const updateDepartment = async (data: DepartmentFormData) => {
    if (!editingDepartment) return;

    try {
      const { error } = await supabase
        .from('departments')
        .update({ name: data.name })
        .eq('id', editingDepartment.id);

      if (error) throw error;

      setDepartments(departments.map(dept =>
        dept.id === editingDepartment.id
          ? { ...dept, name: data.name }
          : dept
      ));

      setIsEditOpen(false);
      setEditingDepartment(null);
      editForm.reset();

      toast({
        title: "Department updated",
        description: `Department has been updated successfully`
      });
    } catch (error) {
      console.error('Error updating department:', error);
      toast({
        title: "Error",
        description: "Failed to update department",
        variant: "destructive"
      });
    }
  };

  const deleteDepartment = async (department: Department) => {
    try {
      const { error } = await supabase
        .from('departments')
        .delete()
        .eq('id', department.id);

      if (error) throw error;

      setDepartments(departments.filter(dept => dept.id !== department.id));

      toast({
        title: "Department deleted",
        description: `${department.name} has been deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting department:', error);
      toast({
        title: "Error",
        description: "Failed to delete department. Make sure no users or projects are assigned to this department.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    editForm.setValue('name', department.name);
    setIsEditOpen(true);
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
          <p className="text-muted-foreground">Loading departments...</p>
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
            <Building className="h-8 w-8" />
            Department Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage academic departments
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Department</DialogTitle>
              <DialogDescription>
                Add a new academic department to the system
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(createDepartment)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Computer Science" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Department</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Departments</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departments.length}</div>
            <p className="text-xs text-muted-foreground">
              Active departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((sum, dept) => sum + (dept.user_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {departments.reduce((sum, dept) => sum + (dept.project_count || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all departments
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Departments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Departments ({departments.length})</CardTitle>
          <CardDescription>
            Manage academic departments and their assignments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department Name</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Projects</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell>
                      <div className="font-medium">{department.name}</div>
                      <div className="text-sm text-muted-foreground">
                        ID: {department.id.slice(0, 8)}...
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {department.user_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {department.project_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(department.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(department)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Department</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{department.name}"? This action cannot be undone. 
                                Make sure no users or projects are assigned to this department before deleting.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteDepartment(department)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Department
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {departments.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No departments found</p>
              <p className="text-sm">Create your first department to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Department Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Update the department information
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(updateDepartment)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Computer Science" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Department</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDepartments;