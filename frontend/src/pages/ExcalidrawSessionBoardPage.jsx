import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useUser } from "@clerk/clerk-react";
import Navbar from "../components/Navbar";
import TldrawWhiteboard from "../components/TldrawWhiteboard";
import { useJoinSession, useSessionById } from "../hooks/useSessions";

function ExcalidrawSessionBoardPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const { data, isLoading, refetch } = useSessionById(id);
  const joinSessionMutation = useJoinSession();

  const session = data?.session;

  const membership = useMemo(() => {
    if (!session || !user) {
      return {
        isHost: false,
        isParticipant: false,
        totalMembers: 0,
        maxMembers: 0,
        isFull: false,
        canJoin: false,
      };
    }
    const isHost = session.host?.clerkId === user.id;
    const isParticipant =
      session.participant?.clerkId === user.id || session.participant2?.clerkId === user.id;
    const totalMembers = 1 + Number(!!session.participant) + Number(!!session.participant2);
    const maxMembers = session.sessionType === "discussion" ? 3 : 2;
    const isFull = totalMembers >= maxMembers;
    const canJoin = session.status === "active" && !isHost && !isParticipant && !isFull;
    return { isHost, isParticipant, totalMembers, maxMembers, isFull, canJoin };
  }, [session, user]);

  const handleJoin = () => {
    if (!id) return;
    joinSessionMutation.mutate(id, { onSuccess: () => refetch() });
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-base-200 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="h-screen bg-base-200 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center text-base-content/70">
          Session not found.
        </div>
      </div>
    );
  }

  const roomId = session.whiteboardRoomId || `talent-iq-whiteboard-${session._id}`;

  return (
    <div className="h-screen bg-base-200 flex flex-col">
      <Navbar />

      <div className="flex-1 min-h-0 px-4 py-3">
        <div className="mb-3 rounded-xl border border-base-300 bg-base-100 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold mr-2 truncate">{session.topic || "Session Board"}</h1>
            <span
              className={`badge badge-sm ${
                session.status === "active" ? "badge-success" : "badge-ghost"
              }`}
            >
              {session.status}
            </span>

            <span className="text-sm text-base-content/70">
              {membership.totalMembers}/{membership.maxMembers} members
            </span>

            <button className="btn btn-sm btn-outline ml-auto" onClick={() => navigate("/excalidraw/sessions")}>
              Back
            </button>
            <Link className="btn btn-sm btn-primary" to={`/session/${session._id}`}>
              Open full session
            </Link>
          </div>

          {!membership.isHost && !membership.isParticipant && (
            <div className="mt-2 flex items-center gap-2">
              <button
                className={`btn btn-sm btn-primary ${membership.isFull ? "btn-disabled" : ""}`}
                disabled={!membership.canJoin || joinSessionMutation.isPending}
                onClick={handleJoin}
              >
                {joinSessionMutation.isPending
                  ? "Joining..."
                  : membership.isFull
                    ? "Full"
                    : "Join session"}
              </button>
              {joinSessionMutation.isError && (
                <span className="text-sm text-error">
                  {joinSessionMutation.error?.response?.data?.message ||
                    joinSessionMutation.error?.message ||
                    "Failed to join"}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="h-[calc(100%-72px)] min-h-0 rounded-xl border border-base-300 bg-base-100 overflow-hidden">
          <TldrawWhiteboard roomId={roomId} user={user} />
        </div>
      </div>
    </div>
  );
}

export default ExcalidrawSessionBoardPage;

