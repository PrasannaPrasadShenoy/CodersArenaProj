function Bone({ className = "" }) {
  return <div className={`bg-base-300 animate-pulse rounded-lg ${className}`} />;
}

export function ProblemListSkeleton() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="card bg-base-100 border border-base-300">
          <div className="card-body">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1">
                <Bone className="size-12 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Bone className="h-6 w-48" />
                    <Bone className="h-5 w-16 rounded-full" />
                  </div>
                  <Bone className="h-4 w-24" />
                  <Bone className="h-4 w-full max-w-md" />
                </div>
              </div>
              <Bone className="h-5 w-14 shrink-0" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ProblemPageSkeleton() {
  return (
    <div className="h-full flex flex-col bg-base-200">
      {/* header */}
      <div className="p-6 bg-base-100 border-b border-base-300 space-y-3">
        <Bone className="h-9 w-64" />
        <Bone className="h-4 w-40" />
        <Bone className="h-8 w-full mt-2" />
      </div>
      {/* body */}
      <div className="p-6 space-y-6">
        <div className="bg-base-100 rounded-xl p-5 border border-base-300 space-y-3">
          <Bone className="h-6 w-28" />
          <Bone className="h-4 w-full" />
          <Bone className="h-4 w-5/6" />
          <Bone className="h-4 w-4/6" />
        </div>
        <div className="bg-base-100 rounded-xl p-5 border border-base-300 space-y-3">
          <Bone className="h-6 w-24" />
          <Bone className="h-20 w-full rounded-lg" />
          <Bone className="h-20 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
