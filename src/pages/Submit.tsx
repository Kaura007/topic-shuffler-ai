import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ProjectSubmissionForm } from '@/components/ProjectSubmissionForm';

const Submit = () => {
  const navigate = useNavigate();

  const handleSubmissionComplete = (projectId: string) => {
    // Redirect to dashboard or project view after successful submission
    navigate('/dashboard', { 
      state: { 
        message: 'Project submitted successfully!',
        projectId 
      }
    });
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  return (
    <div className="container mx-auto py-6">
      <ProjectSubmissionForm
        onSubmit={handleSubmissionComplete}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default Submit;