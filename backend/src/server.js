import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { clerkMiddleware } from "@clerk/express";

import { ENV } from "./lib/env.js";
import { connectDB } from "./lib/db.js";
import { initWhiteboardSocket } from "./lib/whiteboardSocket.js";

import inngestRouter from "./routes/inngest.js";
import chatRoutes from "./routes/chatRoutes.js";
import sessionRoutes from "./routes/sessionRoute.js";
import executeRoutes from "./routes/executeRoute.js";
import problemRoutes from "./api/problems.js";
import whiteboardRoutes from "./routes/whiteboardRoutes.js";
import submissionRoutes from "./routes/submissionRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: ENV.CLIENT_URL,
    credentials: true,
  },
});
initWhiteboardSocket(io);

const __dirname = path.resolve();

// middleware
app.use(helmet());
app.use(express.json({ limit: ENV.EXECUTE_MAX_BODY_BYTES }));
app.use(cors({ origin: ENV.CLIENT_URL, credentials: true }));
app.use(clerkMiddleware());

app.use("/api/chat", chatRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/execute", executeRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/whiteboards", whiteboardRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/inngest", inngestRouter);

app.get("/health", (req, res) => {
  res.status(200).json({ msg: "api is up and running" });
});

// make our app ready for deployment
if (ENV.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("/{*any}", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

const startServer = async () => {
  try {
    try {
      await connectDB();
    } catch (dbError) {
      if (ENV.NODE_ENV === "development") {
        console.warn(
          "⚠️ MongoDB unavailable in development. Starting API without DB-dependent features."
        );
        console.warn(dbError?.message || dbError);
      } else {
        throw dbError;
      }
    }

    server.listen(ENV.PORT, () => console.log("Server is running on port:", ENV.PORT));
  } catch (error) {
    console.error("💥 Error starting the server", error);
  }
};

startServer();
