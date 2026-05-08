import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import Navbar from "../components/Navbar";
import { ProblemListSkeleton } from "../components/skeletons/ProblemsPageSkeleton";
import { usePageTitle } from "../hooks/usePageTitle";

import { useProblemsList } from "../hooks/useProblems";
import { ChevronRightIcon, Code2Icon, SearchIcon } from "lucide-react";
import { getDifficultyBadgeClass } from "../lib/utils";
import { useMlProgress } from "../hooks/useMlSubmissions";
import { useUserProgress } from "../hooks/useUserProgress";

const DIFFICULTIES = ["Easy", "Medium", "Hard"];
const SUGGESTION_LIMIT = 8;

function canonicalDifficulty(d) {
  const t = String(d || "").toLowerCase();
  if (t === "easy") return "Easy";
  if (t === "medium") return "Medium";
  if (t === "hard") return "Hard";
  return d || "";
}

function matchesSearchQuery(problem, q) {
  if (!q) return true;
  const lower = q.toLowerCase();
  const title = (problem.title || "").toLowerCase();
  const id = (problem.id || "").toLowerCase();
  const name = (problem.name || "").toLowerCase();
  return title.includes(lower) || id.includes(lower) || name.includes(lower);
}

function ProblemsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTrack = searchParams.get("track") === "ml" ? "ml" : "dsa";
  usePageTitle(`${selectedTrack.toUpperCase()} Problems`);

  const { problemsArray: problems, isLoading } = useProblemsList(selectedTrack);
  const { data: mlProgressData } = useMlProgress({ enabled: selectedTrack === "ml" });
  const mlProgress = mlProgressData?.progress;
  const { data: userProgress } = useUserProgress();

  const dsaSolvedSet = useMemo(
    () => new Set(userProgress?.dsa?.solvedIds || []),
    [userProgress?.dsa?.solvedIds]
  );

  const dsaPublicClearedSet = useMemo(
    () => new Set(userProgress?.dsa?.publicClearedIds || []),
    [userProgress?.dsa?.publicClearedIds]
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [difficultyOn, setDifficultyOn] = useState({
    Easy: true,
    Medium: true,
    Hard: true,
  });

  const searchWrapRef = useRef(null);

  useEffect(() => {
    setSearchQuery("");
    setSuggestionsOpen(false);
    setHighlightIndex(-1);
    setDifficultyOn({ Easy: true, Medium: true, Hard: true });
  }, [selectedTrack]);

  useEffect(() => {
    const onDocMouseDown = (e) => {
      if (!searchWrapRef.current?.contains(e.target)) {
        setSuggestionsOpen(false);
        setHighlightIndex(-1);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, []);

  const anyDifficultySelected = difficultyOn.Easy || difficultyOn.Medium || difficultyOn.Hard;

  const passesDifficulty = useCallback(
    (problem) => {
      if (!anyDifficultySelected) return true;
      const d = canonicalDifficulty(problem.difficulty);
      return difficultyOn[d] === true;
    },
    [anyDifficultySelected, difficultyOn]
  );

  const filteredProblems = useMemo(() => {
    const q = searchQuery.trim();
    return problems.filter((p) => passesDifficulty(p) && matchesSearchQuery(p, q));
  }, [problems, searchQuery, passesDifficulty]);

  const suggestions = useMemo(() => {
    const q = searchQuery.trim();
    if (q.length < 1) return [];
    return problems
      .filter((p) => passesDifficulty(p) && matchesSearchQuery(p, q))
      .slice(0, SUGGESTION_LIMIT);
  }, [problems, searchQuery, passesDifficulty]);

  useEffect(() => {
    if (highlightIndex >= suggestions.length) setHighlightIndex(-1);
  }, [suggestions.length, highlightIndex]);

  const toggleDifficulty = (d) => {
    setDifficultyOn((prev) => ({ ...prev, [d]: !prev[d] }));
    setHighlightIndex(-1);
  };

  const easyProblemsCount = problems.filter((p) => p.difficulty === "Easy").length;
  const mediumProblemsCount = problems.filter((p) => p.difficulty === "Medium").length;
  const hardProblemsCount = problems.filter((p) => p.difficulty === "Hard").length;

  const setTrack = (track) => {
    const next = new URLSearchParams(searchParams);
    next.set("track", track);
    setSearchParams(next);
  };

  const onSearchKeyDown = (e) => {
    if (!suggestionsOpen || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = highlightIndex >= 0 ? suggestions[highlightIndex] : suggestions[0];
      if (pick) {
        setSuggestionsOpen(false);
        navigate(`/problem/${pick.id}`);
      }
    } else if (e.key === "Escape") {
      setSuggestionsOpen(false);
      setHighlightIndex(-1);
    }
  };

  const selectSuggestion = (problem) => {
    setSuggestionsOpen(false);
    setHighlightIndex(-1);
    navigate(`/problem/${problem.id}`);
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Practice Problems</h1>
          <p className="text-base-content/70">
            Sharpen your coding skills with curated tracks for DSA and Machine Learning.
          </p>
        </div>

        <div className="tabs tabs-boxed mb-6 inline-flex">
          <button
            className={`tab ${selectedTrack === "dsa" ? "tab-active" : ""}`}
            onClick={() => setTrack("dsa")}
          >
            DSA
          </button>
          <button
            className={`tab ${selectedTrack === "ml" ? "tab-active" : ""}`}
            onClick={() => setTrack("ml")}
          >
            ML
          </button>
        </div>

        {/* Search + difficulty filters */}
        <div className="mb-6 space-y-4">
          <div className="relative" ref={searchWrapRef}>
            <label className="sr-only" htmlFor="problems-search">
              Search problems
            </label>
            <div className="relative">
              <SearchIcon
                className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-base-content/50 pointer-events-none"
                aria-hidden
              />
              <input
                id="problems-search"
                type="search"
                autoComplete="off"
                placeholder="Search by title or problem id…"
                className="input input-bordered w-full pl-10 pr-4"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSuggestionsOpen(true);
                  setHighlightIndex(-1);
                }}
                onFocus={() => {
                  if (searchQuery.trim().length >= 1) setSuggestionsOpen(true);
                }}
                onKeyDown={onSearchKeyDown}
                role="combobox"
                aria-expanded={suggestionsOpen && suggestions.length > 0}
                aria-controls="problems-search-suggestions"
                aria-autocomplete="list"
              />
            </div>
            {suggestionsOpen && suggestions.length > 0 && (
              <ul
                id="problems-search-suggestions"
                className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-base-300 bg-base-100 py-1 shadow-lg"
                role="listbox"
              >
                {suggestions.map((p, idx) => (
                  <li key={p.id} role="option" aria-selected={highlightIndex === idx}>
                    <button
                      type="button"
                      className={`flex w-full flex-col gap-0.5 px-4 py-2.5 text-left text-sm hover:bg-base-200 ${
                        highlightIndex === idx ? "bg-base-200" : ""
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(p)}
                    >
                      <span className="font-medium text-base-content">{p.title}</span>
                      <span className="text-xs text-base-content/60">
                        <span className={`badge badge-xs ${getDifficultyBadgeClass(p.difficulty)}`}>
                          {p.difficulty}
                        </span>
                        <span className="ml-2">{p.category}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-base-content/70 mr-1">Difficulty:</span>
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => toggleDifficulty(d)}
                className={`btn btn-sm rounded-full border-0 ${
                  difficultyOn[d]
                    ? d === "Easy"
                      ? "bg-success/20 text-success hover:bg-success/30"
                      : d === "Medium"
                        ? "bg-warning/20 text-warning hover:bg-warning/30"
                        : "bg-error/20 text-error hover:bg-error/30"
                    : "btn-ghost opacity-50 hover:opacity-80"
                }`}
                aria-pressed={difficultyOn[d]}
              >
                {d}
              </button>
            ))}
            {!anyDifficultySelected && (
              <span className="text-xs text-base-content/50">(all difficulties shown)</span>
            )}
          </div>

          {!isLoading && (
            <p className="text-sm text-base-content/60">
              Showing <span className="font-semibold text-base-content">{filteredProblems.length}</span>
              {filteredProblems.length !== problems.length && (
                <>
                  {" "}
                  of <span className="font-semibold text-base-content">{problems.length}</span>
                </>
              )}{" "}
              {selectedTrack.toUpperCase()} problems
            </p>
          )}
        </div>

        {/* PROBLEMS LIST */}
        <div className="space-y-4">
          {isLoading ? (
            <ProblemListSkeleton />
          ) : filteredProblems.length === 0 ? (
            <div className="card bg-base-100 border border-base-300">
              <div className="card-body items-center text-center py-12">
                <p className="text-lg font-medium text-base-content/80">No problems match your filters</p>
                <p className="text-sm text-base-content/60 max-w-md">
                  Try clearing the search box or enabling more difficulty tags.
                </p>
              </div>
            </div>
          ) : (
          filteredProblems.map((problem) => (
            <Link
              key={problem.id}
              to={`/problem/${problem.id}`}
              className="card bg-base-100 hover:scale-[1.01] transition-transform"
            >
              <div className="card-body">
                <div className="flex items-center justify-between gap-4">
                  {/* LEFT SIDE */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Code2Icon className="size-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h2 className="text-xl font-bold">{problem.title}</h2>
                          <span className={`badge ${getDifficultyBadgeClass(problem.difficulty)}`}>
                            {problem.difficulty}
                          </span>
                          {selectedTrack === "dsa" && dsaSolvedSet.has(problem.id) && (
                            <span className="badge badge-success badge-outline">Solved</span>
                          )}
                          {selectedTrack === "dsa" &&
                            !dsaSolvedSet.has(problem.id) &&
                            dsaPublicClearedSet.has(problem.id) && (
                              <span className="badge badge-warning badge-outline">Public tests OK</span>
                            )}
                          {selectedTrack === "ml" &&
                            mlProgress?.latestByProblem?.[problem.id]?.status === "passed" && (
                              <span className="badge badge-success badge-outline">Solved</span>
                            )}
                        </div>
                        <p className="text-sm text-base-content/60">
                          {(problem.track || "dsa").toUpperCase()} • {problem.category}
                        </p>
                      </div>
                    </div>
                    <p className="text-base-content/80 mb-3">
                      {problem.description?.text ?? ""}
                    </p>
                  </div>
                  {/* RIGHT SIDE */}

                  <div className="flex items-center gap-2 text-primary">
                    <span className="font-medium">Solve</span>
                    <ChevronRightIcon className="size-5" />
                  </div>
                </div>
              </div>
            </Link>
          ))
          )}
        </div>

        {/* STATS FOOTER */}
        <div className="mt-12 card bg-base-100 shadow-lg">
          <div className="card-body">
            <div className="stats stats-vertical lg:stats-horizontal">
              <div className="stat">
                <div className="stat-title">Total {selectedTrack.toUpperCase()} Problems</div>
                <div className="stat-value text-primary">{problems.length}</div>
              </div>

              <div className="stat">
                <div className="stat-title">Easy</div>
                <div className="stat-value text-success">{easyProblemsCount}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Medium</div>
                <div className="stat-value text-warning">{mediumProblemsCount}</div>
              </div>
              <div className="stat">
                <div className="stat-title">Hard</div>
                <div className="stat-value text-error">{hardProblemsCount}</div>
              </div>
              {selectedTrack === "dsa" && (
                <>
                  <div className="stat">
                    <div className="stat-title">Fully solved (all tests)</div>
                    <div className="stat-value text-success">{userProgress?.dsa?.solvedCount ?? 0}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Public tests cleared</div>
                    <div className="stat-value text-warning">{userProgress?.dsa?.publicClearedCount ?? 0}</div>
                  </div>
                </>
              )}
              {selectedTrack === "ml" && (
                <>
                  <div className="stat">
                    <div className="stat-title">Solved</div>
                    <div className="stat-value text-success">{mlProgress?.solved || 0}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Attempted</div>
                    <div className="stat-value text-info">{mlProgress?.attempted || 0}</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ProblemsPage;
