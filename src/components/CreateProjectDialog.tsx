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
  const [formData, setFormData] = useState({
    student_id: '',
    title: '',
    abstract: '',
    year: new Date().getFullYear(),
    department_id: '',
    matriculation_number: ''
  });

  const handleFileUploaded = (fileUrl: string, fileName: string) => {
    // Get public URL from the file path
    const { data: { publicUrl } } = supabase.storage
      .from('project-files')
      .getPublicUrl(fileUrl);
    
    setUploadedFilePath(publicUrl);
  };

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

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

  const handleStudentChange = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    setFormData({
      ...formData,
      student_id: studentId,
      matriculation_number: student?.matriculation_number || ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const projectData = {
        title: formData.title,
        abstract: formData.abstract || null,
        year: formData.year,
        department_id: formData.department_id,
        student_id: formData.student_id,
        file_url: uploadedFilePath || null,
        matriculation_number: formData.matriculation_number || null
      };

      const { error } = await supabase
        .from('projects')
        .insert([projectData]);

      if (error) throw error;

      toast({
        title: "Project created successfully",
        description: `${formData.title} has been added to the system.`
      });

      // Reset form and close dialog
      setFormData({
        student_id: '',
        title: '',
        abstract: '',
        year: new Date().getFullYear(),
        department_id: '',
        matriculation_number: ''
      });
      setUploadedFilePath(null);
      setOpen(false);
      onProjectCreated();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: "Error creating project",
        description: error.message || "Failed to create project",
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
          <div className="space-y-2">
            <Label htmlFor="student">Student</Label>
            <Select
              value={formData.student_id}
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

          <div className="space-y-2">
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter project title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="abstract">Abstract</Label>
            <Textarea
              id="abstract"
              value={formData.abstract}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              placeholder="Enter project abstract or description"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                min={2000}
                max={2100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select
                value={formData.department_id}
                onValueChange={(value) => setFormData({ ...formData, department_id: value })}
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

          <div className="space-y-2">
            <Label htmlFor="matriculation_number">Matriculation Number</Label>
            <Input
              id="matriculation_number"
              value={formData.matriculation_number}
              onChange={(e) => setFormData({ ...formData, matriculation_number: e.target.value })}
              placeholder="Matriculation number"
            />
          </div>

          <div className="space-y-2">
            <Label>Project File (Optional)</Label>
            {formData.student_id ? (
              <FileUpload onFileUploaded={handleFileUploaded} />
            ) : (
              <p className="text-sm text-muted-foreground">
                Please select a student first before uploading a file
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
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
