import { useEffect, useRef, useState } from "react";
import { getDifficultyBadgeClass } from "../lib/utils";

/**
 * Builds the table-of-contents entries based on which sections are present.
 */
function buildToc(problem) {
  const isMl = (problem?.track || "dsa") === "ml";
  const entries = [{ id: "desc", label: "Description" }];
  if (!isMl && problem?.examples?.length > 0) entries.push({ id: "examples", label: "Examples" });
  if (problem?.constraints?.length > 0) entries.push({ id: "constraints", label: "Constraints" });
  return entries;
}

/**
 * @param {object} props
 * @param {boolean} [props.showProblemPicker=true]
 * @param {import("react").ReactNode} [props.customHeader]
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

  const toc = buildToc(problem);
  const [activeSection, setActiveSection] = useState("desc");
  const scrollRef = useRef(null);

  // Highlight the ToC entry that is closest to the top of the scroll container.
  useEffect(() => {
    if (toc.length <= 1) return;
    const container = scrollRef.current;
    if (!container) return;

    const onScroll = () => {
      for (let i = toc.length - 1; i >= 0; i--) {
        const el = container.querySelector(`#section-${toc[i].id}`);
        if (el && el.getBoundingClientRect().top <= container.getBoundingClientRect().top + 80) {
          setActiveSection(toc[i].id);
          return;
        }
      }
      setActiveSection(toc[0].id);
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [toc.length]);

  const scrollToSection = (sectionId) => {
    const container = scrollRef.current;
    const el = container?.querySelector(`#section-${sectionId}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const defaultHeader = (
    <div className="p-5 bg-base-100 border-b border-base-300">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h1 className="text-2xl font-bold text-base-content leading-tight">{problem.title}</h1>
        <span className={`badge badge-lg shrink-0 ${getDifficultyBadgeClass(problem.difficulty)}`}>
          {problem.difficulty}
        </span>
      </div>
      <p className="text-sm text-base-content/60">
        {(problem.track || "dsa").toUpperCase()} · {problem.category}
      </p>
      {showProblemPicker && (
        <div className="mt-3">
          <select
            className="select select-sm w-full"
            value={currentProblemId}
            onChange={(e) => onProblemChange?.(e.target.value)}
          >
            {sameTrackProblems.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} — {p.difficulty}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-base-200">
      {/* Header */}
      <div className="shrink-0">{customHeader ?? defaultHeader}</div>

      {/* Table of contents — only shown when there are multiple sections */}
      {toc.length > 1 && (
        <div className="shrink-0 flex items-center gap-1 px-4 py-2 bg-base-100 border-b border-base-300 overflow-x-auto">
          {toc.map((entry) => (
            <button
              key={entry.id}
              onClick={() => scrollToSection(entry.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-150
                ${activeSection === entry.id
                  ? "bg-primary text-primary-content"
                  : "text-base-content/60 hover:text-base-content hover:bg-base-200"
                }`}
            >
              {entry.label}
            </button>
          ))}
        </div>
      )}

      {/* Scrollable body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="p-5 space-y-5">
          {/* DESCRIPTION */}
          <div id="section-desc" className="scroll-mt-4 bg-base-100 rounded-xl p-5 border border-base-300">
            <h2 className="text-base font-bold text-base-content mb-3">Description</h2>
            <div className="space-y-2 text-sm leading-relaxed text-base-content/85">
              <p>{problem.description?.text ?? "No description available."}</p>
              {descriptionNotes.map((note, idx) => (
                <p key={idx}>{note}</p>
              ))}
            </div>
          </div>

          {/* EXAMPLES */}
          {!isMl && problem.examples?.length > 0 && (
            <div id="section-examples" className="scroll-mt-4 bg-base-100 rounded-xl p-5 border border-base-300">
              <h2 className="text-base font-bold text-base-content mb-4">Examples</h2>
              <div className="space-y-4">
                {problem.examples.map((example, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <p className="text-xs font-semibold text-base-content/60 uppercase tracking-wide">
                      Example {idx + 1}
                    </p>
                    <div className="bg-base-200 rounded-lg p-3.5 font-mono text-sm space-y-1.5">
                      <div className="flex gap-2">
                        <span className="text-primary font-bold min-w-[64px]">Input:</span>
                        <span className="text-base-content/85">{example.input}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-secondary font-bold min-w-[64px]">Output:</span>
                        <span className="text-base-content/85">{example.output}</span>
                      </div>
                      {example.explanation && (
                        <div className="pt-2 border-t border-base-300 font-sans text-xs text-base-content/60">
                          <span className="font-semibold">Explanation:</span> {example.explanation}
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
            <div id="section-constraints" className="scroll-mt-4 bg-base-100 rounded-xl p-5 border border-base-300">
              <h2 className="text-base font-bold text-base-content mb-3">Constraints</h2>
              <ul className="space-y-1.5">
                {problem.constraints.map((constraint, idx) => (
                  <li key={idx} className="flex gap-2 text-sm text-base-content/85">
                    <span className="text-primary mt-0.5">•</span>
                    <code className="font-mono">{constraint}</code>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProblemDescription;
