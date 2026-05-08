import Editor from "@monaco-editor/react";
import { Loader2Icon, PlayIcon, SendIcon } from "lucide-react";
import { LANGUAGE_CONFIG } from "../data/problems";
import { useTheme } from "../context/ThemeContext";

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
}) {
  const { isDark } = useTheme();
  const options = languageOptions || Object.keys(LANGUAGE_CONFIG);

  return (
    <div className="h-full bg-base-300 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2.5 bg-base-100 border-b border-base-300">
        <div className="flex items-center gap-3">
          <img
            src={LANGUAGE_CONFIG[selectedLanguage].icon}
            alt={LANGUAGE_CONFIG[selectedLanguage].name}
            className="size-5"
          />
          <select
            className="select select-sm select-ghost text-sm"
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
              className="btn btn-outline btn-sm gap-1.5"
              disabled={isRunning || isSecondaryRunning}
              onClick={onSecondaryAction}
            >
              {isSecondaryRunning ? (
                <>
                  <Loader2Icon className="size-3.5 animate-spin" />
                  {secondaryRunningLabel}
                </>
              ) : (
                <>
                  <SendIcon className="size-3.5" />
                  {secondaryActionLabel}
                </>
              )}
            </button>
          ) : null}
          <button
            className="btn btn-primary btn-sm gap-1.5"
            disabled={isRunning || isSecondaryRunning}
            onClick={onRunCode}
          >
            {isRunning ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" />
                {runningLabel}
              </>
            ) : (
              <>
                <PlayIcon className="size-3.5" />
                {actionLabel}
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          language={LANGUAGE_CONFIG[selectedLanguage].monacoLang}
          value={code}
          onChange={onCodeChange}
          theme={isDark ? "vs-dark" : "vs"}
          options={{
            fontSize: 15,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            minimap: { enabled: false },
            padding: { top: 12 },
            fontFamily: "'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
          }}
        />
      </div>
    </div>
  );
}
export default CodeEditorPanel;
