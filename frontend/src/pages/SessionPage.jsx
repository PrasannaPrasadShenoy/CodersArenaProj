import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router";
import { useEndSession, useJoinSession, useSessionById } from "../hooks/useSessions";
import { useProblemsList, useProblem } from "../hooks/useProblems";
import { useCodingProblemActions } from "../hooks/useCodingProblemActions";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import { Code2Icon, FileTextIcon, Loader2Icon, LogOutIcon, PhoneOffIcon, VideoIcon } from "lucide-react";
import { usePageTitle } from "../hooks/usePageTitle";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import ProblemDescription from "../components/ProblemDescription";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";
import TldrawWhiteboard from "../components/TldrawWhiteboard";

// Returns true when the viewport is narrower than 768px (md breakpoint).
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

const CODING_TABS = [
  { id: "problem", label: "Problem", icon: FileTextIcon },
  { id: "code", label: "Code", icon: Code2Icon },
  { id: "video", label: "Video", icon: VideoIcon },
];
const DISCUSSION_TABS = [
  { id: "board", label: "Whiteboard", icon: FileTextIcon },
  { id: "video", label: "Video", icon: VideoIcon },
];

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState("problem");
  const sessionTitle = session
    ? session.sessionType === "discussion"
      ? session.topic || "Discussion"
      : session.problem || "Session"
    : "Session";
  usePageTitle(sessionTitle);

  const { data: sessionData, isLoading: loadingSession, refetch } = useSessionById(id);

  const joinSessionMutation = useJoinSession();
  const endSessionMutation = useEndSession();

  const session = sessionData?.session;
  const sessionTrack = session?.problemTrack || "dsa";
  const isHost = session?.host?.clerkId === user?.id;
  const isDiscussion = session?.sessionType === "discussion";
  const isParticipant =
    session?.participant?.clerkId === user?.id || session?.participant2?.clerkId === user?.id;
  const totalMembers = 1 + Number(!!session?.participant) + Number(!!session?.participant2);
  const maxMembers = isDiscussion ? 3 : 2;
  const isFull = totalMembers >= maxMembers;
  const canJoin = session?.status === "active" && !isHost && !isParticipant && !isFull;

  const {
    call,
    channel,
    chatClient,
    isInitializingCall,
    streamClient,
    streamConnectFailed,
    retryStreamConnect,
  } = useStreamClient(session, loadingSession, isHost, isParticipant);

  const { problemsArray } = useProblemsList(sessionTrack);
  const problemIdByTitle = session?.problemId
    ? session.problemId
    : session?.problem && problemsArray
      ? problemsArray.find((p) => p.title === session.problem)?.id
      : null;
  const { problem: problemData } = useProblem(problemIdByTitle || "");
  const currentTrack = problemData?.track || sessionTrack || "dsa";

  const {
    selectedLanguage,
    code,
    setCode,
    output,
    handleLanguageChange,
    handleRunCode,
    handleDsaSubmit,
    isPrimaryExecuting,
    isDsaSubmitting,
    primaryActionLabel,
    primaryRunningLabel,
    showDsaSubmit,
  } = useCodingProblemActions({
    problemId: problemIdByTitle || "",
    problemData,
    confettiStyle: "small",
  });

  // Show a toast when a new participant joins (host/existing members only).
  const prevMembersRef = useRef(null);
  useEffect(() => {
    if (!session || !isHost) return;
    const members = [session.participant, session.participant2].filter(Boolean);
    const prev = prevMembersRef.current;
    if (prev !== null) {
      const newMembers = members.filter(
        (m) => !prev.some((p) => p.clerkId === m.clerkId)
      );
      newMembers.forEach((m) => {
        toast.success(`${m.name} joined the session!`, { icon: "👋" });
      });
    }
    prevMembersRef.current = members;
  }, [session?.participant, session?.participant2, isHost]);

  const handleJoin = () => {
    if (!session || !user) return;
    joinSessionMutation.mutate(id, { onSuccess: refetch });
  };

  useEffect(() => {
    if (!session || loadingSession) return;
    if (session.status === "completed") navigate("/dashboard");
  }, [session, loadingSession, navigate]);

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this session? All participants will be notified.")) {
      endSessionMutation.mutate(id, { onSuccess: () => navigate("/dashboard") });
    }
  };

  // ── Shared sub-panels ────────────────────────────────────────────────────

  const sessionHeader = isDiscussion ? (
    <div className="p-5 bg-base-100 border-b border-base-300">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold truncate">{session?.topic || "Loading..."}</h1>
          <p className="text-base-content/60 mt-1 text-sm">
            Host: {session?.host?.name || "…"} · {totalMembers}/{maxMembers} members
          </p>
          {!isHost && !isParticipant && (
            <div className="mt-3 flex items-center gap-2">
              <button
                className={`btn btn-primary btn-sm ${isFull ? "btn-disabled" : ""}`}
                onClick={handleJoin}
                disabled={!canJoin || joinSessionMutation.isPending}
              >
                {joinSessionMutation.isPending ? "Joining…" : isFull ? "Full" : "Join session"}
              </button>
              {joinSessionMutation.isError && (
                <span className="text-sm text-error">
                  {joinSessionMutation.error?.response?.data?.message || "Failed to join"}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {isHost && session?.status === "active" && (
            <button
              onClick={handleEndSession}
              disabled={endSessionMutation.isPending}
              className="btn btn-error btn-sm gap-1.5"
            >
              {endSessionMutation.isPending ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <LogOutIcon className="size-4" />
              )}
              End
            </button>
          )}
          {session?.status === "completed" && (
            <span className="badge badge-ghost">Completed</span>
          )}
        </div>
      </div>
    </div>
  ) : null;

  const whiteboardPanel = (
    <div className="flex-1 min-h-0 p-3">
      <div className="h-full rounded-xl overflow-hidden border border-base-300 bg-base-100">
        {session && user ? (
          <TldrawWhiteboard roomId={session.whiteboardRoomId || `neurohire-whiteboard-${id}`} user={user} />
        ) : (
          <div className="h-full flex items-center justify-center text-base-content/60 text-sm">
            Loading whiteboard…
          </div>
        )}
      </div>
    </div>
  );

  const videoPanel = (
    <div className="h-full bg-base-200 p-4 overflow-auto">
      {isInitializingCall ? (
        <div className="h-full flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2Icon className="size-10 mx-auto animate-spin text-primary" />
            <p className="text-base-content/60 text-sm">Connecting to video call…</p>
          </div>
        </div>
      ) : !isHost && !isParticipant ? (
        <div className="h-full flex items-center justify-center p-4">
          <div className="card bg-base-100 shadow-md max-w-sm w-full">
            <div className="card-body items-center text-center">
              <h2 className="card-title text-lg">Video & chat</h2>
              <p className="text-base-content/60 text-sm">
                Join this session from the problem panel to connect.
              </p>
            </div>
          </div>
        </div>
      ) : !streamClient || !call ? (
        <div className="h-full flex items-center justify-center p-4">
          <div className="card bg-base-100 shadow-md max-w-sm w-full">
            <div className="card-body items-center text-center">
              <div className="size-16 bg-error/10 rounded-full flex items-center justify-center mb-3">
                <PhoneOffIcon className="size-8 text-error" />
              </div>
              <h2 className="card-title text-lg">Connection Failed</h2>
              <p className="text-base-content/60 text-sm">
                Unable to connect. You can keep coding — try again when the network is stable.
              </p>
              {streamConnectFailed && (
                <button type="button" className="btn btn-primary btn-sm mt-3" onClick={retryStreamConnect}>
                  Retry
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full">
          <StreamVideo client={streamClient}>
            <StreamCall call={call}>
              <VideoCallUI chatClient={chatClient} channel={channel} />
            </StreamCall>
          </StreamVideo>
        </div>
      )}
    </div>
  );

  const codingLeftPanel = !problemData ? (
    <div className="h-full overflow-y-auto bg-base-200">
      <div className="p-5 bg-base-100 border-b border-base-300">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{session?.problem || "Loading…"}</h1>
            <p className="text-base-content/60 mt-1 text-sm">
              Host: {session?.host?.name || "…"} · {totalMembers}/{maxMembers}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`badge badge-lg ${getDifficultyBadgeClass(session?.difficulty)}`}>
              {(() => { const d = session?.difficulty ?? "easy"; return d.slice(0,1).toUpperCase() + d.slice(1); })()}
            </span>
            {!isHost && !isParticipant && (
              <button className={`btn btn-primary btn-sm ${isFull ? "btn-disabled" : ""}`} onClick={handleJoin} disabled={!canJoin || joinSessionMutation.isPending}>
                {joinSessionMutation.isPending ? "Joining…" : isFull ? "Full" : "Join"}
              </button>
            )}
            {isHost && session?.status === "active" && (
              <button onClick={handleEndSession} disabled={endSessionMutation.isPending} className="btn btn-error btn-sm gap-1.5">
                {endSessionMutation.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <LogOutIcon className="size-4" />}
                End
              </button>
            )}
            {session?.status === "completed" && <span className="badge badge-ghost">Completed</span>}
          </div>
        </div>
      </div>
      <div className="p-5">
        <div className="bg-base-100 rounded-xl p-5 border border-base-300">
          <p className="text-base-content/60 text-sm">Problem details not available for this session.</p>
        </div>
      </div>
    </div>
  ) : (
    <ProblemDescription
      problem={problemData}
      currentProblemId={problemIdByTitle || ""}
      onProblemChange={() => {}}
      allProblems={problemsArray || []}
      showProblemPicker={false}
      customHeader={
        <div className="p-5 bg-base-100 border-b border-base-300">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">{session?.problem || problemData.title}</h1>
              {problemData.category && (
                <p className="text-base-content/60 mt-0.5 text-sm">
                  {(currentTrack || "dsa").toUpperCase()} · {problemData.category}
                </p>
              )}
              <p className="text-base-content/60 text-sm mt-1">
                Host: {session?.host?.name || "…"} · {totalMembers}/{maxMembers}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`badge badge-lg ${getDifficultyBadgeClass(session?.difficulty)}`}>
                {(() => { const d = session?.difficulty ?? "easy"; return d.slice(0,1).toUpperCase() + d.slice(1); })()}
              </span>
              {!isHost && !isParticipant && (
                <button className={`btn btn-primary btn-sm ${isFull ? "btn-disabled" : ""}`} onClick={handleJoin} disabled={!canJoin || joinSessionMutation.isPending}>
                  {joinSessionMutation.isPending ? "Joining…" : isFull ? "Full" : "Join"}
                </button>
              )}
              {isHost && session?.status === "active" && (
                <button onClick={handleEndSession} disabled={endSessionMutation.isPending} className="btn btn-error btn-sm gap-1.5">
                  {endSessionMutation.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <LogOutIcon className="size-4" />}
                  End
                </button>
              )}
              {session?.status === "completed" && <span className="badge badge-ghost">Completed</span>}
            </div>
          </div>
        </div>
      }
    />
  );

  const codingRightPanel = (
    <PanelGroup direction="vertical">
      <Panel defaultSize={70} minSize={30}>
        <CodeEditorPanel
          selectedLanguage={selectedLanguage}
          code={code}
          isRunning={isPrimaryExecuting}
          onLanguageChange={handleLanguageChange}
          onCodeChange={(value) => setCode(value)}
          onRunCode={handleRunCode}
          languageOptions={currentTrack === "ml" ? ["python"] : undefined}
          disableLanguageSelect={currentTrack === "ml"}
          actionLabel={primaryActionLabel}
          runningLabel={primaryRunningLabel}
          secondaryActionLabel={showDsaSubmit ? "Submit all tests" : undefined}
          onSecondaryAction={showDsaSubmit ? handleDsaSubmit : undefined}
          isSecondaryRunning={isDsaSubmitting}
        />
      </Panel>
      <PanelResizeHandle className="h-1.5 bg-base-300 hover:bg-primary transition-colors cursor-row-resize flex items-center justify-center">
        <div className="w-8 h-0.5 rounded-full bg-base-content/20" />
      </PanelResizeHandle>
      <Panel defaultSize={30} minSize={15}>
        <OutputPanel
          output={output}
          emptyStateText={
            currentTrack === "ml"
              ? 'Click "Submit" to run ML tests here...'
              : 'Run Code runs public tests; Submit includes hidden tests...'
          }
        />
      </Panel>
    </PanelGroup>
  );

  // ── Mobile layout ─────────────────────────────────────────────────────────
  if (isMobile) {
    const tabs = isDiscussion ? DISCUSSION_TABS : CODING_TABS;
    // Default to first tab
    const activeTab = tabs.some((t) => t.id === mobileTab) ? mobileTab : tabs[0].id;

    return (
      <div className="h-screen bg-base-100 flex flex-col">
        <Navbar />

        {/* Tab bar */}
        <div className="flex border-b border-base-300 bg-base-100 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-base-content/60 hover:text-base-content"
                }`}
            >
              <tab.icon className="size-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isDiscussion ? (
            activeTab === "board" ? (
              <div className="h-full flex flex-col">
                {sessionHeader}
                {whiteboardPanel}
              </div>
            ) : (
              videoPanel
            )
          ) : (
            activeTab === "problem" ? (
              <div className="h-full overflow-y-auto">{codingLeftPanel}</div>
            ) : activeTab === "code" ? (
              <div className="h-full">{codingRightPanel}</div>
            ) : (
              videoPanel
            )
          )}
        </div>
      </div>
    );
  }

  // ── Desktop layout ────────────────────────────────────────────────────────
  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1 min-h-0">
        <PanelGroup direction="horizontal">
          {/* LEFT PANEL */}
          <Panel defaultSize={50} minSize={30}>
            {isDiscussion ? (
              <div className="h-full overflow-hidden bg-base-200 flex flex-col">
                {sessionHeader}
                {whiteboardPanel}
              </div>
            ) : (
              <PanelGroup direction="vertical">
                <Panel defaultSize={50} minSize={20}>
                  {codingLeftPanel}
                </Panel>
                <PanelResizeHandle className="h-1.5 bg-base-300 hover:bg-primary transition-colors cursor-row-resize flex items-center justify-center group">
                  <div className="w-8 h-0.5 rounded-full bg-base-content/20 group-hover:bg-primary/60 transition-colors" />
                </PanelResizeHandle>
                <Panel defaultSize={50} minSize={20}>
                  {codingRightPanel}
                </Panel>
              </PanelGroup>
            )}
          </Panel>

          <PanelResizeHandle className="w-1.5 bg-base-300 hover:bg-primary transition-colors cursor-col-resize flex items-center justify-center group">
            <div className="h-8 w-0.5 rounded-full bg-base-content/20 group-hover:bg-primary/60 transition-colors" />
          </PanelResizeHandle>

          {/* RIGHT PANEL — VIDEO */}
          <Panel defaultSize={50} minSize={30}>
            {videoPanel}
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default SessionPage;
