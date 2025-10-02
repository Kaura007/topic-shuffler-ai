import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { userProfile, userRole, isAdmin } = useAuth();

  const hasRole = (role: string) => {
    return userRole === role;
  };

  const isStudent = () => hasRole('student');

  return {
    userProfile,
    isAdmin,
    isStudent,
    hasRole,
    role: userRole
  };
};
