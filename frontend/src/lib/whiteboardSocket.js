import { io } from "socket.io-client";

let socket = null;
let authTokenGetter = null;

export function setWhiteboardAuthTokenGetter(getter) {
  authTokenGetter = getter;
}

export function getWhiteboardSocket() {
  if (socket) return socket;

  const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
  socket = io(apiUrl, {
    withCredentials: true,
    transports: ["websocket", "polling"],
    auth: async (cb) => {
      try {
        const token = authTokenGetter ? await authTokenGetter() : null;
        cb({ token });
      } catch {
        cb({ token: null });
      }
    },
  });

  return socket;
}
