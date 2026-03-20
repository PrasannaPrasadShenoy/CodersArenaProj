import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { CalendarClockIcon, SearchIcon, UsersIcon, VideoIcon } from "lucide-react";
import Navbar from "../components/Navbar";
import { useActiveSessions, useMyRecentSessions } from "../hooks/useSessions";

function ExcalidrawSessionsPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | completed

  const { data: activeData, isLoading: loadingActive } = useActiveSessions();
  const { data: recentData, isLoading: loadingRecent } = useMyRecentSessions();

  const sessions = useMemo(() => {
    const active = activeData?.sessions || [];
    const recent = recentData?.sessions || [];
    const merged = [...active, ...recent];

    // de-duplicate by _id
    const deduped = [];
    const seen = new Set();
    for (const s of merged) {
      if (!s?._id || seen.has(s._id)) continue;
      seen.add(s._id);
      deduped.push(s);
    }

    const discussionOnly = deduped.filter((s) => s?.sessionType === "discussion");

    const byFilter = discussionOnly.filter((s) => {
      if (filter === "active") return s.status === "active";
      if (filter === "completed") return s.status === "completed";
      return true;
    });

    const q = query.trim().toLowerCase();
    const byQuery = byFilter.filter((s) => {
      if (!q) return true;
      const topic = (s.topic || "").toLowerCase();
      const host = (s.host?.name || "").toLowerCase();
      return topic.includes(q) || host.includes(q);
    });

    return byQuery.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [activeData?.sessions, recentData?.sessions, query, filter]);

  const isLoading = loadingActive || loadingRecent;

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-5">
          <h1 className="text-3xl font-bold">Manage Excalidraw Sessions</h1>
          <p className="text-base-content/70 mt-1">
            Reopen and continue any discussion whiteboard session.
          </p>
        </div>

        <div className="card bg-base-100 border border-base-300 mb-4">
          <div className="card-body py-4">
            <div className="flex flex-wrap gap-2 items-center">
              <label className="input input-bordered flex items-center gap-2 w-80 max-w-full">
                <SearchIcon className="size-4 opacity-70" />
                <input
                  type="text"
                  className="grow"
                  placeholder="Search by topic or host"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>

              <div className="join ml-auto">
                <button
                  className={`btn btn-sm join-item ${filter === "all" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setFilter("all")}
                >
                  All
                </button>
                <button
                  className={`btn btn-sm join-item ${filter === "active" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setFilter("active")}
                >
                  Active
                </button>
                <button
                  className={`btn btn-sm join-item ${filter === "completed" ? "btn-primary" : "btn-ghost"}`}
                  onClick={() => setFilter("completed")}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="py-16 text-center">
              <span className="loading loading-spinner loading-lg text-primary" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body text-center py-10">
                <p className="font-semibold">No Excalidraw sessions found.</p>
                <p className="text-base-content/60 text-sm">
                  Create one from the Excalidraw page and it will appear here.
                </p>
              </div>
            </div>
          ) : (
            sessions.map((s) => {
              const members = 1 + Number(!!s.participant) + Number(!!s.participant2);
              return (
                <div key={s._id} className="card bg-base-100 border border-base-300">
                  <div className="card-body py-4">
                    <div className="flex items-start gap-3 justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold truncate">{s.topic || "Discussion"}</h3>
                          <span className="badge badge-primary badge-sm">Discussion</span>
                          <span
                            className={`badge badge-sm ${
                              s.status === "active" ? "badge-success" : "badge-ghost"
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/70">
                          <span className="inline-flex items-center gap-1">
                            <UsersIcon className="size-4" />
                            {members}/3 members
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CalendarClockIcon className="size-4" />
                            Updated {new Date(s.updatedAt).toLocaleString()}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <VideoIcon className="size-4" />
                            Host: {s.host?.name || "Unknown"}
                          </span>
                        </div>
                      </div>

                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => navigate(`/excalidraw/sessions/${s._id}/board`)}
                      >
                        Open board
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ExcalidrawSessionsPage;

