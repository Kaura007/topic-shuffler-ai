import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from '@/components/FileUpload';
import { DuplicateWarning } from '@/components/DuplicateWarning';
import { useToast } from '@/hooks/use-toast';
import { quickDuplicateCheck, checkProjectForDuplicates } from '@/lib/duplicateDetection';
import { Loader2, Upload, Shield, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCallback, useRef } from 'react';

const projectSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  abstract: z.string().min(50, 'Abstract must be at least 50 characters'),
  year: z.number().min(2020).max(new Date().getFullYear() + 1),
  department_id: z.string().uuid('Please select a department'),
  tags: z.array(z.string()).default([]).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface Department {
  id: string;
  name: string;
}

interface ProjectSubmissionFormProps {
  onSubmit?: (projectId: string) => void;
  onCancel?: () => void;
}

export const ProjectSubmissionForm: React.FC<ProjectSubmissionFormProps> = ({
  onSubmit,
  onCancel
}) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [students, setStudents] = useState<Array<{ id: string; name: string; matriculation_number: string | null }>>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [manualMatricNumber, setManualMatricNumber] = useState<string>('');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicates, setDuplicates] = useState<Array<{ project: any, similarity: number }>>([]);
  const [isDuplicateChecking, setIsDuplicateChecking] = useState(false);
  const [duplicateCheckCompleted, setDuplicateCheckCompleted] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const checkTimeoutRef = useRef<NodeJS.Timeout>();

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: '',
      abstract: '',
      year: new Date().getFullYear(),
      department_id: '',
      tags: []
    }
  });

  useEffect(() => {
    fetchInitialData();
  }, [user]);

  const fetchInitialData = async () => {
    if (!user) return;

    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      setUserProfile(profile);

      // Pre-fill department if user has one
      if (profile.department_id) {
        form.setValue('department_id', profile.department_id);
      }

      // Fetch departments
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (deptError) throw deptError;

      setDepartments(deptData || []);

      // Fetch all students if user is admin
      if (isAdmin) {
        const { data: studentsData, error: studentsError } = await supabase
          .from('profiles')
          .select('id, name, matriculation_number')
          .eq('role', 'student')
          .order('name');

        if (studentsError) throw studentsError;

        setStudents(studentsData || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error loading form data",
        description: "Please refresh and try again",
        variant: "destructive"
      });
    }
  };

  const handleFileUploaded = (fileUrl: string, fileName: string) => {
    setUploadedFile({ url: fileUrl, name: fileName });
  };

  // Debounced duplicate checking
  const checkDuplicates = useCallback(async (title: string, abstract: string) => {
    if (!title.trim() || title.length < 5) {
      setDuplicates([]);
      setDuplicateCheckCompleted(false);
      return;
    }

    setIsDuplicateChecking(true);
    
    try {
      // Quick check first
      const quickResults = await quickDuplicateCheck(title, abstract);
      setDuplicates(quickResults);
      
      // If quick check finds high similarity, do AI check
      if (quickResults.some(d => d.similarity > 0.7)) {
        const aiResults = await checkProjectForDuplicates({ title, abstract }, 0.75);
        setDuplicates(aiResults);
      }
      
      setDuplicateCheckCompleted(true);
    } catch (error) {
      console.error('Error checking duplicates:', error);
    } finally {
      setIsDuplicateChecking(false);
    }
  }, []);

  // Debounced check trigger
  const triggerDuplicateCheck = useCallback((title: string, abstract: string) => {
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current);
    }
    
    checkTimeoutRef.current = setTimeout(() => {
      checkDuplicates(title, abstract);
    }, 1000); // 1 second delay
  }, [checkDuplicates]);

  const onFormSubmit = async (data: ProjectFormData) => {
    // Validate based on user role
    if (isAdmin) {
      if (!selectedStudentId) {
        toast({
          title: "Student selection required",
          description: "Please select a student for this project",
          variant: "destructive"
        });
        return;
      }
      if (!manualMatricNumber.trim()) {
        toast({
          title: "Matriculation number required",
          description: "Please enter the student's matriculation number",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!userProfile) {
        toast({
          title: "Profile not loaded",
          description: "Please refresh and try again",
          variant: "destructive"
        });
        return;
      }
    }

    // Check for blocking duplicates
    const highSimilarityDuplicates = duplicates.filter(d => d.similarity > 0.85);
    if (highSimilarityDuplicates.length > 0) {
      toast({
        title: "Duplicate content detected",
        description: "Please modify your project to make it more unique before submitting",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        title: data.title,
        abstract: data.abstract,
        year: data.year,
        department_id: data.department_id,
        student_id: isAdmin ? selectedStudentId : userProfile.id,
        file_url: uploadedFile?.url || null,
        tags: data.tags || [],
        matriculation_number: isAdmin ? manualMatricNumber : (userProfile.matriculation_number || null)
      };

      const { data: project, error } = await supabase
        .from('projects')
        .insert([projectData])
        .select()
        .single();

      if (error) throw error;

      // Create history log
      await supabase
        .from('history_logs')
        .insert([{
          user_id: user!.id,
          action: 'project_created',
          project_id: project.id,
          details: {
            title: data.title,
            file_uploaded: !!uploadedFile
          }
        }]);

      toast({
        title: "Project submitted successfully",
        description: "Your project has been submitted for review",
      });

      onSubmit?.(project.id);

    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Submit New Project
        </CardTitle>
        <CardDescription>
          Fill out the form below to submit your research project
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your project title"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const currentAbstract = form.getValues('abstract');
                        triggerDuplicateCheck(e.target.value, currentAbstract);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                  {isDuplicateChecking && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Checking for duplicates...
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abstract"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abstract *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide a detailed abstract of your project (minimum 50 characters)"
                      className="min-h-32"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        const currentTitle = form.getValues('title');
                        triggerDuplicateCheck(currentTitle, e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    Briefly describe your research objectives, methodology, and findings
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Student Info Section */}
            {isAdmin ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel>Select Student *</FormLabel>
                  <Select 
                    value={selectedStudentId} 
                    onValueChange={(value) => {
                      setSelectedStudentId(value);
                      const student = students.find(s => s.id === value);
                      if (student?.matriculation_number) {
                        setManualMatricNumber(student.matriculation_number);
                      } else {
                        setManualMatricNumber('');
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} {student.matriculation_number ? `(${student.matriculation_number})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the student for this project
                  </FormDescription>
                </div>

                <div className="space-y-2">
                  <FormLabel>Matriculation Number *</FormLabel>
                  <Input 
                    value={manualMatricNumber} 
                    onChange={(e) => setManualMatricNumber(e.target.value)}
                    placeholder="Enter matriculation number"
                  />
                  <FormDescription>
                    Enter the student's matriculation number
                  </FormDescription>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel>Student Name</FormLabel>
                  <Input 
                    value={userProfile?.name || 'Loading...'} 
                    disabled 
                    className="bg-muted"
                  />
                  <FormDescription>
                    Your registered name from your profile
                  </FormDescription>
                </div>

                <div className="space-y-2">
                  <FormLabel>Matriculation Number</FormLabel>
                  <Input 
                    value={userProfile?.matriculation_number || 'Not set'} 
                    disabled 
                    className="bg-muted"
                  />
                  <FormDescription>
                    {userProfile?.matriculation_number ? 
                      'Your matriculation number from your profile' : 
                      'Update your matriculation number in your profile'
                    }
                  </FormDescription>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min={2020}
                        max={new Date().getFullYear() + 1}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="department_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((dept) => (
                          <SelectItem key={dept.id} value={dept.id}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tags Field */}
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add tags (e.g., AI, Machine Learning, Data Science)"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && tagInput.trim()) {
                              e.preventDefault();
                              const newTag = tagInput.trim();
                              if (!field.value?.includes(newTag)) {
                                field.onChange([...(field.value || []), newTag]);
                              }
                              setTagInput('');
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            if (tagInput.trim() && !field.value?.includes(tagInput.trim())) {
                              field.onChange([...(field.value || []), tagInput.trim()]);
                              setTagInput('');
                            }
                          }}
                        >
                          Add
                        </Button>
                      </div>
                      {field.value && field.value.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {field.value.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button
                                type="button"
                                onClick={() => {
                                  const newTags = field.value?.filter((_, i) => i !== index);
                                  field.onChange(newTags);
                                }}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Add relevant tags to help others find your project (press Enter or click Add)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <FormLabel className="text-base font-medium mb-3 block">
                Project Document
              </FormLabel>
              <FileUpload
                onFileUploaded={handleFileUploaded}
                className="mt-2"
              />
              {uploadedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Uploaded: {uploadedFile.name}
                </p>
              )}
            </div>

            {/* Duplicate Detection Results */}
            {duplicates.length > 0 && (
              <DuplicateWarning 
                duplicates={duplicates}
                severity={duplicates.some(d => d.similarity > 0.85) ? 'error' : 'warning'}
              />
            )}

            {/* Duplicate Check Status */}
            {duplicateCheckCompleted && duplicates.length === 0 && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  No similar projects detected. Your submission appears to be original.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || duplicates.some(d => d.similarity > 0.85)}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Project'
                )}
              </Button>
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProjectSubmissionForm;