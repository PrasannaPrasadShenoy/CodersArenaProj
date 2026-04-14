import { useMutation, useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { submissionsApi } from "../api/submissions";

export function useCreateDsaSubmission() {
  return useMutation({
    mutationKey: ["submission", "dsa", "create"],
    mutationFn: submissionsApi.createDsaSubmission,
    onError: (error) => {
      const msg =
        error?.response?.data?.message || error?.message || "Failed to submit DSA solution";
      toast.error(msg);
    },
  });
}

export function useCreateMlSubmission() {
  return useMutation({
    mutationKey: ["ml", "submission", "create"],
    mutationFn: submissionsApi.createMlSubmission,
    onError: (error) => {
      const msg = error?.response?.data?.message || error?.message || "Failed to submit ML solution";
      toast.error(msg);
    },
  });
}

export function useSubmissionById(id, options = {}) {
  return useQuery({
    queryKey: ["submission", id],
    queryFn: () => submissionsApi.getSubmissionById(id),
    enabled: !!id,
    refetchInterval: (query) => {
      if (!options.poll) return false;
      const status = query?.state?.data?.submission?.status;
      if (!status) return 2000;
      return ["queued", "running"].includes(status) ? 2000 : false;
    },
  });
}

export function useMlProgress(options = {}) {
  return useQuery({
    queryKey: ["ml", "progress"],
    queryFn: submissionsApi.getMlProgress,
    enabled: options.enabled ?? true,
    staleTime: 1000 * 60,
  });
}
