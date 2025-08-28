import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, FileText, User } from 'lucide-react';

interface DuplicateWarningProps {
  duplicates: Array<{ project: any, similarity: number }>;
  severity: 'warning' | 'error';
  onDismiss?: () => void;
}

export const DuplicateWarning = ({ duplicates, severity, onDismiss }: DuplicateWarningProps) => {
  if (duplicates.length === 0) return null;

  const isBlocking = severity === 'error' && duplicates.some(d => d.similarity > 0.85);

  return (
    <Alert className={`${severity === 'error' ? 'border-destructive bg-destructive/10' : 'border-warning bg-warning/10'}`}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="space-y-3">
        <div>
          <strong>
            {isBlocking ? 'Duplicate Detected - Submission Blocked' : 'Potential Duplicates Found'}
          </strong>
          <p className="text-sm mt-1">
            {isBlocking 
              ? 'Your project appears to be very similar to existing submissions. Please review and modify before submitting.'
              : `Found ${duplicates.length} similar project(s). Please review to ensure your work is original.`
            }
          </p>
        </div>

        <div className="space-y-2">
          {duplicates.slice(0, 3).map((duplicate, index) => (
            <Card key={index} className="border-border/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3" />
                    Similar Project #{index + 1}
                  </div>
                  <Badge 
                    variant={duplicate.similarity > 0.85 ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {Math.round(duplicate.similarity * 100)}% similar
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  <p className="font-medium text-sm line-clamp-1">{duplicate.project.title}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {duplicate.project.profiles?.name || 'Unknown author'} • {duplicate.project.year}
                  </p>
                  {duplicate.project.abstract && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {duplicate.project.abstract.substring(0, 120)}...
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          
          {duplicates.length > 3 && (
            <p className="text-xs text-muted-foreground">
              + {duplicates.length - 3} more similar projects found
            </p>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};