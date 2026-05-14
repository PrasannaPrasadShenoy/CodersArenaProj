import { useState, useEffect, useRef, useCallback } from "react";
import { StreamChat } from "stream-chat";
import toast from "react-hot-toast";
import { initializeStreamClient, disconnectStreamClient } from "../lib/stream";
import { sessionApi } from "../api/sessions";

const MAX_AUTO_RETRIES = 5;
const RETRY_BASE_MS = 2000;

function useStreamClient(session, loadingSession, isHost, isParticipant) {
  const [streamClient, setStreamClient] = useState(null);
  const [call, setCall] = useState(null);
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [isInitializingCall, setIsInitializingCall] = useState(true);
  const [streamConnectFailed, setStreamConnectFailed] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  const autoRetryCount = useRef(0);
  const retryTimerRef = useRef(null);
  const wasConnected = useRef(false);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  useEffect(() => {
    let videoCall = null;
    let chatClientInstance = null;
    let cancelled = false;

    const initCall = async () => {
      if (!session?.callId || (!isHost && !isParticipant) || session.status === "completed") {
        setIsInitializingCall(false);
        setStreamConnectFailed(false);
        setIsReconnecting(false);
        return;
      }

      const reconnecting = wasConnected.current;
      if (reconnecting) {
        setIsReconnecting(true);
      } else {
        setIsInitializingCall(true);
      }
      setStreamConnectFailed(false);

      try {
        const { token, userId, userName, userImage } = await sessionApi.getStreamToken();
        if (cancelled) return;

        const client = await initializeStreamClient(
          { id: userId, name: userName, image: userImage },
          token
        );
        if (cancelled) return;

        setStreamClient(client);

        videoCall = client.call("default", session.callId);
        await videoCall.join({ create: true });
        if (cancelled) return;
        setCall(videoCall);

        const apiKey = import.meta.env.VITE_STREAM_API_KEY;
        chatClientInstance = StreamChat.getInstance(apiKey);

        await chatClientInstance.connectUser(
          { id: userId, name: userName, image: userImage },
          token
        );
        if (cancelled) return;
        setChatClient(chatClientInstance);

        const chatChannel = chatClientInstance.channel("messaging", session.callId);
        await chatChannel.watch();
        if (cancelled) return;
        setChannel(chatChannel);

        wasConnected.current = true;
        autoRetryCount.current = 0;
        if (reconnecting) toast.success("Reconnected to session");
      } catch (error) {
        if (cancelled) return;
        setStreamClient(null);
        setCall(null);
        setChatClient(null);
        setChannel(null);

        if (autoRetryCount.current < MAX_AUTO_RETRIES) {
          autoRetryCount.current += 1;
          const delay = RETRY_BASE_MS * Math.pow(2, autoRetryCount.current - 1);
          retryTimerRef.current = setTimeout(() => {
            if (!cancelled) setRetryNonce((n) => n + 1);
          }, delay);
        } else {
          setStreamConnectFailed(true);
          if (!reconnecting) toast.error("Failed to join video call");
        }
        console.error("Error init call", error);
      } finally {
        if (!cancelled) {
          setIsInitializingCall(false);
          setIsReconnecting(false);
        }
      }
    };

    if (session && !loadingSession) initCall();

    return () => {
      cancelled = true;
      clearRetryTimer();
      (async () => {
        try {
          if (videoCall) await videoCall.leave();
          if (chatClientInstance) await chatClientInstance.disconnectUser();
          await disconnectStreamClient();
        } catch (error) {
          console.error("Cleanup error:", error);
        }
      })();
    };
  }, [session, loadingSession, isHost, isParticipant, retryNonce]);

  useEffect(() => {
    if (!wasConnected.current) return;

    const handleOnline = () => {
      if (streamConnectFailed || (!call && !isInitializingCall)) {
        autoRetryCount.current = 0;
        setRetryNonce((n) => n + 1);
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [streamConnectFailed, call, isInitializingCall]);

  const retryStreamConnect = useCallback(() => {
    autoRetryCount.current = 0;
    clearRetryTimer();
    setRetryNonce((n) => n + 1);
  }, []);

  return {
    streamClient,
    call,
    chatClient,
    channel,
    isInitializingCall,
    streamConnectFailed,
    isReconnecting,
    retryStreamConnect,
  };
}

export default useStreamClient;
