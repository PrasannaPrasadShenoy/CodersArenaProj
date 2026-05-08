function Bone({ className = "" }) {
  return <div className={`bg-base-300 animate-pulse rounded-lg ${className}`} />;
}

export function StatsCardsSkeleton() {
  return (
    <div className="lg:col-span-1 grid grid-cols-1 gap-4">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card bg-base-100 border-2 border-base-300">
          <div className="card-body py-5 px-5 space-y-3">
            <div className="flex items-start justify-between">
              <Bone className="size-11 rounded-xl" />
              <Bone className="h-5 w-12 rounded-full" />
            </div>
            <Bone className="h-9 w-16" />
            <Bone className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ActiveSessionsSkeleton() {
  return (
    <div className="lg:col-span-2 card bg-base-100 border-2 border-base-300 h-full">
      <div className="card-body">
        <div className="flex items-center justify-between mb-5">
          <Bone className="h-7 w-36" />
          <Bone className="h-5 w-20 rounded-full" />
        </div>
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-base-200 p-4 flex items-center gap-4">
              <Bone className="size-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Bone className="h-5 w-3/4" />
                <Bone className="h-4 w-1/2" />
              </div>
              <Bone className="h-8 w-16 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function RecentSessionsSkeleton() {
  return (
    <div className="card bg-base-100 border-2 border-base-300 mt-6">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-5">
          <Bone className="size-9 rounded-xl" />
          <Bone className="h-7 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card bg-base-200 border border-base-300">
              <div className="card-body p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Bone className="size-11 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Bone className="h-5 w-full" />
                    <Bone className="h-4 w-2/3" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2 border-t border-base-300">
                  <Bone className="h-3.5 w-24" />
                  <Bone className="h-3.5 w-20" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
