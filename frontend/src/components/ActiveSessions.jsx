import {
  ArrowRightIcon,
  Code2Icon,
  CrownIcon,
  LoaderIcon,
  MessageSquareIcon,
  SparklesIcon,
  UsersIcon,
  ZapIcon,
} from "lucide-react";
import { Link } from "react-router";
import { getDifficultyBadgeClass } from "../lib/utils";

function ActiveSessions({ sessions, isLoading, isUserInSession }) {
  return (
    <div className="lg:col-span-2 card bg-base-100 border-2 border-primary/20 hover:border-primary/30 transition-colors h-full">
      <div className="card-body">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
              <ZapIcon className="size-5 text-white" />
            </div>
            <h2 className="text-xl font-black">Live Sessions</h2>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="size-2 bg-success rounded-full pulse-dot" />
            <span className="text-sm font-medium text-success">{sessions.length} active</span>
          </div>
        </div>

        {/* LIST */}
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <LoaderIcon className="size-8 animate-spin text-primary" />
            </div>
          ) : sessions.length > 0 ? (
            sessions.map((session) => {
              const p1 = !!session.participant;
              const p2 = !!session.participant2;
              const total = 1 + Number(p1) + Number(p2);
              const maxTotal = session.sessionType === "discussion" ? 3 : 2;
              const isFull = total >= maxTotal;
              const userIn = isUserInSession(session);

              return (
                <div
                  key={session._id}
                  className="rounded-xl bg-base-200 border border-base-300 hover:border-primary/40 transition-all duration-200 p-4 flex items-center gap-4"
                >
                  {/* ICON */}
                  <div className="relative size-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                    {session.sessionType === "discussion" ? (
                      <MessageSquareIcon className="size-6 text-white" />
                    ) : (
                      <Code2Icon className="size-6 text-white" />
                    )}
                    <div className="absolute -top-1 -right-1 size-3.5 bg-success rounded-full border-2 border-base-200" />
                  </div>

                  {/* INFO */}
                  <div className="flex-1 min-w-0">
                    {session.sessionType === "discussion" ? (
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold truncate">{session.topic || "Discussion"}</h3>
                        <span className="badge badge-xs badge-primary">Discussion</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold truncate">{session.problem}</h3>
                        <span className="badge badge-xs badge-outline uppercase">{session.problemTrack || "dsa"}</span>
                        <span className={`badge badge-xs ${getDifficultyBadgeClass(session.difficulty)}`}>
                          {session.difficulty
                            ? session.difficulty.slice(0, 1).toUpperCase() + session.difficulty.slice(1)
                            : "—"}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 text-xs text-base-content/60">
                      <span className="flex items-center gap-1">
                        <CrownIcon className="size-3" />
                        {session.host?.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <UsersIcon className="size-3" />
                        {total}/{maxTotal}
                      </span>
                      {isFull && !userIn ? (
                        <span className="badge badge-error badge-xs">FULL</span>
                      ) : (
                        <span className="badge badge-success badge-xs">OPEN</span>
                      )}
                    </div>
                  </div>

                  {/* ACTION */}
                  {isFull && !userIn ? (
                    <button className="btn btn-disabled btn-sm btn-ghost text-xs shrink-0">Full</button>
                  ) : (
                    <Link
                      to={`/session/${session._id}`}
                      className="btn btn-primary btn-sm gap-1.5 shrink-0"
                    >
                      {userIn ? "Rejoin" : "Join"}
                      <ArrowRightIcon className="size-3.5" />
                    </Link>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <div className="size-18 mx-auto mb-4 bg-gradient-to-br from-primary/15 to-secondary/15 rounded-3xl flex items-center justify-center w-20 h-20">
                <SparklesIcon className="size-9 text-primary/40" />
              </div>
              <p className="font-semibold text-base-content/60 mb-1">No active sessions</p>
              <p className="text-sm text-base-content/40">Be the first to create one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ActiveSessions;
