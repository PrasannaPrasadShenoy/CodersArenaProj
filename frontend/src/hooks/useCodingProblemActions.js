import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import confetti from "canvas-confetti";
import { executeCode } from "../lib/piston";
import { dsaOutputsMatch } from "../lib/dsaCompare";
import {
  useCreateDsaSubmission,
  useCreateMlSubmission,
  useSubmissionById,
} from "./useMlSubmissions";
import { progressQueryKey, useRecordDsaPublicCleared } from "./useUserProgress";

function triggerConfettiWide() {
  confetti({ particleCount: 80, spread: 250, origin: { x: 0.2, y: 0.6 } });
  confetti({ particleCount: 80, spread: 250, origin: { x: 0.8, y: 0.6 } });
}

function triggerConfettiSmall() {
  confetti({ particleCount: 60, spread: 200, origin: { x: 0.5, y: 0.55 } });
}

/**
 * Shared DSA run (public examples) + DSA submit (all tests) + ML submit/poll for Problem and Session pages.
 * @param {{ problemId: string; problemData: object | null | undefined; confettiStyle?: "wide" | "small" }} opts
 */
export function useCodingProblemActions({ problemId, problemData, confettiStyle = "wide" }) {
  const currentTrack = problemData?.track || "dsa";
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [latestSubmissionId, setLatestSubmissionId] = useState("");
  const notifiedSubmissionStatus = useRef("");

  const queryClient = useQueryClient();
  const createMlSubmission = useCreateMlSubmission();
  const createDsaSubmission = useCreateDsaSubmission();
  const recordDsaPublicCleared = useRecordDsaPublicCleared();

  const { data: submissionData } = useSubmissionById(latestSubmissionId, { poll: true });
  const activeSubmission = submissionData?.submission || null;

  useEffect(() => {
    setLatestSubmissionId("");
    notifiedSubmissionStatus.current = "";
  }, [problemId]);

  useEffect(() => {
    if (problemData?.starterCode?.[selectedLanguage]) {
      setCode(problemData.starterCode[selectedLanguage]);
      setOutput(null);
    }
  }, [problemData, selectedLanguage]);

  useEffect(() => {
    if (currentTrack === "ml") {
      setSelectedLanguage("python");
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!activeSubmission) return;
    const statusKey = `${activeSubmission.id}:${activeSubmission.status}`;
    if (
      statusKey !== notifiedSubmissionStatus.current &&
      (activeSubmission.status === "passed" || activeSubmission.status === "failed")
    ) {
      notifiedSubmissionStatus.current = statusKey;
      if (activeSubmission.status === "passed") {
        if (confettiStyle === "wide") triggerConfettiWide();
        else triggerConfettiSmall();
        toast.success("ML submission passed all tests!");
        queryClient.invalidateQueries({ queryKey: progressQueryKey });
        queryClient.invalidateQueries({ queryKey: ["ml", "progress"] });
      } else {
        toast.error("ML submission failed. Review test feedback.");
      }
    }
    const isSuccess = activeSubmission.status === "passed";
    const isPending = activeSubmission.status === "queued" || activeSubmission.status === "running";
    setOutput({
      success: isSuccess,
      pending: isPending,
      summary: activeSubmission.summary,
      runtimeMs: activeSubmission.runtimeMs,
      testResults: activeSubmission.testResults || [],
      hint: activeSubmission.hint || "",
      error: activeSubmission.error || "",
    });
  }, [activeSubmission, queryClient, confettiStyle]);

  const handleLanguageChange = useCallback(
    (e) => {
      const newLang = e.target.value;
      setSelectedLanguage(newLang);
      const starter = problemData?.starterCode?.[newLang] ?? "";
      setCode(starter);
      setOutput(null);
    },
    [problemData]
  );

  const fireConfetti = confettiStyle === "wide" ? triggerConfettiWide : triggerConfettiSmall;

  const handleRunCode = useCallback(async () => {
    if (currentTrack === "ml") {
      if (!problemId) {
        setOutput({
          success: false,
          pending: false,
          summary: "Submission failed",
          testResults: [],
          error: "Problem configuration is missing.",
        });
        return;
      }
      try {
        const submissionRes = await createMlSubmission.mutateAsync({
          problemId,
          code,
        });
        const submissionId = submissionRes?.submission?.id;
        if (submissionId) {
          setLatestSubmissionId(submissionId);
          setOutput({
            success: false,
            pending: true,
            summary: "Submission queued. Waiting for judge...",
            testResults: [],
          });
        }
      } catch (error) {
        const backendMsg =
          error?.response?.data?.message || error?.response?.data?.error || error?.message;
        setOutput({
          success: false,
          pending: false,
          summary: "Submission failed",
          testResults: [],
          error: backendMsg || "Unable to submit solution",
        });
      }
      return;
    }

    setIsRunning(true);
    setOutput(null);

    const execOpts =
      problemId && String(problemId).trim()
        ? { problemId: String(problemId).trim(), mode: "dsa_public" }
        : {};

    const result = await executeCode(selectedLanguage, code, execOpts);
    setIsRunning(false);

    if (result.mode === "dsa_public") {
      setOutput({
        success: result.success,
        pending: false,
        summary: result.summary,
        runtimeMs: result.runtimeMs,
        testResults: result.testResults || [],
        error: result.error || "",
      });
      if (!result.success) {
        if (result.error) toast.error(result.error);
        else toast.error("Some public tests failed.");
      } else {
        fireConfetti();
        toast.success("All public tests passed! Submit to validate hidden tests.");
        recordDsaPublicCleared.mutate(problemId, {
          onError: () => {},
        });
      }
      return;
    }

    if (result.legacyFallback && problemData?.expectedOutput?.[selectedLanguage] != null && problemId) {
      setOutput(result);
      if (!result.success && result.error) {
        toast.error(result.error);
        return;
      }
      if (result.success) {
        const expectedOutput = problemData.expectedOutput[selectedLanguage];
        if (dsaOutputsMatch(result.output, expectedOutput)) {
          fireConfetti();
          toast.success("Public examples match (legacy check). Submit to validate hidden tests.");
          recordDsaPublicCleared.mutate(problemId, { onError: () => {} });
        } else {
          toast.error("Output does not match public examples.");
        }
      }
      return;
    }

    setOutput(result);
    if (!result.success && result.error) {
      toast.error(result.error);
    }
  }, [
    currentTrack,
    problemId,
    code,
    selectedLanguage,
    problemData,
    createMlSubmission,
    recordDsaPublicCleared,
    fireConfetti,
  ]);

  const handleDsaSubmit = useCallback(async () => {
    if (currentTrack !== "dsa" || !problemId) return;
    try {
      const res = await createDsaSubmission.mutateAsync({
        problemId,
        language: selectedLanguage,
        code,
      });
      const sub = res?.submission;
      if (sub) {
        setOutput({
          success: sub.status === "passed",
          pending: false,
          summary: sub.summary,
          runtimeMs: sub.runtimeMs,
          testResults: sub.testResults || [],
          error: sub.error || "",
        });
        if (sub.status === "passed") {
          fireConfetti();
          toast.success("All tests passed (including hidden).");
          queryClient.invalidateQueries({ queryKey: progressQueryKey });
        } else {
          toast.error("Some tests failed. See details below.");
        }
      }
    } catch {
      /* useCreateDsaSubmission shows toast */
    }
  }, [currentTrack, problemId, selectedLanguage, code, createDsaSubmission, queryClient, fireConfetti]);

  const isPrimaryExecuting =
    currentTrack === "ml"
      ? createMlSubmission.isPending ||
        activeSubmission?.status === "queued" ||
        activeSubmission?.status === "running"
      : isRunning;

  return {
    selectedLanguage,
    code,
    setCode,
    output,
    setOutput,
    handleLanguageChange,
    handleRunCode,
    handleDsaSubmit,
    isPrimaryExecuting,
    isDsaSubmitting: createDsaSubmission.isPending,
    primaryActionLabel: currentTrack === "ml" ? "Submit" : "Run Code",
    primaryRunningLabel: currentTrack === "ml" ? "Submitting..." : "Running...",
    showDsaSubmit: currentTrack === "dsa",
  };
}
