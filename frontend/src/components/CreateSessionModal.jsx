import { Code2Icon, LoaderIcon, MessageSquareIcon, PlusIcon } from "lucide-react";

function CreateSessionModal({
  isOpen,
  onClose,
  roomConfig,
  setRoomConfig,
  onCreateRoom,
  isCreating,
  problems = [],
}) {
  const allProblems = Array.isArray(problems) ? problems : Object.values(problems);
  const selectedTrack = roomConfig.problemTrack || "dsa";
  const problemsList = allProblems.filter((p) => (p.track || "dsa") === selectedTrack);
  const sessionKind = roomConfig.sessionKind || "coding";

  if (!isOpen) return null;

  const discussionTopicOk = (roomConfig.discussionTopic || "").trim().length >= 3;
  const codingOk = !!(roomConfig.problem && roomConfig.problemId);

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <h3 className="font-bold text-2xl mb-6">Create New Session</h3>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="label">
              <span className="label-text font-semibold">Session type</span>
            </label>
            <div className="tabs tabs-boxed inline-flex flex-wrap gap-1">
              <button
                type="button"
                className={`tab gap-2 ${sessionKind === "coding" ? "tab-active" : ""}`}
                onClick={() =>
                  setRoomConfig((prev) => ({
                    ...prev,
                    sessionKind: "coding",
                  }))
                }
              >
                <Code2Icon className="size-4" />
                Coding
              </button>
              <button
                type="button"
                className={`tab gap-2 ${sessionKind === "discussion" ? "tab-active" : ""}`}
                onClick={() =>
                  setRoomConfig((prev) => ({
                    ...prev,
                    sessionKind: "discussion",
                  }))
                }
              >
                <MessageSquareIcon className="size-4" />
                Discussion
              </button>
            </div>
          </div>

          {sessionKind === "discussion" ? (
            <div className="space-y-2">
              <label className="label">
                <span className="label-text font-semibold">Topic</span>
                <span className="label-text-alt text-error">*</span>
              </label>
              <input
                className="input input-bordered w-full"
                value={roomConfig.discussionTopic || ""}
                onChange={(e) =>
                  setRoomConfig((prev) => ({ ...prev, discussionTopic: e.target.value }))
                }
                placeholder="e.g. System design: URL shortener"
              />
              <p className="text-sm text-base-content/60">
                Whiteboard + video for up to 3 people (host + 2).
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="label">
                  <span className="label-text font-semibold">Select Track</span>
                </label>
                <div className="tabs tabs-boxed inline-flex">
                  <button
                    type="button"
                    className={`tab ${selectedTrack === "dsa" ? "tab-active" : ""}`}
                    onClick={() =>
                      setRoomConfig((prev) => ({
                        ...prev,
                        problemTrack: "dsa",
                        problem: "",
                        problemId: "",
                        difficulty: "",
                      }))
                    }
                  >
                    DSA
                  </button>
                  <button
                    type="button"
                    className={`tab ${selectedTrack === "ml" ? "tab-active" : ""}`}
                    onClick={() =>
                      setRoomConfig((prev) => ({
                        ...prev,
                        problemTrack: "ml",
                        problem: "",
                        problemId: "",
                        difficulty: "",
                      }))
                    }
                  >
                    ML
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="label">
                  <span className="label-text font-semibold">Select Problem</span>
                  <span className="label-text-alt text-error">*</span>
                </label>

                <select
                  className="select w-full"
                  value={roomConfig.problemId}
                  onChange={(e) => {
                    const selectedProblem = problemsList.find((p) => p.id === e.target.value);
                    if (!selectedProblem) return;
                    setRoomConfig((prev) => ({
                      ...prev,
                      problemTrack: selectedTrack,
                      problemId: selectedProblem.id,
                      problem: selectedProblem.title,
                      difficulty: selectedProblem.difficulty || "",
                    }));
                  }}
                >
                  <option value="" disabled>
                    Choose a {selectedTrack.toUpperCase()} problem...
                  </option>

                  {problemsList.map((problem) => (
                    <option key={problem.id} value={problem.id}>
                      {problem.title} ({problem.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              {roomConfig.problem && (
                <div className="alert alert-success">
                  <Code2Icon className="size-5" />
                  <div>
                    <p className="font-semibold">Room Summary:</p>
                    <p>
                      Problem: <span className="font-medium">{roomConfig.problem}</span>
                    </p>
                    <p>
                      Track: <span className="font-medium uppercase">{roomConfig.problemTrack}</span>
                    </p>
                    <p>
                      Max Participants: <span className="font-medium">2 (1-on-1 session)</span>
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-action">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary gap-2"
            onClick={onCreateRoom}
            disabled={
              isCreating ||
              (sessionKind === "coding" ? !codingOk : !discussionTopicOk)
            }
          >
            {isCreating ? (
              <LoaderIcon className="size-5 animate-spin" />
            ) : (
              <PlusIcon className="size-5" />
            )}

            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}

export default CreateSessionModal;
