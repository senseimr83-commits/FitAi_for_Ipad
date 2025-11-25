import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useAuth() {
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: () => api.getUser(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}
