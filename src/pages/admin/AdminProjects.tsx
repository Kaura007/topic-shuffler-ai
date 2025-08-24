import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileViewer } from '@/components/FileViewer';
import { BookOpen, Search, Calendar, Building, User, FileText, Trash2, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  abstract: string | null;
  year: number;
  created_at: string;
  updated_at: string;
  file_url: string | null;
  student_id: string;
  department_id: string;
  departments: {
    name: string;
  };
  profiles: {
    name: string;
  };
}

interface Department {
  id: string;
  name: string;
}

const AdminProjects = () => {
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch all projects with student and department info
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          departments(name),
          profiles!projects_student_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      // Fetch departments
      const { data: departmentsData, error: departmentsError } = await supabase
        .from('departments')
        .select('*')
        .order('name');

      if (departmentsError) throw departmentsError;

      setProjects(projectsData || []);
      setDepartments(departmentsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteProject = async (project: Project) => {
    try {
      // Delete the file from storage if it exists
      if (project.file_url) {
        const fileName = project.file_url.split('/').pop();
        if (fileName) {
          await supabase.storage
            .from('project-files')
            .remove([`${project.student_id}/${fileName}`]);
        }
      }

      // Delete the project from database
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', project.id);

      if (error) throw error;

      // Remove from local state
      setProjects(projects.filter(p => p.id !== project.id));

      toast({
        title: "Project deleted",
        description: "Project has been permanently deleted"
      });
    } catch (error) {
      console.error('Error deleting project:', error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive"
      });
    }
  };

  const viewProject = (project: Project) => {
    setSelectedProject(project);
    setIsViewerOpen(true);
  };

  // Filter projects based on search and filters
  const filteredProjects = projects.filter(project => {
    const matchesSearch = 
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.profiles?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.abstract || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.departments?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesYear = yearFilter === 'all' || project.year.toString() === yearFilter;
    const matchesDepartment = departmentFilter === 'all' || project.department_id === departmentFilter;

    return matchesSearch && matchesYear && matchesDepartment;
  });

  // Get unique years from projects
  const availableYears = Array.from(new Set(projects.map(p => p.year))).sort((a, b) => b - a);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getProjectStats = () => {
    const totalProjects = projects.length;
    const thisYearProjects = projects.filter(p => p.year === new Date().getFullYear()).length;
    const projectsWithFiles = projects.filter(p => p.file_url).length;

    return { totalProjects, thisYearProjects, projectsWithFiles };
  };

  const stats = getProjectStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
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
            <BookOpen className="h-8 w-8" />
            Project Management
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage all research projects
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              All submitted projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Year</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisYearProjects}</div>
            <p className="text-xs text-muted-foreground">
              Projects in {new Date().getFullYear()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Files</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectsWithFiles}</div>
            <p className="text-xs text-muted-foreground">
              Projects with attachments
            </p>
          </CardContent>
        </Card>
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
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
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

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle>Projects ({filteredProjects.length})</CardTitle>
          <CardDescription>
            Manage research projects and submissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <div className="max-w-[300px]">
                        <div className="font-medium line-clamp-1">{project.title}</div>
                        {project.abstract && (
                          <div className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {project.abstract}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {project.profiles?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        {project.departments?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{project.year}</Badge>
                    </TableCell>
                    <TableCell>
                      {project.file_url ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Attached</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">None</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(project.created_at)}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewProject(project)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Project</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{project.title}"? This action cannot be undone and will permanently remove the project and any associated files.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteProject(project)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete Project
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

          {filteredProjects.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No projects found</p>
              <p className="text-sm">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Viewer Dialog */}
      {selectedProject && (
        <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProject.title}</DialogTitle>
              <DialogDescription>
                By {selectedProject.profiles?.name} • {selectedProject.departments?.name} • {selectedProject.year}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Project Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Student:</span> {selectedProject.profiles?.name}
                </div>
                <div>
                  <span className="font-medium">Department:</span> {selectedProject.departments?.name}
                </div>
                <div>
                  <span className="font-medium">Year:</span> {selectedProject.year}
                </div>
                <div>
                  <span className="font-medium">Submitted:</span> {formatDate(selectedProject.created_at)}
                </div>
              </div>

              {/* Abstract */}
              {selectedProject.abstract && (
                <div>
                  <h4 className="font-medium mb-2">Abstract</h4>
                  <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    {selectedProject.abstract}
                  </p>
                </div>
              )}

              {/* File Viewer */}
              {selectedProject.file_url && (
                <div>
                  <h4 className="font-medium mb-2">Attached Document</h4>
                  <FileViewer
                    fileUrl={selectedProject.file_url}
                    fileName={selectedProject.title}
                    showPreview={true}
                  />
                </div>
              )}

              {!selectedProject.file_url && (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No document attached to this project</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminProjects;