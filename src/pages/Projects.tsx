import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileViewer } from '@/components/FileViewer';
import { BookOpen, Search, Filter, Plus, Calendar, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  abstract: string | null;
  year: number;
  created_at: string;
  updated_at: string;
  file_url: string | null;
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

const Projects = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    filterProjects();
  }, [projects, searchQuery, selectedYear, selectedDepartment]);

  const fetchData = async () => {
    if (!user) return;

    try {
      // Get user profile first
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);

      // Fetch projects - if user is admin, get all projects; otherwise get only their own
      let query = supabase
        .from('projects')
        .select(`
          *,
          departments(name),
          profiles(name)
        `)
        .order('created_at', { ascending: false });

      // If not admin, only show user's own projects
      if (profile.role !== 'admin') {
        query = query.eq('student_id', profile.id);
      }

      const { data: projectsData, error: projectsError } = await query;

      if (projectsError) throw projectsError;

      setProjects(projectsData || []);
      setFilteredProjects(projectsData || []);

      // Fetch departments for filtering
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (deptError) throw deptError;

      setDepartments(deptData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading projects",
        description: "Please refresh and try again",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterProjects = () => {
    let filtered = projects;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.abstract?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.profiles.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.departments.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Year filter
    if (selectedYear !== 'all') {
      filtered = filtered.filter(project => project.year.toString() === selectedYear);
    }

    // Department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(project => project.departments.name === selectedDepartment);
    }

    setFilteredProjects(filtered);
  };

  const getAvailableYears = () => {
    const years = [...new Set(projects.map(p => p.year))].sort((a, b) => b - a);
    return years;
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
            {userProfile?.role === 'admin' ? 'All Projects' : 'My Projects'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userProfile?.role === 'admin' 
              ? `Managing ${filteredProjects.length} of ${projects.length} projects`
              : `${filteredProjects.length} projects found`
            }
          </p>
        </div>
        <Button onClick={() => window.location.href = '/submit'}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects, authors, departments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="All years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All years</SelectItem>
                  {getAvailableYears().map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedYear !== 'all' || selectedDepartment !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'No projects have been submitted yet'
                }
              </p>
              {!searchQuery && selectedYear === 'all' && selectedDepartment === 'all' && (
                <Button onClick={() => window.location.href = '/submit'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredProjects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{project.title}</CardTitle>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge variant="secondary">{project.year}</Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Building className="h-3 w-3" />
                        {project.departments.name}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(project.created_at)}
                      </Badge>
                    </div>
                    <CardDescription>
                      By {project.profiles.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.abstract && (
                  <div>
                    <h4 className="font-medium mb-2">Abstract</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {project.abstract}
                    </p>
                  </div>
                )}

                <FileViewer
                  fileUrl={project.file_url}
                  fileName={`${project.title}.pdf`}
                  className="border-0 bg-muted/30"
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Projects;