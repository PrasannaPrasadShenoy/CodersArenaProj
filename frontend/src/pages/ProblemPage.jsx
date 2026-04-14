import { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import Navbar from "../components/Navbar";

import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ProblemDescription from "../components/ProblemDescription";
import OutputPanel from "../components/OutputPanel";
import CodeEditorPanel from "../components/CodeEditorPanel";
import { useProblem, useProblemsList } from "../hooks/useProblems";
import { useCodingProblemActions } from "../hooks/useCodingProblemActions";

const DEFAULT_PROBLEM_ID = "two-sum";

function ProblemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const currentProblemId = (id && id.trim()) || DEFAULT_PROBLEM_ID;

  const { problem: currentProblem, isLoading: loadingProblem } = useProblem(currentProblemId);
  const currentTrack = currentProblem?.track || "dsa";
  const { problemsArray: allProblems } = useProblemsList(currentTrack);

  const {
    selectedLanguage,
    code,
    setCode,
    output,
    handleLanguageChange,
    handleRunCode,
    handleDsaSubmit,
    isPrimaryExecuting,
    isDsaSubmitting,
    primaryActionLabel,
    primaryRunningLabel,
    showDsaSubmit,
  } = useCodingProblemActions({
    problemId: currentProblemId,
    problemData: currentProblem,
    confettiStyle: "wide",
  });

  useEffect(() => {
    if (!loadingProblem && currentProblemId && !currentProblem) {
      navigate("/problems", { replace: true });
    }
  }, [loadingProblem, currentProblemId, currentProblem, navigate]);

  const handleProblemChange = (newProblemId) => {
    navigate(`/problem/${newProblemId}`);
  };

  if (loadingProblem || !currentProblem) {
    return (
      <div className="h-screen bg-base-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <span className="loading loading-spinner loading-lg text-primary" />
          <p className="text-base-content/60 mt-4">Loading problem...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-base-100 flex flex-col">
      <Navbar />

      <div className="flex-1">
        <PanelGroup direction="horizontal">
          <Panel defaultSize={40} minSize={30}>
            <ProblemDescription
              problem={currentProblem}
              currentProblemId={currentProblemId}
              onProblemChange={handleProblemChange}
              allProblems={allProblems || []}
            />
          </Panel>

          <PanelResizeHandle className="w-2 bg-base-300 hover:bg-primary transition-colors cursor-col-resize" />

          <Panel defaultSize={60} minSize={30}>
            <PanelGroup direction="vertical">
              <Panel defaultSize={70} minSize={30}>
                <CodeEditorPanel
                  selectedLanguage={selectedLanguage}
                  code={code}
                  isRunning={isPrimaryExecuting}
                  onLanguageChange={handleLanguageChange}
                  onCodeChange={setCode}
                  onRunCode={handleRunCode}
                  languageOptions={currentTrack === "ml" ? ["python"] : undefined}
                  disableLanguageSelect={currentTrack === "ml"}
                  actionLabel={primaryActionLabel}
                  runningLabel={primaryRunningLabel}
                  secondaryActionLabel={showDsaSubmit ? "Submit all tests" : undefined}
                  onSecondaryAction={showDsaSubmit ? handleDsaSubmit : undefined}
                  isSecondaryRunning={isDsaSubmitting}
                />
              </Panel>

              <PanelResizeHandle className="h-2 bg-base-300 hover:bg-primary transition-colors cursor-row-resize" />

              <Panel defaultSize={30} minSize={30}>
                <OutputPanel
                  output={output}
                  emptyStateText={
                    currentTrack === "ml"
                      ? 'Click "Submit" to run ML tests here...'
                      : 'Run Code runs public tests (same engine as submit); Submit includes hidden tests...'
                  }
                />
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}

export default ProblemPage;
