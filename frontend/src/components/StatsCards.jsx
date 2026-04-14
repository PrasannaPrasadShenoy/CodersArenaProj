import { CheckCircle2Icon, TrophyIcon, UsersIcon } from "lucide-react";

function StatsCards({ activeSessionsCount, totalSessionsCount, problemsSolvedCount, dsaPublicClearedCount }) {
  return (
    <div className="lg:col-span-1 grid grid-cols-1 gap-6">
      <div className="card bg-base-100 border-2 border-primary/20 hover:border-primary/40">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-primary/10 rounded-2xl">
              <UsersIcon className="w-7 h-7 text-primary" />
            </div>
            <div className="badge badge-primary">Live</div>
          </div>
          <div className="text-4xl font-black mb-1">{activeSessionsCount}</div>
          <div className="text-sm opacity-60">Active Sessions</div>
        </div>
      </div>

      <div className="card bg-base-100 border-2 border-secondary/20 hover:border-secondary/40">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-secondary/10 rounded-2xl">
              <TrophyIcon className="w-7 h-7 text-secondary" />
            </div>
          </div>
          <div className="text-4xl font-black mb-1">{totalSessionsCount}</div>
          <div className="text-sm opacity-60">Your sessions (all time)</div>
        </div>
      </div>

      <div className="card bg-base-100 border-2 border-success/20 hover:border-success/40">
        <div className="card-body">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-success/10 rounded-2xl">
              <CheckCircle2Icon className="w-7 h-7 text-success" />
            </div>
          </div>
          <div className="text-4xl font-black mb-1">{problemsSolvedCount}</div>
          <div className="text-sm opacity-60">Fully solved (DSA all tests + ML)</div>
          {typeof dsaPublicClearedCount === "number" && dsaPublicClearedCount > 0 ? (
            <p className="text-xs opacity-50 mt-1">
              +{dsaPublicClearedCount} DSA with public tests only
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default StatsCards;
