import { useEffect, useState } from "react";
import { Loader2Icon, CheckCircleIcon, CircleIcon } from "lucide-react";

const STAGE_SETS = {
  java: [
    { key: "prepare", label: "Preparing code", durationEstMs: 500 },
    { key: "compile", label: "Compiling Java", durationEstMs: 3000 },
    { key: "run", label: "Running tests", durationEstMs: 4000 },
    { key: "evaluate", label: "Evaluating results", durationEstMs: 500 },
  ],
  python: [
    { key: "prepare", label: "Preparing code", durationEstMs: 300 },
    { key: "run", label: "Running tests", durationEstMs: 3000 },
    { key: "evaluate", label: "Evaluating results", durationEstMs: 500 },
  ],
  javascript: [
    { key: "prepare", label: "Preparing code", durationEstMs: 300 },
    { key: "run", label: "Running tests", durationEstMs: 2000 },
    { key: "evaluate", label: "Evaluating results", durationEstMs: 500 },
  ],
  ml: [
    { key: "queue", label: "Queued for judging", durationEstMs: 1000 },
    { key: "run", label: "Running ML tests", durationEstMs: 15000 },
    { key: "evaluate", label: "Evaluating results", durationEstMs: 2000 },
  ],
};

function ExecutionProgress({ language, isSubmit, startTime }) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    setElapsedMs(0);
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const stages = STAGE_SETS[language] || STAGE_SETS.javascript;
  let accumulated = 0;
  let activeIndex = 0;
  for (let i = 0; i < stages.length; i++) {
    accumulated += stages[i].durationEstMs;
    if (elapsedMs < accumulated) {
      activeIndex = i;
      break;
    }
    if (i === stages.length - 1) activeIndex = i;
  }

  const elapsedSec = (elapsedMs / 1000).toFixed(1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-medium text-base-content">
          {isSubmit ? "Submitting..." : "Running..."}
        </p>
        <span className="text-sm font-mono text-base-content/60">{elapsedSec}s</span>
      </div>

      <div className="space-y-2">
        {stages.map((stage, idx) => {
          const isDone = idx < activeIndex;
          const isActive = idx === activeIndex;
          return (
            <div key={stage.key} className="flex items-center gap-3">
              {isDone ? (
                <CheckCircleIcon className="size-5 text-success shrink-0" />
              ) : isActive ? (
                <Loader2Icon className="size-5 text-primary animate-spin shrink-0" />
              ) : (
                <CircleIcon className="size-5 text-base-content/30 shrink-0" />
              )}
              <span
                className={`text-sm ${
                  isDone
                    ? "text-success"
                    : isActive
                      ? "text-primary font-medium"
                      : "text-base-content/40"
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      <progress
        className="progress progress-primary w-full"
        value={Math.min(elapsedMs, 10000)}
        max={10000}
      />
    </div>
  );
}

export default ExecutionProgress;
