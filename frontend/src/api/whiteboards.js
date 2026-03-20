import axiosInstance from "../lib/axios";

export const whiteboardApi = {
  getSnapshot: async (roomId) => {
    const response = await axiosInstance.get(`/whiteboards/${encodeURIComponent(roomId)}`);
    return response.data;
  },
  saveSnapshot: async (roomId, document) => {
    const response = await axiosInstance.put(`/whiteboards/${encodeURIComponent(roomId)}`, {
      document,
    });
    return response.data;
  },
};

