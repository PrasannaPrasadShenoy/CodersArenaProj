import { io } from "socket.io-client";

let socket = null;

export function getWhiteboardSocket() {
  if (socket) return socket;

  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  socket = io(apiUrl, {
    withCredentials: true,
    transports: ["websocket", "polling"],
  });

  return socket;
}

