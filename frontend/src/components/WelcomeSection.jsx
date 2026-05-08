import { useUser } from "@clerk/clerk-react";
import { ArrowRightIcon, PlusIcon, SparklesIcon } from "lucide-react";

function WelcomeSection({ onCreateSession }) {
  const { user } = useUser();

  return (
    <div className="relative overflow-hidden bg-mesh border-b border-base-content/8">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          {/* LEFT */}
          <div className="flex items-center gap-4 animate-fade-up">
            <div className="size-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shrink-0">
              <SparklesIcon className="size-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent leading-tight">
                Welcome back, {user?.firstName || "there"}!
              </h1>
              <p className="text-base-content/55 mt-0.5">Ready to level up your coding skills today?</p>
            </div>
          </div>

          {/* CREATE SESSION BUTTON */}
          <button
            onClick={onCreateSession}
            className="group btn btn-primary btn-lg gap-2 rounded-2xl shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200 shrink-0 animate-fade-up delay-100"
          >
            <PlusIcon className="size-5" />
            <span>New Session</span>
            <ArrowRightIcon className="size-4 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default WelcomeSection;
