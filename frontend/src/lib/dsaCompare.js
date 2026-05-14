export function normalizeDsaOutput(output) {
  if (output == null || output === undefined) return "";
  let s = String(output).replace(/\r\n/g, "\n").trim();
  if (s.startsWith("[") && s.endsWith("]") && s.includes("\n")) {
    s = s.replace(/\n/g, " ");
  }
  return s
    .split("\n")
    .map((line) =>
      line
        .trim()
        .replace(/\[\s+/g, "[")
        .replace(/\s+\]/g, "]")
        .replace(/\s*,\s*/g, ",")
    )
    .filter((line) => line.length > 0)
    .join("\n");
}

export function dsaOutputsMatch(actualOutput, expectedOutput) {
  return normalizeDsaOutput(actualOutput) === normalizeDsaOutput(expectedOutput);
}
