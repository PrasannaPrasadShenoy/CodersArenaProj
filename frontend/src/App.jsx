import { useAuth, useUser } from "@clerk/clerk-react";
import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router";
import HomePage from "./pages/HomePage";

import { Toaster } from "react-hot-toast";
import { setAuthTokenGetter } from "./lib/axios";
import DashboardPage from "./pages/DashboardPage";
import ProblemPage from "./pages/ProblemPage";
import ProblemsPage from "./pages/ProblemsPage";
import ExcalidrawPage from "./pages/ExcalidrawPage";
import ExcalidrawSessionsPage from "./pages/ExcalidrawSessionsPage";
import ExcalidrawSessionBoardPage from "./pages/ExcalidrawSessionBoardPage";
import SessionPage from "./pages/SessionPage";

function App() {
  const { isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(async () => {
      const token = await getToken();
      return token;
    });
  }, [getToken]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-base-200 flex flex-col items-center justify-center gap-4">
        <span className="loading loading-spinner loading-lg text-primary" aria-busy="true" aria-label="Loading" />
        <p className="text-base-content/70 text-sm">Signing you in…</p>
      </div>
    );
  }

  return (
    <>
      <Routes>
        <Route path="/" element={!isSignedIn ? <HomePage /> : <Navigate to={"/dashboard"} />} />
        <Route path="/dashboard" element={isSignedIn ? <DashboardPage /> : <Navigate to={"/"} />} />

        <Route path="/problems" element={isSignedIn ? <ProblemsPage /> : <Navigate to={"/"} />} />
        <Route path="/problem/:id" element={isSignedIn ? <ProblemPage /> : <Navigate to={"/"} />} />
        <Route path="/excalidraw" element={isSignedIn ? <ExcalidrawPage /> : <Navigate to={"/"} />} />
        <Route
          path="/excalidraw/sessions"
          element={isSignedIn ? <ExcalidrawSessionsPage /> : <Navigate to={"/"} />}
        />
        <Route
          path="/excalidraw/sessions/:id/board"
          element={isSignedIn ? <ExcalidrawSessionBoardPage /> : <Navigate to={"/"} />}
        />
        <Route path="/session/:id" element={isSignedIn ? <SessionPage /> : <Navigate to={"/"} />} />
      </Routes>

      <Toaster toastOptions={{ duration: 3000 }} />
    </>
  );
}

export default App;
