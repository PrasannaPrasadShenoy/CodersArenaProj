<h1 align="center">✨ NeuroHire ✨</h1>

<p align="center"><strong>Full-Stack Interview & Collaborative Coding Platform</strong></p>

![Demo App](/frontend/public/screenshot-for-readme.png)

## Product vision

NeuroHire is a **live interview and practice surface** that combines a VS Code–style editor, video, chat, and shared whiteboards. It supports **two practice tracks**: classic **DSA** (multi-language, file-based problem packs on the server) and **ML systems** (PyTorch-backed kernels judged asynchronously via Inngest).

**Who it’s for:** hiring teams running structured loops, candidates practicing solo or in pairs, and small groups using discussion sessions plus collaborative drawing (tldraw).

**Architecture (problems):** Problem definitions live under [`backend/src/problems/`](backend/src/problems/) (DSA) and [`backend/src/ml-problems/`](backend/src/ml-problems/) (ML). The frontend loads DSA problems from the API and may merge with a static fallback in [`frontend/src/data/problems.js`](frontend/src/data/problems.js). See [docs/PROBLEM_SYSTEM_MIGRATION.md](docs/PROBLEM_SYSTEM_MIGRATION.md) for the folder layout and migration steps.

**Feedback models:**

- **DSA — Run code:** Fast iteration runs your code on the server (`POST /api/execute`) and the UI compares output to **public** examples (same normalization as local checks).
- **DSA — Submit:** Optional full grading runs **public + hidden** tests on the server (`POST /api/submissions/dsa`) so scores are not client-only.
- **ML:** Submissions are queued, judged with Python/PyTorch on the server, and the UI polls status (see `ml/submission.created` / Inngest).

**Code execution — trust & safety:** Running user code is sensitive. `POST /api/execute` requires a signed-in user, per-user rate limits, and a bounded JSON body size. Runs still use the host interpreter (Node / Python / `javac`+`java`), not a hard VM sandbox—treat deployments accordingly and prefer isolated runners for production hardening.

**Roadmap themes:** stronger execution isolation, richer session UX (polling/optimistic updates), accessibility and loading states, and consolidating shared “run vs submit” logic on the client.

✨ Highlights:

- 🧑‍💻 VSCode-Powered Code Editor
- 🔐 Authentication via Clerk
- 🎥 1-on-1 Video Interview Rooms
- 🧭 Dashboard with Live Stats
- 🔊 Mic & Camera Toggle, Screen Sharing & Recording
- 💬 Real-time Chat Messaging
- ⚙️ Server-side code execution (authenticated, rate-limited) for DSA runs; ML judging via Python/PyTorch
- 🎯 Auto feedback — DSA run vs public output; full DSA submit vs hidden tests; ML via async judge
- 🎉 Confetti on Success + Notifications on Fail
- 🧩 Practice Problems Page (solo coding mode)
- 🔒 Room Locking — allows only 2 participants
- 🧠 Background Jobs with Inngest (async tasks)
- 🧰 REST API with Node.js & Express
- ⚡ Data Fetching & Caching via TanStack Query
- 🤖 CodeRabbit for PR Analysis & Code Optimization
- 🧑‍💻 Git & GitHub Workflow (branches, PRs, merges)
- 🚀 Deployment on Sevalla (free-tier friendly)

---

## 🧪 .env Setup

### Backend (`/backend`)

```bash
PORT=3000
NODE_ENV=development

DB_URL=your_mongodb_connection_url

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

STREAM_API_KEY=your_stream_api_key
STREAM_API_SECRET=your_stream_api_secret

CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

CLIENT_URL=http://localhost:5173

# ML track flags
ENABLE_ML_TRACK=1
ML_JUDGE_TIMEOUT_MS=25000

# DSA code execution (optional overrides)
EXECUTE_MAX_BODY_BYTES=262144
EXECUTE_MAX_CODE_CHARS=100000
EXECUTE_RATE_LIMIT_WINDOW_MS=60000
EXECUTE_RATE_LIMIT_MAX=40
```

#### Inngest keys (when to use them)

| Variable | Required? | Purpose |
|----------|-----------|--------|
| `INNGEST_EVENT_KEY` | Only if your app **sends** events to Inngest | Lets your backend publish events to Inngest (e.g. from your own code). |
| `INNGEST_SIGNING_KEY` | **Yes** when using Inngest Cloud (production) | Verifies that requests to `POST /api/inngest` come from Inngest (Clerk webhooks → Inngest → your app). |

**How to get the keys**

1. Go to [Inngest Dashboard](https://app.inngest.com).
2. Create or select an app, then open **Manage** → **Keys** (or **Event Keys** / **Signing Key**).
3. **Event Key** → create/copy and set as `INNGEST_EVENT_KEY` (only if you publish events from your code).
4. **Signing Key** → copy and set as `INNGEST_SIGNING_KEY` (needed so Inngest can call your app securely).

**Local development**

- With the [Inngest Dev Server](https://www.inngest.com/docs/dev-server): you can skip signing verification by setting `INNGEST_DEV=1` in `.env` (no `INNGEST_SIGNING_KEY` needed for local).
- Without Inngest at all: leave both keys unset. User sync (Clerk → MongoDB/Stream) won’t run via webhooks; use the app’s **lazy user sync** (first API request creates the user in DB) if you added it, or create users manually.

**Clerk → Inngest → your app**

For automatic user sync on sign-up:

1. In [Clerk Dashboard](https://dashboard.clerk.com) → your app → **Webhooks**, add an endpoint.
2. Endpoint URL: `https://api.inngest.com/v1/sources/clerk` (or the URL Inngest gives you for the Clerk integration).
3. In Inngest, enable the Clerk source and point it to your app’s **Inngest URL**: `https://your-backend.com/api/inngest` (or `http://localhost:3000/api/inngest` for dev with a tunnel like ngrok).
4. Then Inngest will receive `clerk/user.created` and `clerk/user.deleted` and invoke your functions; your app must have `INNGEST_SIGNING_KEY` set so those requests are accepted.

### Frontend (`/frontend`)

```bash
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

VITE_API_URL=http://localhost:3000/api

VITE_STREAM_API_KEY=your_stream_api_key
```

### ML runtime prerequisites

- Backend host must have `python` (or `python3`) available in PATH.
- Install `torch` in the same Python runtime used by the backend judge process.
- ML judging is async via Inngest events (`ml/submission.created`) and polls from the frontend.

---

## 🔧 Run the Backend

```bash
cd backend
npm install
npm run dev
```

---

## 🔧 Run the Frontend

```bash
cd frontend
npm install
npm run dev
```
