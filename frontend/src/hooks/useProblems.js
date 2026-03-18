import { useQuery } from "@tanstack/react-query";
import { getProblemsList, getProblemById } from "../api/problems";

const PROBLEMS_LIST_KEY = ["problems", "list"];
const PROBLEM_KEY = (id) => ["problems", "detail", id];

/**
 * Returns the full list of problems (metadata + optional starter/expected from static merge).
 * Used for: ProblemsPage, CreateSessionModal, SessionPage (resolve title -> id).
 */
export function useProblemsList() {
  const query = useQuery({
    queryKey: PROBLEMS_LIST_KEY,
    queryFn: getProblemsList,
    staleTime: 2 * 60 * 1000,
  });

  const problemsMap = query.data || {};
  const problemsArray = Object.values(problemsMap);

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
