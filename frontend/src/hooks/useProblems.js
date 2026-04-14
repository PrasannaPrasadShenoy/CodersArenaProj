import { useQuery } from "@tanstack/react-query";
import { getProblemsList, getProblemById } from "../api/problems";

const PROBLEMS_LIST_KEY = (track) => ["problems", "list", track || "all"];
const PROBLEM_KEY = (id) => ["problems", "detail", id];

/**
 * Returns the full list of problems (metadata + optional starter/expected from static merge).
 * Used for: ProblemsPage, CreateSessionModal, SessionPage (resolve title -> id).
 */
export function useProblemsList(track = "") {
  const query = useQuery({
    queryKey: PROBLEMS_LIST_KEY(track),
    queryFn: () => getProblemsList(track),
    staleTime: 2 * 60 * 1000,
  });

  const problemsMap = query.data || {};
  const problemsArray = Object.values(problemsMap).sort((a, b) => {
    const trackA = a?.track || "dsa";
    const trackB = b?.track || "dsa";
    if (trackA === "ml" && trackB === "ml") {
      const ia = typeof a.curriculumIndex === "number" ? a.curriculumIndex : 9999;
      const ib = typeof b.curriculumIndex === "number" ? b.curriculumIndex : 9999;
      if (ia !== ib) return ia - ib;
    }
    const da = a?.difficulty || "";
    const db = b?.difficulty || "";
    if (da !== db) return da.localeCompare(db);
    return (a?.title || "").localeCompare(b?.title || "");
  });

  return {
    problems: problemsMap,
    problemsArray,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}

/**
 * Returns a single problem by id (full legacy shape including starterCode, expectedOutput).
 * Used for: ProblemPage, SessionPage (after resolving title -> id).
 */
export function useProblem(id) {
  const query = useQuery({
    queryKey: PROBLEM_KEY(id),
    queryFn: () => getProblemById(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });

  return {
    problem: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
