import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileViewer } from '@/components/FileViewer';
import AdvancedSearch from '@/components/AdvancedSearch';
import { BookOpen, Plus, Calendar, Building, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  title: string;
  abstract: string | null;
  year: number;
  created_at: string;
  updated_at: string;
  file_url: string | null;
  tags: string[];
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

interface SearchFilters {
  query: string;
  year: string;
  department: string;
  tags: string[];
  author: string;
}

const Projects = () => {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    year: 'all',
    department: 'all',
    tags: [],
    author: 'all'
  });

  useEffect(() => {
    fetchData();
  }, [user]);

  useEffect(() => {
    filterProjects();
  }, [projects, filters]);

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

      // Fetch user's role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      // If not admin, only show user's own projects
      if (roleData?.role !== 'admin') {
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

  const filterProjects = async () => {
    let filtered = projects;

    // Enhanced search with full-text search
    if (filters.query) {
      // Use PostgreSQL full-text search for better matching
      const { data: searchResults, error } = await supabase
        .from('projects')
        .select(`
          *,
          departments(name),
          profiles(name)
        `)
        .textSearch('title', filters.query)
        .order('created_at', { ascending: false });

      if (!error && searchResults) {
        // Get IDs of full-text search results
        const searchIds = searchResults.map(p => p.id);
        
        // Filter current projects based on search results and fallback to simple text search
        filtered = filtered.filter(project =>
          searchIds.includes(project.id) ||
          project.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          project.abstract?.toLowerCase().includes(filters.query.toLowerCase()) ||
          project.profiles.name.toLowerCase().includes(filters.query.toLowerCase()) ||
          project.departments.name.toLowerCase().includes(filters.query.toLowerCase()) ||
          project.tags.some(tag => tag.toLowerCase().includes(filters.query.toLowerCase()))
        );
      } else {
        // Fallback to simple text search
        filtered = filtered.filter(project =>
          project.title.toLowerCase().includes(filters.query.toLowerCase()) ||
          project.abstract?.toLowerCase().includes(filters.query.toLowerCase()) ||
          project.profiles.name.toLowerCase().includes(filters.query.toLowerCase()) ||
          project.departments.name.toLowerCase().includes(filters.query.toLowerCase()) ||
          project.tags.some(tag => tag.toLowerCase().includes(filters.query.toLowerCase()))
        );
      }
    }

    // Year filter
    if (filters.year !== 'all') {
      filtered = filtered.filter(project => project.year.toString() === filters.year);
    }

    // Department filter
    if (filters.department !== 'all') {
      filtered = filtered.filter(project => project.departments.name === filters.department);
    }

    // Tags filter
    if (filters.tags.length > 0) {
      filtered = filtered.filter(project =>
        filters.tags.some(tag => project.tags.includes(tag))
      );
    }

    // Author filter
    if (filters.author !== 'all') {
      filtered = filtered.filter(project => project.profiles.name === filters.author);
    }

    setFilteredProjects(filtered);
  };
  
  const getAvailableTags = () => {
    const allTags = projects.flatMap(p => p.tags);
    const uniqueTags = [...new Set(allTags)].sort();
    return uniqueTags;
  };
  
  const getAvailableAuthors = () => {
    const authors = [...new Set(projects.map(p => p.profiles.name))].sort();
    return authors;
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
            {userRole === 'admin' ? 'All Projects' : 'My Projects'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {userRole === 'admin' 
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

      {/* Advanced Search */}
      <AdvancedSearch
        filters={filters}
        onFiltersChange={setFilters}
        departments={departments}
        availableYears={getAvailableYears()}
        availableTags={getAvailableTags()}
        availableAuthors={getAvailableAuthors()}
        isLoading={isLoading}
      />

      {/* Projects List */}
      <div className="space-y-4">
        {filteredProjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.query || filters.year !== 'all' || filters.department !== 'all' || filters.tags.length > 0 || filters.author !== 'all'
                  ? 'Try adjusting your filters or search terms'
                  : 'No projects have been submitted yet'
                }
              </p>
              {!filters.query && filters.year === 'all' && filters.department === 'all' && filters.tags.length === 0 && filters.author === 'all' && (
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
                      {project.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 ml-2">
                          {project.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs">
                              <Tag className="h-2 w-2" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
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