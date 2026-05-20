import Editor from "@monaco-editor/react";
import { Loader2Icon, PlayIcon, SendIcon } from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";

function CodeEditorPanel({
  selectedLanguage,
  code,
  isRunning,
  onLanguageChange,
  onCodeChange,
  onRunCode,
  languageOptions,
  disableLanguageSelect = false,
  actionLabel = "Run Code",
  runningLabel = "Running...",
  secondaryActionLabel,
  secondaryRunningLabel = "Submitting...",
  onSecondaryAction,
  isSecondaryRunning = false,
  /** Yjs collaborative buffer; Monaco is driven by MonacoBinding — not React `value`. */
  collaborative = false,
  onCollaborativeMount,
  editorPath = "default",
}) {
  const options = languageOptions || Object.keys(LANGUAGE_CONFIG);

  const editorOptions = {
    fontSize: 16,
    lineNumbers: "on",
    scrollBeyondLastLine: false,
    automaticLayout: true,
    minimap: { enabled: false },
  };

  return (
    <div className="h-full bg-base-300 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-base-100 border-t border-base-300">
        <div className="flex items-center gap-3">
          <img
            src={LANGUAGE_CONFIG[selectedLanguage].icon}
            alt={LANGUAGE_CONFIG[selectedLanguage].name}
            className="size-6"
          />
          <select
            className="select select-sm"
            value={selectedLanguage}
            onChange={onLanguageChange}
            disabled={disableLanguageSelect}
          >
            {options
              .filter((key) => !!LANGUAGE_CONFIG[key])
              .map((key) => (
                <option key={key} value={key}>
                  {LANGUAGE_CONFIG[key].name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {secondaryActionLabel && onSecondaryAction ? (
            <button
              type="button"
              className="btn btn-outline btn-sm gap-2"
              disabled={isRunning || isSecondaryRunning}
              onClick={onSecondaryAction}
            >
              {isSecondaryRunning ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" />
                  {secondaryRunningLabel}
                </>
              ) : (
                <>
                  <SendIcon className="size-4" />
                  {secondaryActionLabel}
                </>
              )}
            </button>
          ) : null}
          <button className="btn btn-primary btn-sm gap-2" disabled={isRunning || isSecondaryRunning} onClick={onRunCode}>
            {isRunning ? (
              <>
                <Loader2Icon className="size-4 animate-spin" />
                {runningLabel}
              </>
            ) : (
              <>
                <PlayIcon className="size-4" />
                {actionLabel}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1">
        {collaborative ? (
          <Editor
            key={editorPath}
            height="100%"
            path={`collab://${editorPath}`}
            theme="vs-dark"
            language={LANGUAGE_CONFIG[selectedLanguage].monacoLang}
            defaultValue="\n"
            options={editorOptions}
            onMount={(editor) => onCollaborativeMount?.(editor)}
          />
        ) : (
          <Editor
            height={"100%"}
            language={LANGUAGE_CONFIG[selectedLanguage].monacoLang}
            value={code}
            onChange={onCodeChange}
            theme="vs-dark"
            options={editorOptions}
          />
        )}
      </div>
    </div>
  );
}
export default CodeEditorPanel;
