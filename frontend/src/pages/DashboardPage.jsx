import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { usePageTitle } from "../hooks/usePageTitle";
import { useActiveSessions, useCreateSession, useMyRecentSessions } from "../hooks/useSessions";
import { useProblemsList } from "../hooks/useProblems";
import { useUserProgress } from "../hooks/useUserProgress";

import Navbar from "../components/Navbar";
import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards";
import ActiveSessions from "../components/ActiveSessions";
import RecentSessions from "../components/RecentSessions";
import CreateSessionModal from "../components/CreateSessionModal";
import OnboardingBanner from "../components/OnboardingBanner";

function DashboardPage() {
  usePageTitle("Dashboard");
  const navigate = useNavigate();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomConfig, setRoomConfig] = useState({
    sessionKind: "coding",
    discussionTopic: "",
    problem: "",
    problemId: "",
    problemTrack: "dsa",
    difficulty: "",
  });

  const createSessionMutation = useCreateSession();
  const { problemsArray } = useProblemsList();

  const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecentSessions } = useMyRecentSessions();
  const { data: userProgress } = useUserProgress();

  const handleCreateRoom = () => {
    if (roomConfig.sessionKind === "discussion") {
      const topic = (roomConfig.discussionTopic || "").trim();
      if (topic.length < 3) return;
      createSessionMutation.mutate(
        { sessionType: "discussion", topic },
        {
          onSuccess: (data) => {
            setShowCreateModal(false);
            setRoomConfig({
              sessionKind: "coding",
              discussionTopic: "",
              problem: "",
              problemId: "",
              problemTrack: "dsa",
              difficulty: "",
            });
            navigate(`/session/${data.session._id}`);
          },
        }
      );
      return;
    }

    if (!roomConfig.problem || !roomConfig.problemId || !roomConfig.problemTrack || !roomConfig.difficulty)
      return;

    createSessionMutation.mutate(
      {
        problem: roomConfig.problem,
        problemId: roomConfig.problemId,
        problemTrack: roomConfig.problemTrack,
        difficulty: roomConfig.difficulty.toLowerCase(),
      },
      {
        onSuccess: (data) => {
          setShowCreateModal(false);
          setRoomConfig({
            sessionKind: "coding",
            discussionTopic: "",
            problem: "",
            problemId: "",
            problemTrack: "dsa",
            difficulty: "",
          });
          navigate(`/session/${data.session._id}`);
        },
      }
    );
  };

  const activeSessions = activeSessionsData?.sessions || [];
  const recentSessions = recentSessionsData?.sessions || [];

  const isUserInSession = (session) => {
    if (!user.id) return false;

    return (
      session.host?.clerkId === user.id ||
      session.participant?.clerkId === user.id ||
      session.participant2?.clerkId === user.id
    );
  };

  return (
    <>
      <div className="min-h-screen bg-base-300">
        <Navbar />
        <WelcomeSection onCreateSession={() => setShowCreateModal(true)} />

        {/* Grid layout */}
        <div className="container mx-auto px-6 pb-16">
          <OnboardingBanner />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatsCards
              activeSessionsCount={activeSessions.length}
              totalSessionsCount={userProgress?.totalSessions ?? 0}
              problemsSolvedCount={userProgress?.problemsSolvedTotal ?? 0}
              dsaPublicClearedCount={userProgress?.dsa?.publicClearedCount}
            />
            <ActiveSessions
              sessions={activeSessions}
              isLoading={loadingActiveSessions}
              isUserInSession={isUserInSession}
            />
          </div>

          <RecentSessions sessions={recentSessions} isLoading={loadingRecentSessions} />
        </div>
      </div>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomConfig={roomConfig}
        setRoomConfig={setRoomConfig}
        onCreateRoom={handleCreateRoom}
        isCreating={createSessionMutation.isPending}
        problems={problemsArray}
      />
    </>
  );
}

export default DashboardPage;
