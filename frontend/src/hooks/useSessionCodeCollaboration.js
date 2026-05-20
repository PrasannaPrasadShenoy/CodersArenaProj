import { useCallback, useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { getWhiteboardSocket } from "../lib/whiteboardSocket";

const SOCKET_ORIGIN = "socket";

/**
 * Yjs + Socket.IO collaborative buffer for live interview sessions (coding only).
 * Relies on the same authenticated socket as the whiteboard.
 *
 * @param {{
 *   sessionId: string | undefined;
 *   enabled: boolean;
 *   problemData: object | null | undefined;
 *   setSelectedLanguage: (lang: string) => void;
 *   collaborativeCodePickerRef: React.MutableRefObject<(() => string) | null | undefined>;
 * }} opts
 */
export function useSessionCodeCollaboration({
  sessionId,
  enabled,
  problemData,
  setSelectedLanguage,
  collaborativeCodePickerRef,
}) {
  const [sockReady, setSockReady] = useState(false);
  const ydocRef = useRef(null);
  const bindingRef = useRef(null);
  const lastSeedKeyRef = useRef("");

  const destroyBinding = useCallback(() => {
    try {
      bindingRef.current?.destroy?.();
    } catch {
      /* ignore */
    }
    bindingRef.current = null;
  }, []);

  const mountCollaborativeEditor = useCallback(
    (editor) => {
      const ydoc = ydocRef.current;
      const model = editor?.getModel?.();
      if (!ydoc || !model) return;

      destroyBinding();
      const ytext = ydoc.getText("monaco");
      bindingRef.current = new MonacoBinding(ytext, model, new Set([editor]), null);
    },
    [destroyBinding]
  );

  useEffect(() => {
    if (!enabled || !sessionId) {
      setSockReady(false);
      destroyBinding();
      ydocRef.current = null;
      collaborativeCodePickerRef.current = null;
      lastSeedKeyRef.current = "";
      return undefined;
    }

    const socket = getWhiteboardSocket();
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    collaborativeCodePickerRef.current = () => ydoc.getText("monaco").toString();

    const meta = ydoc.getMap("meta");
    const observeMeta = () => {
      const l = meta.get("language");
      if (typeof l === "string" && ["javascript", "python", "java"].includes(l)) {
        setSelectedLanguage(l);
      }
    };
    meta.observe(observeMeta);

    const onSync = ({ state }) => {
      try {
        Y.applyUpdate(ydoc, new Uint8Array(state), SOCKET_ORIGIN);
      } catch {
        /* malformed sync payload */
      }
    };

    const onUpdate = ({ update }) => {
      try {
        Y.applyUpdate(ydoc, new Uint8Array(update), SOCKET_ORIGIN);
      } catch {
        /* malformed update payload */
      }
    };

    socket.on("session-code:sync", onSync);
    socket.on("session-code:update", onUpdate);

    const relayLocal = (update, origin) => {
      if (origin === SOCKET_ORIGIN) return;
      socket.emit("session-code:update", {
        sessionId,
        update: Array.from(update),
      });
    };
    ydoc.on("update", relayLocal);

    socket.emit(
      "session-code:join",
      { sessionId },
      /** @type {(r?: { ok?: boolean }) => void} */ (resp) => {
        if (resp?.ok) setSockReady(true);
      }
    );

    return () => {
      meta.unobserve(observeMeta);
      ydoc.off("update", relayLocal);
      socket.off("session-code:sync", onSync);
      socket.off("session-code:update", onUpdate);
      socket.emit("session-code:leave", { sessionId });
      destroyBinding();
      ydoc.destroy();
      ydocRef.current = null;
      collaborativeCodePickerRef.current = null;
      setSockReady(false);
      lastSeedKeyRef.current = "";
    };
  }, [sessionId, enabled, destroyBinding, collaborativeCodePickerRef, setSelectedLanguage]);

  useEffect(() => {
    if (!enabled || !sessionId || !sockReady) return;
    const langs = ["javascript", "python", "java"];
    const trackLang =
      problemData?.track === "ml"
        ? "python"
        : typeof problemData?.defaultLanguage === "string" &&
            langs.includes(problemData.defaultLanguage)
          ? problemData.defaultLanguage
          : "javascript";
    const starter = problemData?.starterCode?.[trackLang];
    const starterStr = typeof starter === "string" ? starter : "";
    const key = `${sessionId}|${starterStr}|${trackLang}`;
    if (lastSeedKeyRef.current === key) return;
    lastSeedKeyRef.current = key;

    const socket = getWhiteboardSocket();
    socket.emit("session-code:seed-if-empty", {
      sessionId,
      starter: starterStr,
      language: trackLang,
    });
  }, [enabled, sessionId, sockReady, problemData]);

  /** Wrap dropdown changes so language + starter template propagate via Yjs */
  const wrapLanguageChange = useCallback((baseHandler) => {
    return /** @type {(e: React.ChangeEvent<HTMLSelectElement>) => void} */ (e) => {
      const newLang = e.target.value;
      const ydoc = ydocRef.current;
      const starter = problemData?.starterCode?.[newLang] ?? "";

      if (ydoc && sockReady && problemData?.track !== "ml") {
        const ytext = ydoc.getText("monaco");
        const meta = ydoc.getMap("meta");
        Y.transact(ydoc, () => {
          meta.set("language", newLang);
          ytext.delete(0, ytext.length);
          if (starter) {
            ytext.insert(0, starter);
          }
        });
      }

      baseHandler(e);
    };
  }, [problemData, sockReady]);

  return {
    sockReady,
    mountCollaborativeEditor,
    wrapLanguageChange,
  };
}
