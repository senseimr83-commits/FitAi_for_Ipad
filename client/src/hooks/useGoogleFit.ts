import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export function useGoogleFit() {
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ['google-fit-status'],
    queryFn: () => api.getGoogleFitStatus(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const connectMutation = useMutation({
    mutationFn: async () => {
      const { authUrl } = await api.getGoogleFitAuthUrl();
      window.location.href = authUrl;
    },
    onError: (error: Error) => {
      toast.error(`Failed to connect: ${error.message}`);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => api.disconnectGoogleFit(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['google-fit-status'] });
      toast.success('Google Fit disconnected');
    },
    onError: (error: Error) => {
      toast.error(`Failed to disconnect: ${error.message}`);
    },
  });

  const syncMutation = useMutation({
    mutationFn: (params?: { startDate?: string; endDate?: string }) => 
      api.syncGoogleFit(params?.startDate, params?.endDate),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fitness-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['latest-insight'] });
      toast.success(data.message);
    },
    onError: (error: Error) => {
      toast.error(`Sync failed: ${error.message}`);
    },
  });

  return {
    status,
    isLoading,
    isConnected: status?.connected || false,
    connect: connectMutation.mutate,
    disconnect: disconnectMutation.mutate,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
  };
}
