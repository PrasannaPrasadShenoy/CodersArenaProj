export function normalizeDsaOutput(output) {
  return output
    .trim()
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
