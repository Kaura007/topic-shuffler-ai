import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, GraduationCap, Users, Shield, Search, FileText } from 'lucide-react';

const Index = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse flex items-center justify-center mb-4">
            <BookOpen className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-lora font-semibold text-foreground">Loading...</h1>
        </div>
      </div>
    );
  }

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
            <span className="text-sm text-muted-foreground">Welcome back!</span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4">
              <FileText className="mr-2 h-5 w-5" />
              Submit Project
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4">
              <Search className="mr-2 h-5 w-5" />
              Browse Projects
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
      </main>
    </div>
  );
};

export default Index;
