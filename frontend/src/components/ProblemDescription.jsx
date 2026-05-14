import { getDifficultyBadgeClass } from "../lib/utils";
import { useProblemStats } from "../hooks/useProblems";
import { BarChart3Icon, ClockIcon, TrophyIcon, UsersIcon } from "lucide-react";

/**
 * @param {object} props
 * @param {boolean} [props.showProblemPicker=true]
 * @param {import("react").ReactNode} [props.customHeader] — replaces default title/picker header when set
 */
function ProblemDescription({
  problem,
  currentProblemId,
  onProblemChange,
  allProblems,
  showProblemPicker = true,
  customHeader = null,
}) {
  const currentTrack = problem?.track || "dsa";
  const isMl = currentTrack === "ml";
  const sameTrackProblems = allProblems.filter((p) => (p.track || "dsa") === currentTrack);
  const descriptionNotes = isMl ? [] : (problem.description?.notes ?? []);
  const { stats } = useProblemStats(currentProblemId, currentTrack);

  const defaultHeader = (
    <div className="p-6 bg-base-100 border-b border-base-300">
      <div className="flex items-start justify-between mb-3">
        <h1 className="text-3xl font-bold text-base-content">{problem.title}</h1>
        <span className={`badge ${getDifficultyBadgeClass(problem.difficulty)}`}>
          {problem.difficulty}
        </span>
      </div>
      <p className="text-base-content/60">
        {(problem.track || "dsa").toUpperCase()} • {problem.category}
      </p>

      {showProblemPicker ? (
        <div className="mt-4">
          <select
            className="select select-sm w-full"
            value={currentProblemId}
            onChange={(e) => onProblemChange?.(e.target.value)}
          >
            {sameTrackProblems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} - {p.difficulty}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-base-200">
      {customHeader ?? defaultHeader}

      <div className="p-6 space-y-6">
        {/* PROBLEM DESC */}
        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
          <h2 className="text-xl font-bold text-base-content">Description</h2>

          <div className="space-y-3 text-base leading-relaxed">
            <p className="text-base-content/90">
              {problem.description?.text ?? "No description available."}
            </p>
            {descriptionNotes.map((note, idx) => (
              <p key={idx} className="text-base-content/90">
                {note}
              </p>
            ))}
          </div>
        </div>

        {/* EXAMPLES SECTION */}
        {problem.examples?.length > 0 && (
        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
          <h2 className="text-xl font-bold mb-4 text-base-content">Examples</h2>
          <div className="space-y-4">
            {problem.examples.map((example, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-sm">{idx + 1}</span>
                  <p className="font-semibold text-base-content">Example {idx + 1}</p>
                </div>
                <div className="bg-base-200 rounded-lg p-4 font-mono text-sm space-y-1.5">
                  <div className="flex gap-2">
                    <span className="text-primary font-bold min-w-[70px]">Input:</span>
                    <span>{example.input}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-secondary font-bold min-w-[70px]">Output:</span>
                    <span>{example.output}</span>
                  </div>
                  {example.explanation && (
                    <div className="pt-2 border-t border-base-300 mt-2">
                      <span className="text-base-content/60 font-sans text-xs">
                        <span className="font-semibold">Explanation:</span> {example.explanation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* CONSTRAINTS */}
        {problem.constraints?.length > 0 && (
        <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
          <h2 className="text-xl font-bold mb-4 text-base-content">Constraints</h2>
          <ul className="space-y-2 text-base-content/90">
            {problem.constraints.map((constraint, idx) => (
              <li key={idx} className="flex gap-2">
                <span className="text-primary">•</span>
                <code className="text-sm">{constraint}</code>
              </li>
            ))}
          </ul>
        </div>
        )}

        {stats && stats.totalSubmissions > 0 && (
          <div className="bg-base-100 rounded-xl shadow-sm p-5 border border-base-300">
            <h2 className="text-xl font-bold mb-4 text-base-content">Community Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              {stats.solveRate != null && (
                <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                  <TrophyIcon className="size-5 text-success shrink-0" />
                  <div>
                    <p className="text-lg font-bold text-base-content">{stats.solveRate}%</p>
                    <p className="text-xs text-base-content/60">Solve rate</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                <BarChart3Icon className="size-5 text-primary shrink-0" />
                <div>
                  <p className="text-lg font-bold text-base-content">{stats.totalSubmissions}</p>
                  <p className="text-xs text-base-content/60">Submissions</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                <UsersIcon className="size-5 text-info shrink-0" />
                <div>
                  <p className="text-lg font-bold text-base-content">{stats.totalAttemptedUsers}</p>
                  <p className="text-xs text-base-content/60">Users attempted</p>
                </div>
              </div>
              {stats.avgRuntimeMs != null && (
                <div className="flex items-center gap-2 p-3 bg-base-200 rounded-lg">
                  <ClockIcon className="size-5 text-warning shrink-0" />
                  <div>
                    <p className="text-lg font-bold text-base-content">{stats.avgRuntimeMs} ms</p>
                    <p className="text-xs text-base-content/60">Avg runtime</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProblemDescription;
