import { io } from "socket.io-client";
import { getSocketBaseUrl } from "./backendBaseUrl";

let socket = null;
let authTokenGetter = null;

export function setWhiteboardAuthTokenGetter(getter) {
  authTokenGetter = getter;
}

export function getWhiteboardSocket() {
  if (socket) return socket;

  const url = getSocketBaseUrl();
  socket = io(url, {
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
