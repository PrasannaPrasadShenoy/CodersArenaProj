<h1 align="center">✨ CodersArena ✨</h1>

<p align="center"><strong>Full-Stack Interview & Collaborative Coding Platform</strong></p>

![Demo App](/frontend/public/screenshot-for-readme.png)

✨ Highlights:

- 🧑‍💻 VSCode-Powered Code Editor
- 🔐 Authentication via Clerk
- 🎥 1-on-1 Video Interview Rooms
- 🧭 Dashboard with Live Stats
- 🔊 Mic & Camera Toggle, Screen Sharing & Recording
- 💬 Real-time Chat Messaging
- ⚙️ Secure Code Execution in Isolated Environment
- 🎯 Auto Feedback — Success / Fail based on test cases
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

---

## 🔧 Run the Backend

```bash

cd backend
npm install
npm run dev
```

---

## 🔧 Run the Frontend

```
bash
cd frontend
npm install
npm run dev
```
