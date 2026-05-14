import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminApi } from "../api/admin";

export function useIsAdmin() {
  const query = useQuery({
    queryKey: ["admin", "check"],
    queryFn: adminApi.checkAdmin,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return { isAdmin: query.data?.isAdmin === true, isLoading: query.isLoading };
}

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: adminApi.getStats,
    staleTime: 30_000,
  });
}

export function useAdminUsers(params = {}) {
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => adminApi.getUsers(params),
    staleTime: 15_000,
  });
}

export function useUpdateUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }) => adminApi.updateUserRole(id, role),
    onSuccess: () => {
      toast.success("User role updated");
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
    onError: (err) =>
      toast.error(err.response?.data?.error || "Failed to update role"),
  });
}

export function useAdminSubmissions(params = {}) {
  return useQuery({
    queryKey: ["admin", "submissions", params],
    queryFn: () => adminApi.getSubmissions(params),
    staleTime: 15_000,
  });
}
