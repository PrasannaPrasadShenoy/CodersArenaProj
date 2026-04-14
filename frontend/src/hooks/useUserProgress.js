import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { progressApi } from "../api/progress";

export const progressQueryKey = ["progress", "me"];

export function useUserProgress(options = {}) {
  return useQuery({
    queryKey: progressQueryKey,
    queryFn: progressApi.getMe,
    enabled: options.enabled ?? true,
    staleTime: 1000 * 30,
  });
}

export function useRecordDsaSolved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (problemId) => progressApi.recordDsaSolved(problemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressQueryKey });
    },
  });
}

export function useRecordDsaPublicCleared() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (problemId) => progressApi.recordDsaPublicCleared(problemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressQueryKey });
    },
  });
}
