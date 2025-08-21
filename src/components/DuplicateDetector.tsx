import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { findDuplicates } from '@/lib/duplicateDetection';
import { AlertCircle, FileText, Users } from 'lucide-react';

interface DuplicateDetectorProps {
  papers: any[];
  onDuplicatesFound: (duplicates: any[]) => void;
}

export const DuplicateDetector = ({ papers, onDuplicatesFound }: DuplicateDetectorProps) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duplicates, setDuplicates] = useState<any[]>([]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setProgress(0);
    setDuplicates([]);

    try {
      const foundDuplicates = await findDuplicates(
        papers,
        0.85, // 85% similarity threshold
        (current, total) => {
          setProgress((current / total) * 100);
        }
      );

      setDuplicates(foundDuplicates);
      onDuplicatesFound(foundDuplicates);
    } catch (error) {
      console.error('Error analyzing duplicates:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            AI Duplicate Detection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {papers.length} papers ready for analysis
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing || papers.length < 2}
              className="bg-primary hover:bg-primary/90"
            >
              {isAnalyzing ? 'Analyzing...' : 'Detect Duplicates'}
            </Button>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing papers...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          )}

          {duplicates.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Found {duplicates.length} potential duplicate(s)
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {duplicates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Detected Duplicates</h3>
          {duplicates.map((duplicate, index) => (
            <Card key={index} className="border-destructive/20 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-base">Match #{index + 1}</span>
                  <Badge variant="destructive">
                    {Math.round(duplicate.similarity * 100)}% similar
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Paper 1</h4>
                    <p className="text-sm font-medium">{duplicate.paper1.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {Array.isArray(duplicate.paper1.authors) 
                        ? duplicate.paper1.authors.join(', ') 
                        : duplicate.paper1.authors || 'Unknown authors'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Paper 2</h4>
                    <p className="text-sm font-medium">{duplicate.paper2.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {Array.isArray(duplicate.paper2.authors) 
                        ? duplicate.paper2.authors.join(', ') 
                        : duplicate.paper2.authors || 'Unknown authors'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};