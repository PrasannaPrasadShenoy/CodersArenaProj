import axiosInstance from "../lib/axios";

export const adminApi = {
  checkAdmin: () => axiosInstance.get("/admin/check").then((r) => r.data),
  getStats: () => axiosInstance.get("/admin/stats").then((r) => r.data),
  getUsers: (params = {}) =>
    axiosInstance.get("/admin/users", { params }).then((r) => r.data),
  updateUserRole: (id, role) =>
    axiosInstance.patch(`/admin/users/${id}/role`, { role }).then((r) => r.data),
  getSubmissions: (params = {}) =>
    axiosInstance.get("/admin/submissions", { params }).then((r) => r.data),
};
