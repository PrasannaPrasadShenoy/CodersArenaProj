# Code execution: sandbox roadmap

User submissions for DSA run on the host via `runUserProgram` in [`backend/src/lib/codeRunner.js`](../backend/src/lib/codeRunner.js) (Node, Python, `javac`/`java`). This is convenient for development but **not** a strong security boundary.

## Near term (same API)

- Tighten `EXECUTE_TIMEOUT_MS` and `MAX_OUTPUT_BYTES` in `codeRunner.js` if workloads grow.
- Keep `EXECUTE_RATE_LIMIT_*` env vars tuned per deployment ([`backend/src/lib/env.js`](../backend/src/lib/env.js)).
- Monitor CPU and temp disk usage under load.

## Medium term (recommended for production)

- Run untrusted code in **isolated workers**: Docker containers with no network (or allowlisted egress), cgroup limits, and per-run filesystem wipe.
- Alternatively, delegate to a **managed judge API** and keep NeuroHire as orchestration only.

## Contract to preserve

- `POST /api/execute` body: `{ language, code }` for raw runs; `{ language, code, problemId, mode: "dsa_public" }` for public DSA tests.
- `POST /api/submissions/dsa` continues to use `runDsaJudge` with public + hidden tests.

Swapping the implementation behind `runUserProgram` (and the judge’s call path) should not require frontend changes if request/response shapes stay stable.
