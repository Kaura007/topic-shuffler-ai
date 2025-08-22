import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, GraduationCap, Users, Shield, Search, FileText, Upload } from 'lucide-react';
import { DuplicateDetector } from '@/components/DuplicateDetector';

const Index = () => {
  const [papers, setPapers] = useState<any[]>([]);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          setPapers(Array.isArray(data) ? data : [data]);
        } catch (error) {
          console.error('Error parsing JSON file:', error);
        }
      };
      reader.readAsText(file);
    }
  };
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Landing page for non-authenticated users
  const features = [
    {
      icon: FileText,
      title: 'Project Submission',
      description: 'Submit and manage your final year projects with ease'
    },
    {
      icon: Search,
      title: 'Smart Duplicate Detection', 
      description: 'AI-powered system prevents topic duplication'
    },
    {
      icon: Users,
      title: 'Department Management',
      description: 'Organize projects by academic departments'
    },
    {
      icon: Shield,
      title: 'Secure Storage',
      description: 'Your academic work is safely stored and protected'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary rounded-full p-2">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-lora font-bold text-foreground">Project Topic Shuffler</h1>
              <p className="text-sm text-muted-foreground">Academic Research Platform</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary rounded-full p-4 mr-4">
              <GraduationCap className="h-12 w-12 text-primary-foreground" />
            </div>
            <BookOpen className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-lora font-bold text-foreground mb-4">
            Academic Excellence Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-inter">
            Streamline your final year project management with intelligent duplicate detection, 
            secure storage, and comprehensive research tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Button size="lg" className="text-lg px-8 py-4" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4" onClick={() => navigate('/auth')}>
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {features.map((feature, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 border-border/50">
              <CardContent className="p-6 text-center">
                <div className="bg-primary/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-lora font-semibold text-foreground mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground font-inter text-sm">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="bg-card/30 backdrop-blur-sm rounded-lg p-8 border border-border/50">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-lora font-bold text-primary mb-2">1,247</div>
              <div className="text-muted-foreground font-inter">Projects Submitted</div>
            </div>
            <div>
              <div className="text-3xl font-lora font-bold text-primary mb-2">98.5%</div>
              <div className="text-muted-foreground font-inter">Duplicate Prevention</div>
            </div>
            <div>
              <div className="text-3xl font-lora font-bold text-primary mb-2">15</div>
              <div className="text-muted-foreground font-inter">Academic Departments</div>
            </div>
          </div>
        </div>

        {papers.length > 0 && (
          <div className="mt-12">
            <DuplicateDetector papers={papers} onDuplicatesFound={setDuplicates} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
