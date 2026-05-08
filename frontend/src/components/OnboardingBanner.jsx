import { useState } from "react";
import { ArrowRightIcon, BookOpenIcon, Code2Icon, UsersIcon, XIcon, ZapIcon } from "lucide-react";
import { Link } from "react-router";

const STORAGE_KEY = "neurohire-onboarded";

const STEPS = [
  {
    icon: BookOpenIcon,
    color: "text-primary",
    bg: "bg-primary/10",
    title: "Browse Problems",
    desc: "Pick a DSA or ML problem to solve.",
    to: "/problems",
  },
  {
    icon: ZapIcon,
    color: "text-secondary",
    bg: "bg-secondary/10",
    title: "Create a Session",
    desc: "Start a live coding or discussion room.",
    to: null,
  },
  {
    icon: UsersIcon,
    color: "text-accent",
    bg: "bg-accent/10",
    title: "Invite Someone",
    desc: "Share the invite code with a friend or interviewer.",
    to: null,
  },
  {
    icon: Code2Icon,
    color: "text-success",
    bg: "bg-success/10",
    title: "Code Together",
    desc: "Write, run, and submit code in real-time.",
    to: null,
  },
];

export default function OnboardingBanner() {
  const [dismissed, setDismissed] = useState(
    () => !!localStorage.getItem(STORAGE_KEY)
  );

  if (dismissed) return null;

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setDismissed(true);
  };

  return (
    <div className="card bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10 border-2 border-primary/20 mb-6 animate-fade-up relative overflow-hidden">
      {/* dismiss */}
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-base-200 text-base-content/40 hover:text-base-content transition-colors"
        aria-label="Dismiss"
      >
        <XIcon className="size-4" />
      </button>

      <div className="card-body pb-5">
        <div className="mb-4">
          <h2 className="text-lg font-black">Welcome to NeuroHire!</h2>
          <p className="text-sm text-base-content/60 mt-0.5">
            Here's how to get started in 4 steps:
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STEPS.map((step, i) => {
            const content = (
              <div className={`flex flex-col gap-2 p-3 rounded-xl bg-base-100 border border-base-200 h-full ${step.to ? "hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer" : ""}`}>
                <div className="flex items-center gap-2">
                  <div className={`size-7 rounded-lg ${step.bg} flex items-center justify-center shrink-0`}>
                    <step.icon className={`size-4 ${step.color}`} />
                  </div>
                  <span className="text-xs font-bold text-base-content/40">Step {i + 1}</span>
                </div>
                <p className="font-semibold text-sm leading-tight">{step.title}</p>
                <p className="text-xs text-base-content/55 leading-snug">{step.desc}</p>
                {step.to && (
                  <div className={`mt-auto flex items-center gap-1 text-xs font-medium ${step.color}`}>
                    Go <ArrowRightIcon className="size-3" />
                  </div>
                )}
              </div>
            );

            return step.to ? (
              <Link key={step.title} to={step.to}>
                {content}
              </Link>
            ) : (
              <div key={step.title}>{content}</div>
            );
          })}
        </div>

        <button
          onClick={handleDismiss}
          className="btn btn-sm btn-ghost mt-3 self-end text-base-content/50"
        >
          Got it, dismiss
        </button>
      </div>
    </div>
  );
}
