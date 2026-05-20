import { useUser } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import { useEndSession, useJoinSession, useSessionById } from "../hooks/useSessions";
import { useProblemsList, useProblem } from "../hooks/useProblems";
import { useCodingProblemActions } from "../hooks/useCodingProblemActions";
import Navbar from "../components/Navbar";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { getDifficultyBadgeClass } from "../lib/utils";
import { Loader2Icon, LogOutIcon, PhoneOffIcon, WifiOffIcon } from "lucide-react";
import CodeEditorPanel from "../components/CodeEditorPanel";
import OutputPanel from "../components/OutputPanel";
import ProblemDescription from "../components/ProblemDescription";

import useStreamClient from "../hooks/useStreamClient";
import { StreamCall, StreamVideo } from "@stream-io/video-react-sdk";
import VideoCallUI from "../components/VideoCallUI";
import TldrawWhiteboard from "../components/TldrawWhiteboard";
import { useSessionCodeCollaboration } from "../hooks/useSessionCodeCollaboration";

function SessionPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useUser();

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
    isReconnecting,
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

  const collaborateCoding =
    !isDiscussion &&
    session?.sessionType === "coding" &&
    session?.status === "active" &&
    (isHost || isParticipant);

  const collaborativeCodePickerRef = useRef(/** @type {(() => string) | null} */ (null));

  const {
    selectedLanguage,
    setSelectedLanguage,
    code,
    setCode,
    output,
    handleLanguageChange,
    handleRunCode,
    handleDsaSubmit,
    isPrimaryExecuting,
    isDsaSubmitting,
    executionStartTime,
    primaryActionLabel,
    primaryRunningLabel,
    showDsaSubmit,
  } = useCodingProblemActions({
    problemId: problemIdByTitle || "",
    problemData,
    confettiStyle: "small",
    suppressStarterHydration: collaborateCoding,
    collaborativeCodePickerRef,
  });

  const { sockReady, mountCollaborativeEditor, wrapLanguageChange } = useSessionCodeCollaboration({
    sessionId: id,
    enabled: collaborateCoding && Boolean(id),
    problemData,
    setSelectedLanguage,
    collaborativeCodePickerRef,
  });

  const editorLanguageChangeHandler = collaborateCoding ? wrapLanguageChange(handleLanguageChange) : handleLanguageChange;

  const handleJoin = () => {
    if (!session || !user) return;
    joinSessionMutation.mutate(id, { onSuccess: refetch });
  };

  // redirect the "participant" when session ends
  useEffect(() => {
    if (!session || loadingSession) return;

    if (session.status === "completed") navigate("/dashboard");
  }, [session, loadingSession, navigate]);

  const handleEndSession = () => {
    if (confirm("Are you sure you want to end this session? All participants will be notified.")) {
      // this will navigate the HOST to dashboard
      endSessionMutation.mutate(id, { onSuccess: () => navigate("/dashboard") });
    }
  };

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1">
        <PanelGroup direction="horizontal">
          {/* LEFT PANEL - CODE EDITOR & PROBLEM DETAILS */}
          <Panel defaultSize={50} minSize={30}>
            {isDiscussion ? (
              <div className="h-full overflow-hidden bg-base-200 flex flex-col">
                <div className="p-6 bg-base-100 border-b border-base-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h1 className="text-3xl font-bold text-base-content truncate">
                        {session?.topic || "Loading..."}
                      </h1>
                      <p className="text-base-content/60 mt-2">
                        Host: {session?.host?.name || "Loading..."} • {totalMembers}/{maxMembers} members
                      </p>

                      {!isHost && !isParticipant && (
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            className={`btn btn-primary btn-sm ${isFull ? "btn-disabled" : ""}`}
                            onClick={handleJoin}
                            disabled={!canJoin || joinSessionMutation.isPending}
                          >
                            {joinSessionMutation.isPending
                              ? "Joining..."
                              : isFull
                                ? "Full"
                                : "Join session"}
                          </button>
                          {joinSessionMutation.isError && (
                            <span className="text-sm text-error font-medium">
                              {joinSessionMutation.error?.response?.data?.message ||
                                joinSessionMutation.error?.message ||
                                "Failed to join"}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {isHost && session?.status === "active" && (
                        <button
                          onClick={handleEndSession}
                          disabled={endSessionMutation.isPending}
                          className="btn btn-error btn-sm gap-2"
                        >
                          {endSessionMutation.isPending ? (
                            <Loader2Icon className="w-4 h-4 animate-spin" />
                          ) : (
                            <LogOutIcon className="w-4 h-4" />
                          )}
                          End Session
                        </button>
                      )}
                      {session?.status === "completed" && (
                        <span className="badge badge-ghost badge-lg">Completed</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 p-4">
                  <div className="h-full rounded-xl overflow-hidden border border-base-300 bg-base-100">
                    {session && user ? (
                      <TldrawWhiteboard roomId={session.whiteboardRoomId || `neurohire-whiteboard-${id}`} user={user} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-base-content/70">
                        Loading whiteboard...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <PanelGroup direction="vertical">
                {/* PROBLEM DSC PANEL */}
                <Panel defaultSize={50} minSize={20}>
                  {!problemData ? (
                    <div className="h-full overflow-y-auto bg-base-200">
                      <div className="p-6 bg-base-100 border-b border-base-300">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h1 className="text-3xl font-bold text-base-content">
                              {session?.problem || "Loading..."}
                            </h1>
                            <p className="text-base-content/60 mt-2">
                              Host: {session?.host?.name || "Loading..."} • {totalMembers}/
                              {maxMembers} participants
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`badge badge-lg ${getDifficultyBadgeClass(session?.difficulty)}`}
                            >
                              {(() => {
                                const d = session?.difficulty ?? "easy";
                                return d ? d.slice(0, 1).toUpperCase() + d.slice(1) : "Easy";
                              })()}
                            </span>
                            {!isHost && !isParticipant && (
                              <button
                                className={`btn btn-primary btn-sm ${isFull ? "btn-disabled" : ""}`}
                                onClick={handleJoin}
                                disabled={!canJoin || joinSessionMutation.isPending}
                              >
                                {joinSessionMutation.isPending
                                  ? "Joining..."
                                  : isFull
                                    ? "Full"
                                    : "Join session"}
                              </button>
                            )}
                            {isHost && session?.status === "active" && (
                              <button
                                onClick={handleEndSession}
                                disabled={endSessionMutation.isPending}
                                className="btn btn-error btn-sm gap-2"
                              >
                                {endSessionMutation.isPending ? (
                                  <Loader2Icon className="w-4 h-4 animate-spin" />
                                ) : (
                                  <LogOutIcon className="w-4 h-4" />
                                )}
                                End Session
                              </button>
                            )}
                            {session?.status === "completed" && (
                              <span className="badge badge-ghost badge-lg">Completed</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
                          <p className="text-base-content/70">
                            Problem details for this session are not available.
                          </p>
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
                        <div className="p-6 bg-base-100 border-b border-base-300">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h1 className="text-3xl font-bold text-base-content">
                                {session?.problem || problemData.title}
                              </h1>
                              {problemData.category && (
                                <p className="text-base-content/60 mt-1">
                                  {(currentTrack || "dsa").toUpperCase()} • {problemData.category}
                                </p>
                              )}
                              <p className="text-base-content/60 mt-2">
                                Host: {session?.host?.name || "Loading..."} • {totalMembers}/
                                {maxMembers} participants
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span
                                className={`badge badge-lg ${getDifficultyBadgeClass(
                                  session?.difficulty
                                )}`}
                              >
                                {(() => {
                                  const d = session?.difficulty ?? "easy";
                                  return d ? d.slice(0, 1).toUpperCase() + d.slice(1) : "Easy";
                                })()}
                              </span>

                              {!isHost && !isParticipant && (
                                <button
                                  className={`btn btn-primary btn-sm ${isFull ? "btn-disabled" : ""}`}
                                  onClick={handleJoin}
                                  disabled={!canJoin || joinSessionMutation.isPending}
                                >
                                  {joinSessionMutation.isPending
                                    ? "Joining..."
                                    : isFull
                                      ? "Full"
                                      : "Join session"}
                                </button>
                              )}

                              {isHost && session?.status === "active" && (
                                <button
                                  onClick={handleEndSession}
                                  disabled={endSessionMutation.isPending}
                                  className="btn btn-error btn-sm gap-2"
                                >
                                  {endSessionMutation.isPending ? (
                                    <Loader2Icon className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <LogOutIcon className="w-4 h-4" />
                                  )}
                                  End Session
                                </button>
                              )}
                              {session?.status === "completed" && (
                                <span className="badge badge-ghost badge-lg">Completed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      }
                    />
                  )}
                </Panel>

                <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

                <Panel defaultSize={50} minSize={20}>
                  <PanelGroup direction="vertical">
                    <Panel defaultSize={70} minSize={30}>
                      {collaborateCoding && !sockReady ? (
                        <div className="h-full bg-base-300 flex flex-col items-center justify-center gap-3 text-center px-6">
                          <Loader2Icon className="size-10 animate-spin text-primary" aria-hidden />
                          <p className="text-base-content font-medium">Connecting shared editor…</p>
                          <p className="text-sm text-base-content/60 max-w-sm">
                            Code syncs in real time for everyone in this session (Yjs over your existing Socket.IO
                            connection).
                          </p>
                        </div>
                      ) : (
                        <CodeEditorPanel
                          selectedLanguage={selectedLanguage}
                          code={code}
                          isRunning={isPrimaryExecuting}
                          onLanguageChange={editorLanguageChangeHandler}
                          onCodeChange={(value) => setCode(value ?? "")}
                          onRunCode={handleRunCode}
                          languageOptions={currentTrack === "ml" ? ["python"] : undefined}
                          disableLanguageSelect={currentTrack === "ml"}
                          actionLabel={primaryActionLabel}
                          runningLabel={primaryRunningLabel}
                          secondaryActionLabel={showDsaSubmit ? "Submit all tests" : undefined}
                          onSecondaryAction={showDsaSubmit ? handleDsaSubmit : undefined}
                          isSecondaryRunning={isDsaSubmitting}
                          collaborative={collaborateCoding && sockReady}
                          onCollaborativeMount={mountCollaborativeEditor}
                          editorPath={id ? `session-${id}` : "session"}
                        />
                      )}
                    </Panel>

                    <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

                    <Panel defaultSize={30} minSize={15}>
                      <OutputPanel
                        output={output}
                        isExecuting={isPrimaryExecuting}
                        isSubmitting={isDsaSubmitting}
                        executionStartTime={executionStartTime}
                        language={currentTrack === "ml" ? "ml" : selectedLanguage}
                        emptyStateText={
                          currentTrack === "ml"
                            ? 'Click "Submit" to run ML tests here...'
                            : 'Run Code runs public tests (same engine as submit); Submit includes hidden tests...'
                        }
                      />
                    </Panel>
                  </PanelGroup>
                </Panel>
              </PanelGroup>
            )}
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          {/* RIGHT PANEL - VIDEO CALLS & CHAT */}
          <Panel defaultSize={50} minSize={30}>
            <div className="h-full bg-base-200 p-4 overflow-auto">
              {isReconnecting ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <WifiOffIcon className="w-12 h-12 mx-auto text-warning mb-4 animate-pulse" />
                    <p className="text-lg font-medium">Reconnecting...</p>
                    <p className="text-sm text-base-content/60 mt-1">
                      Connection lost. Attempting to rejoin automatically.
                    </p>
                  </div>
                </div>
              ) : isInitializingCall ? (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2Icon className="w-12 h-12 mx-auto animate-spin text-primary mb-4" />
                    <p className="text-lg">Connecting to video call...</p>
                  </div>
                </div>
              ) : !isHost && !isParticipant ? (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="card bg-base-100 shadow-xl max-w-md w-full">
                    <div className="card-body items-center text-center">
                      <h2 className="card-title text-xl">Video &amp; chat</h2>
                      <p className="text-base-content/70">
                        Join this session from the problem panel to connect to the call and messaging.
                      </p>
                    </div>
                  </div>
                </div>
              ) : !streamClient || !call ? (
                <div className="h-full flex items-center justify-center p-4">
                  <div className="card bg-base-100 shadow-xl max-w-md w-full">
                    <div className="card-body items-center text-center">
                      <div className="w-24 h-24 bg-error/10 rounded-full flex items-center justify-center mb-4">
                        <PhoneOffIcon className="w-12 h-12 text-error" />
                      </div>
                      <h2 className="card-title text-2xl">Connection Failed</h2>
                      <p className="text-base-content/70">
                        Unable to connect to video or chat. You can keep coding on the left; try again when
                        the network is stable.
                      </p>
                      {streamConnectFailed ? (
                        <button
                          type="button"
                          className="btn btn-primary mt-4"
                          onClick={() => retryStreamConnect()}
                        >
                          Retry connection
                        </button>
                      ) : null}
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
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default SessionPage;
