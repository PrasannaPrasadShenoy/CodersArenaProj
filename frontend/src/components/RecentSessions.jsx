import { Clock, Code2, MessageSquareIcon, Trophy, Users } from "lucide-react";
import { getDifficultyBadgeClass } from "../lib/utils";
import { formatDistanceToNow } from "date-fns";

function RecentSessions({ sessions, isLoading }) {
  return (
    <div className="card bg-base-100 border-2 border-accent/20 hover:border-accent/30 transition-colors mt-6">
      <div className="card-body">
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2 bg-gradient-to-br from-accent to-secondary rounded-xl">
            <Clock className="size-5 text-white" />
          </div>
          <h2 className="text-xl font-black">Past Sessions</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card bg-base-200 border border-base-300 animate-pulse">
                <div className="card-body p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="size-11 rounded-xl bg-base-300 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-base-300 rounded w-full" />
                      <div className="h-4 bg-base-300 rounded w-2/3" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2 border-t border-base-300">
                    <div className="h-3.5 bg-base-300 rounded w-24" />
                    <div className="h-3.5 bg-base-300 rounded w-20" />
                  </div>
                </div>
              </div>
            ))
          ) : sessions.length > 0 ? (
            sessions.map((session) => {
              const isActive = session.status === "active";
              const total = 1 + Number(!!session.participant) + Number(!!session.participant2);

              return (
                <div
                  key={session._id}
                  className={`card border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isActive
                      ? "bg-success/8 border-success/30 hover:border-success/50"
                      : "bg-base-200 border-base-300 hover:border-primary/30"
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-3 right-3">
                      <div className="badge badge-success badge-sm gap-1">
                        <span className="size-1.5 rounded-full bg-current pulse-dot" />
                        LIVE
                      </div>
                    </div>
                  )}

                  <div className="card-body p-4 gap-3">
                    {/* TOP ROW */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${
                          isActive
                            ? "bg-gradient-to-br from-success to-success/70"
                            : "bg-gradient-to-br from-primary to-secondary"
                        }`}
                      >
                        {session.sessionType === "discussion" ? (
                          <MessageSquareIcon className="size-5 text-white" />
                        ) : (
                          <Code2 className="size-5 text-white" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        {session.sessionType === "discussion" ? (
                          <>
                            <h3 className="font-bold text-sm truncate mb-1">{session.topic || "Discussion"}</h3>
                            <span className="badge badge-xs badge-primary">Discussion</span>
                          </>
                        ) : (
                          <>
                            <h3 className="font-bold text-sm truncate mb-1">{session.problem}</h3>
                            <div className="flex gap-1 flex-wrap">
                              <span className="badge badge-xs badge-outline uppercase">{session.problemTrack || "dsa"}</span>
                              <span className={`badge badge-xs ${getDifficultyBadgeClass(session.difficulty)}`}>
                                {session.difficulty
                                  ? session.difficulty.slice(0, 1).toUpperCase() + session.difficulty.slice(1)
                                  : "—"}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* META */}
                    <div className="flex items-center gap-3 text-xs text-base-content/55 pt-2 border-t border-base-300">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="size-3" />
                        {total} {total === 1 ? "member" : "members"}
                      </span>
                      <span className="ml-auto text-base-content/35">
                        {new Date(session.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-14">
              <div className="size-20 mx-auto mb-4 bg-gradient-to-br from-accent/15 to-secondary/15 rounded-3xl flex items-center justify-center">
                <Trophy className="size-9 text-accent/40" />
              </div>
              <p className="font-semibold text-base-content/60 mb-1">No sessions yet</p>
              <p className="text-sm text-base-content/40">Start your coding journey today!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RecentSessions;
