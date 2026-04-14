import axiosInstance from "../lib/axios";

export const submissionsApi = {
  createDsaSubmission: async ({ problemId, language, code }) => {
    const response = await axiosInstance.post("/submissions/dsa", {
      problemId,
      language,
      code,
    });
    return response.data;
  },

  createMlSubmission: async ({ problemId, code }) => {
    const response = await axiosInstance.post("/submissions/ml", {
      problemId,
      language: "python",
      code,
    });
    return response.data;
  },

  getSubmissionById: async (id) => {
    const response = await axiosInstance.get(`/submissions/${id}`);
    return response.data;
  },

  getMlProgress: async () => {
    const response = await axiosInstance.get("/submissions/progress/ml");
    return response.data;
  },
};
