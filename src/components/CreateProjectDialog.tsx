import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/FileUpload';

interface Department {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  user_id: string;
  matriculation_number: string | null;
}

interface CreateProjectDialogProps {
  departments: Department[];
  onProjectCreated: () => void;
}

export const CreateProjectDialog: React.FC<CreateProjectDialogProps> = ({ departments, onProjectCreated }) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  
  // Separate state for each field to avoid conflicts
  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [departmentId, setDepartmentId] = useState('');
  const [matriculationNumber, setMatriculationNumber] = useState('');

  const handleFileUploaded = (fileUrl: string, fileName: string) => {
    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(fileUrl);
    
    setUploadedFilePath(publicUrl);
  };

  useEffect(() => {
    if (open) {
      fetchStudents();
      // Reset all fields when dialog opens
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setStudentId('');
    setTitle('');
    setAbstract('');
    setYear(new Date().getFullYear());
    setDepartmentId('');
    setMatriculationNumber('');
    setUploadedFilePath(null);
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, user_id, matriculation_number')
        .eq('role', 'student')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to load students",
        variant: "destructive"
      });
    }
  };

  const handleStudentChange = (selectedStudentId: string) => {
    setStudentId(selectedStudentId);
    
    // Auto-fill matriculation number if student has one
    const student = students.find(s => s.id === selectedStudentId);
    if (student?.matriculation_number) {
      setMatriculationNumber(student.matriculation_number);
    } else {
      // Clear it if student doesn't have one
      setMatriculationNumber('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!studentId) {
      toast({
        title: "Validation Error",
        description: "Please select a student",
        variant: "destructive"
      });
      return;
    }
    
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a project title",
        variant: "destructive"
      });
      return;
    }
    
    if (!departmentId) {
      toast({
        title: "Validation Error",
        description: "Please select a department",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const projectData = {
        title: title.trim(),
        abstract: abstract.trim() || null,
        year: year,
        department_id: departmentId,
        student_id: studentId,
        file_url: uploadedFilePath || null,
        matriculation_number: matriculationNumber.trim() || null
      };

      console.log('Submitting project data:', projectData);

      const { error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Project "${title}" has been created successfully.`
      });

      resetForm();
      setOpen(false);
      onProjectCreated();
      
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: error.message || "Failed to create project. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new research project to the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="student">Student *</Label>
            <Select
              value={studentId}
              onValueChange={handleStudentChange}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name} {student.matriculation_number && `(${student.matriculation_number})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Matriculation Number */}
          <div className="space-y-2">
            <Label htmlFor="matriculation_number">Matriculation Number</Label>
            <Input
              id="matriculation_number"
              type="text"
              value={matriculationNumber}
              onChange={(e) => setMatriculationNumber(e.target.value)}
              placeholder="Enter matriculation number"
            />
            <p className="text-xs text-muted-foreground">
              {studentId 
                ? "Auto-filled from student profile. You can edit or add if missing." 
                : "Select a student first"}
            </p>
          </div>

          {/* Project Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
              required
            />
          </div>

          {/* Abstract */}
          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Enter project abstract or description"
              rows={4}
            />
          </div>

          {/* Year and Department */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year *</Label>
              <Input
                id="year"
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                min={2000}
                max={2100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select
                value={departmentId}
                onValueChange={setDepartmentId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Project File (Optional)</Label>
            {studentId ? (
              <FileUpload onFileUploaded={handleFileUploaded} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Please select a student first before uploading a file
              </p>
            )}
            {uploadedFilePath && (
              <p className="text-xs text-green-600">
                ✓ File uploaded successfully
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
