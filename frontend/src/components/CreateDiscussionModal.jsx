import { LoaderIcon, PlusIcon, MessageSquareIcon } from "lucide-react";

function CreateDiscussionModal({
  isOpen,
  onClose,
  topic,
  setTopic,
  onCreateSession,
  isCreating,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-2xl">
        <div className="flex items-center gap-3 mb-2">
          <MessageSquareIcon className="size-7 text-primary" />
          <h3 className="font-bold text-2xl">Create Discussion Session</h3>
        </div>
        <p className="text-base-content/70 mb-6">
          Enter a topic. Up to 3 people total can join (host + 2).
        </p>

        <div className="space-y-2">
          <label className="label">
            <span className="label-text font-semibold">Topic</span>
            <span className="label-text-alt text-error">*</span>
          </label>

          <input
            className="input input-bordered w-full"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. System design: URL shortener"
          />
        </div>

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose} disabled={isCreating}>
            Cancel
          </button>
          <button
            className="btn btn-primary gap-2"
            onClick={onCreateSession}
            disabled={isCreating || !topic.trim()}
          >
            {isCreating ? <LoaderIcon className="size-5 animate-spin" /> : <PlusIcon className="size-5" />}
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
}

export default CreateDiscussionModal;

