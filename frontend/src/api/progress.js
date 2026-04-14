import axiosInstance from "../lib/axios";

export const progressApi = {
  async getMe() {
    const { data } = await axiosInstance.get("/progress/me");
    return data;
  },

  async recordDsaSolved(problemId) {
    const { data } = await axiosInstance.post("/progress/dsa/solved", { problemId });
    return data;
  },

  async recordDsaPublicCleared(problemId) {
    const { data } = await axiosInstance.post("/progress/dsa/public-cleared", { problemId });
    return data;
  },
};
