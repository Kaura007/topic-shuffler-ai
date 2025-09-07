import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const { userProfile, isAdmin } = useAuth();

  const hasRole = (role: string) => {
    return userProfile?.role === role;
  };

  const isStudent = () => hasRole('student');

  return {
    userProfile,
    isAdmin,
    isStudent,
    hasRole,
    role: userProfile?.role || null
  };
};