# Problem system migration guide

## Target architecture (current)

```
backend/src/
├── problems/                    # One folder per problem
│   ├── two-sum/
│   │   ├── problem.json
│   │   ├── starter.js | starter.py | starter.java
│   │   ├── public_tests.json
│   │   └── hidden_tests.json
│   └── maximum-subarray/
│       └── ...
├── services/
│   └── problemLoader.js         # loadProblem(id), getAllProblems()
├── api/
│   └── problems.js             # GET /api/problems, GET /api/problems/:id
└── controllers/
    └── problemController.js
```

Frontend uses the same data shape as before (legacy): problems are loaded via `GET /api/problems?legacy=1` (list) and `GET /api/problems/:id` (full problem). Unmigrated problems still come from `frontend/src/data/problems.js` as fallback.

---

## Migration steps (old → new)

### 1. Create the problem folder

Under `backend/src/problems/`, create a folder named after the problem slug (e.g. `reverse-string`).

### 2. Add required files

- **problem.json**  
  Copy from the existing entry in `frontend/src/data/problems.js`: `id`, `title`, `difficulty`, `category`, `description`, `examples`, `constraints`. Omit `starterCode` and `expectedOutput`.

- **starter.js, starter.py, starter.java**  
  Copy from `frontend/src/data/problems.js` → `starterCode.javascript`, `starterCode.python`, `starterCode.java`. Paste into the corresponding `starter.*` files.

- **public_tests.json**  
  - `tests`: one object per example, with `input` (e.g. from `examples[].input`) and `expectedOutput`: `{ "javascript": "...", "python": "...", "java": "..." }` (from the expected output for that case).
  - `combinedExpectedOutput`: from the existing `expectedOutput` in problems.js:  
    `{ "javascript": "line1\nline2\n...", "python": "...", "java": "..." }`.

- **hidden_tests.json**  
  Same structure as `public_tests.json` but only the `tests` array (optional extra cases for the judge). No `combinedExpectedOutput` needed.

### 3. Validate

Restart the backend. The new problem is picked up automatically. Check:

- `GET /api/problems` (or `?legacy=1`) includes the new problem.
- `GET /api/problems/<slug>` returns the full legacy-shaped problem with correct `starterCode` and `expectedOutput`.

### 4. Optional: remove from static list

Once a problem is in the new system and the API returns it correctly, you can remove it from `frontend/src/data/problems.js` to avoid duplication. The frontend merges API and static data, so removing it from the static file just means it is only served from the new system.

---

## Adding a brand-new problem (no migration)

1. Create `backend/src/problems/<slug>/`.
2. Add all six files (see `backend/src/problems/README.md`).
3. Restart backend (or rely on cache TTL in production).
4. No frontend code changes required.

---

## Backend judge / hidden tests

- **loadProblem(problemId)** returns `{ metadata, starterCode, publicTests, hiddenTests }`.
- Use `publicTests` for “Run code” in the UI (and for `combinedExpectedOutput` in the legacy response).
- Use `hiddenTests` in your judge to run additional cases after the user submits.

---

## Scalability summary

| Before | After |
|--------|--------|
| Single large `problems.js` | One folder per problem |
| Edit one file to add a problem | Add a folder with 6 files |
| No separation of metadata vs code vs tests | problem.json, starter.*, *_tests.json |
| No hidden tests | public_tests.json + hidden_tests.json |
| Frontend-only data | Backend owns problems; frontend fetches via API |
| No caching | Optional in-memory cache (production) |

The frontend keeps the same “API”: same payload shape and usage. Only the source of data (API + static fallback) changed.
