import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Tldraw, getSnapshot, loadSnapshot } from "tldraw";
import { whiteboardApi } from "../api/whiteboards";
import { getWhiteboardSocket } from "../lib/whiteboardSocket";

function hashToHue(input) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash % 360;
}

function hslToHex(h, s, l) {
  // h: [0..360), s/l: [0..100]
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x) => Math.round(255 * x).toString(16).padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export default function TldrawWhiteboard({ roomId, user }) {
  const editorRef = useRef(null);
  const roomIdRef = useRef(roomId);
  const userRef = useRef(user);
  const broadcastRafRef = useRef(0);
  const removeDocumentListenRef = useRef(null);
  const lastSavedDocRef = useRef(null);
  const lastSentDocRef = useRef(null);
  const applyingRemoteRef = useRef(false);
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  roomIdRef.current = roomId;
  userRef.current = user;

  const userInfo = useMemo(() => {
    if (!user) return undefined;
    const id = user.id || "anonymous";
    const name =
      user.fullName || user.username || user.primaryEmailAddress?.emailAddress || user.email || id;
    const hue = hashToHue(String(id));
    const color = hslToHex(hue, 90, 55);
    return { id, name, color };
  }, [user]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!roomId) return;
      setLoading(true);
      setLoadError("");
      try {
        const data = await whiteboardApi.getSnapshot(roomId);
        if (cancelled) return;
        const document = data?.document || null;
        if (document) {
          setSnapshot({ document });
          lastSavedDocRef.current = JSON.stringify(document);
        } else {
          setSnapshot(null);
          lastSavedDocRef.current = null;
        }
      } catch (error) {
        if (cancelled) return;
        setLoadError(error?.response?.data?.message || error?.message || "Failed to load whiteboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [roomId]);

  const persistNow = useCallback(async () => {
    try {
      const editor = editorRef.current;
      if (!editor || !roomId) return;
      const snap = getSnapshot(editor.store);
      if (!snap?.document) return;
      const serialized = JSON.stringify(snap.document);
      if (serialized === lastSavedDocRef.current) return;
      await whiteboardApi.saveSnapshot(roomId, snap.document);
      lastSavedDocRef.current = serialized;
    } catch {
      /* ignore persistence errors */
    }
  }, [roomId]);

  useEffect(() => {
    const interval = setInterval(() => {
      void persistNow();
    }, 5000);
    return () => {
      clearInterval(interval);
      void persistNow();
    };
  }, [persistNow]);

  useEffect(() => {
    if (!roomId) return;
    const socket = getWhiteboardSocket();

    const joinRoom = () => {
      socket.emit("whiteboard:join", { roomId });
    };

    const handleRemoteUpdate = ({ roomId: incomingRoomId, document }) => {
      if (incomingRoomId !== roomId) return;
      const editor = editorRef.current;
      if (!editor || !document) return;

      const current = getSnapshot(editor.store)?.document;
      const currentSerialized = current ? JSON.stringify(current) : "";
      const incomingSerialized = JSON.stringify(document);
      if (currentSerialized === incomingSerialized) return;

      applyingRemoteRef.current = true;
      loadSnapshot(editor.store, { document });
      lastSavedDocRef.current = incomingSerialized;
      lastSentDocRef.current = incomingSerialized;
      setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 50);
    };

    joinRoom();
    socket.on("connect", joinRoom);
    socket.on("whiteboard:update", handleRemoteUpdate);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("whiteboard:update", handleRemoteUpdate);
      socket.emit("whiteboard:leave", { roomId });
    };
  }, [roomId]);

  useEffect(() => {
    if (!loading && !loadError) return;
    if (broadcastRafRef.current) {
      cancelAnimationFrame(broadcastRafRef.current);
      broadcastRafRef.current = 0;
    }
    removeDocumentListenRef.current?.();
    removeDocumentListenRef.current = null;
    editorRef.current = null;
  }, [loading, loadError]);

  useEffect(() => {
    if (loading || loadError) return;
    const editor = editorRef.current;
    if (!editor || !userInfo?.name) return;
    editor.user.updateUserPreferences({
      name: userInfo.name,
      color: userInfo.color,
    });
  }, [userInfo, loading, loadError]);

  useEffect(() => {
    return () => {
      if (broadcastRafRef.current) {
        cancelAnimationFrame(broadcastRafRef.current);
        broadcastRafRef.current = 0;
      }
      removeDocumentListenRef.current?.();
      removeDocumentListenRef.current = null;
    };
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-base-200">
        <span className="loading loading-spinner" />
        <span className="ml-3 text-base-content/70">Loading whiteboard...</span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-base-200 text-base-content/70 p-4">
        Failed to load whiteboard: {loadError}
      </div>
    );
  }

  return (
    <div className="tldraw__editor tldraw__canvas h-full w-full bg-base-200">
      <Tldraw
        key={roomId}
        snapshot={snapshot || undefined}
        onMount={(editor) => {
          editorRef.current = editor;
          removeDocumentListenRef.current?.();
          removeDocumentListenRef.current = null;

          const scheduleBroadcast = () => {
            if (applyingRemoteRef.current) return;
            if (broadcastRafRef.current) return;
            broadcastRafRef.current = requestAnimationFrame(() => {
              broadcastRafRef.current = 0;
              const rid = roomIdRef.current;
              const ed = editorRef.current;
              if (!ed || !rid || applyingRemoteRef.current) return;
              let doc;
              try {
                doc = getSnapshot(ed.store)?.document;
              } catch {
                return;
              }
              if (!doc) return;
              const serialized = JSON.stringify(doc);
              if (serialized === lastSentDocRef.current) return;
              lastSentDocRef.current = serialized;
              getWhiteboardSocket().emit("whiteboard:update", {
                roomId: rid,
                document: doc,
                updatedByClerkId: userRef.current?.id || "",
              });
            });
          };

          removeDocumentListenRef.current = editor.store.listen(scheduleBroadcast, {
            source: "user",
            scope: "document",
          });

          if (userInfo?.name) {
            editor.user.updateUserPreferences({
              name: userInfo.name,
              color: userInfo.color,
            });
          }
        }}
      />
    </div>
  );
}

