import ExecutionProgress from "./ExecutionProgress";

function OutputPanel({
  output,
  emptyStateText = 'Click "Run Code" to see the output here...',
  isExecuting = false,
  isSubmitting = false,
  executionStartTime = null,
  language = "javascript",
}) {
  const hasJudgeResults = Array.isArray(output?.testResults);
  const showProgress = (isExecuting || isSubmitting) && executionStartTime;

  return (
    <div className="h-full bg-base-100 flex flex-col">
      <div className="px-4 py-2 bg-base-200 border-b border-base-300 font-semibold text-sm">
        Output
      </div>
      <div className="flex-1 overflow-auto p-4">
        {showProgress ? (
          <ExecutionProgress
            language={language}
            isSubmit={isSubmitting}
            startTime={executionStartTime}
          />
        ) : output === null ? (
          <p className="text-base-content/50 text-sm">{emptyStateText}</p>
        ) : hasJudgeResults ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className={`font-medium ${output.success ? "text-success" : "text-warning"}`}>
                {output.summary || (output.success ? "All tests passed" : "Tests failed")}
              </p>
              {output.runtimeMs ? (
                <span className="text-xs text-base-content/60">{output.runtimeMs} ms</span>
              ) : null}
            </div>

            <div className="space-y-2">
              {output.testResults.map((test, idx) => (
                <div
                  key={`${test.name || "test"}-${idx}`}
                  className="border border-base-300 rounded-lg p-3 bg-base-200/50"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {test.name || `Test ${idx + 1}`} ({test.visibility})
                    </p>
                    <span className={`badge badge-sm ${test.passed ? "badge-success" : "badge-error"}`}>
                      {test.passed ? "Pass" : "Fail"}
                    </span>
                  </div>
                  {!test.passed && (
                    <div className="mt-2 text-xs space-y-1">
                      {test.message ? <p className="text-error">{test.message}</p> : null}
                      {test.expected ? <p>Expected: {test.expected}</p> : null}
                      {test.actual ? <p>Actual: {test.actual}</p> : null}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {output.hint && !output.success ? (
              <div className="alert alert-info py-2">
                <span className="text-sm">Hint: {output.hint}</span>
              </div>
            ) : null}
          </div>
        ) : output.success ? (
          <pre className="text-sm font-mono text-success whitespace-pre-wrap">{output.output}</pre>
        ) : (
          <div>
            {output.output && (
              <pre className="text-sm font-mono text-base-content whitespace-pre-wrap mb-2">
                {output.output}
              </pre>
            )}
            <pre className="text-sm font-mono text-error whitespace-pre-wrap">{output.error}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
export default OutputPanel;
