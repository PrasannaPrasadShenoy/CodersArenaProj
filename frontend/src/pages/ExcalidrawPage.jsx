import { useUser } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import TldrawWhiteboard from "../components/TldrawWhiteboard";
import { useCreateSession } from "../hooks/useSessions";
import CreateDiscussionModal from "../components/CreateDiscussionModal";

function ExcalidrawPage() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const createSessionMutation = useCreateSession();

  const privateRoomStorageKey = useMemo(() => {
    if (!user?.id) return null;
    return `talent-iq-whiteboard-room-${user.id}`;
  }, [user?.id]);

  const [privateRoomId, setPrivateRoomId] = useState(null);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [joinCode, setJoinCode] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [topic, setTopic] = useState("");

  if (!isLoaded) return null;

  useEffect(() => {
    if (!privateRoomStorageKey) return;

    const existing = localStorage.getItem(privateRoomStorageKey);
    if (existing) {
      setPrivateRoomId(existing);
      setActiveRoomId(existing);
      return;
    }

    // Create a private room id for this user.
    // This avoids "global" collisions and keeps the board separate by default.
    const newRoomId = `talent-iq-${crypto.randomUUID()}`;
    localStorage.setItem(privateRoomStorageKey, newRoomId);
    setPrivateRoomId(newRoomId);
    setActiveRoomId(newRoomId);
  }, [privateRoomStorageKey]);

  const handleCreateRoom = () => {
    createSessionMutation.mutate(
      {
        sessionType: "discussion",
        topic,
      },
      {
        onSuccess: (data) => {
          setShowCreateModal(false);
          setTopic("");
          navigate(`/session/${data.session._id}`);
        },
      }
    );
  };

  return (
    <div className="h-screen bg-base-200 flex flex-col">
      <Navbar />

      <div className="flex-1 min-h-0 px-4 pb-4 pt-3">
        <div className="mb-3 rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="btn btn-sm btn-primary"
              onClick={async () => {
                if (!activeRoomId) return;
                await navigator.clipboard.writeText(activeRoomId);
              }}
              disabled={!activeRoomId}
            >
              Copy invite code
            </button>

            <button
              className="btn btn-sm btn-ghost"
              onClick={() => privateRoomId && setActiveRoomId(privateRoomId)}
              disabled={!privateRoomId}
            >
              My board
            </button>

            <div className="join">
              <input
                className="input input-bordered input-sm join-item w-56"
                placeholder="Enter invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <button
                className="btn btn-sm btn-primary join-item"
                onClick={() => {
                  const trimmed = String(joinCode || "").trim();
                  if (!trimmed) return;
                  setActiveRoomId(trimmed);
                }}
                disabled={!joinCode.trim()}
              >
                Join
              </button>
            </div>

            <button
              className="btn btn-sm btn-success ml-auto"
              disabled={!activeRoomId || createSessionMutation.isPending}
              onClick={() => {
                if (!activeRoomId) return;
                setShowCreateModal(true);
              }}
            >
              {createSessionMutation.isPending ? "Creating..." : "Create session"}
            </button>

            <button
              className="btn btn-sm btn-outline"
              onClick={() => navigate("/excalidraw/sessions")}
            >
              Manage sessions
            </button>
          </div>

          <p className="mt-2 text-xs text-base-content/60 break-all">
            Active room: {activeRoomId || "Loading..."}
          </p>
        </div>

        <div className="h-[calc(100%-80px)] min-h-0 rounded-xl border border-base-300 bg-base-100 overflow-hidden">
          {activeRoomId ? (
            <TldrawWhiteboard roomId={activeRoomId} user={user} />
          ) : (
            <div className="h-full flex items-center justify-center text-base-content/70">
              Initializing whiteboard...
            </div>
          )}
        </div>
      </div>

      <CreateDiscussionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        topic={topic}
        setTopic={setTopic}
        onCreateSession={handleCreateRoom}
        isCreating={createSessionMutation.isPending}
      />
    </div>
  );
}

export default ExcalidrawPage;

