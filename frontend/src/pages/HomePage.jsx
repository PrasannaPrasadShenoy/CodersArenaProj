import { Link } from "react-router";
import {
  ArrowRightIcon,
  CheckIcon,
  Code2Icon,
  MoonIcon,
  SparklesIcon,
  SunIcon,
  UsersIcon,
  VideoIcon,
  ZapIcon,
} from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";
import { useTheme } from "../context/ThemeContext";

const FEATURES = [
  {
    icon: VideoIcon,
    title: "HD Video Call",
    desc: "Crystal-clear video and audio so nothing gets lost in translation during live interviews.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Code2Icon,
    title: "Live Code Editor",
    desc: "Collaborate in real-time with syntax highlighting and support for 10+ languages.",
    color: "text-secondary",
    bg: "bg-secondary/10",
  },
  {
    icon: UsersIcon,
    title: "Easy Collaboration",
    desc: "Share screens, discuss solutions, and learn from each other — all in one place.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

function HomePage() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-base-100 bg-mesh">
      {/* NAVBAR */}
      <nav className="bg-base-100/80 backdrop-blur-md border-b border-base-content/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:scale-105 transition-transform duration-200">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center shadow-md">
              <SparklesIcon className="size-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-lg bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent font-mono tracking-wider">
                NeuroHire
              </span>
              <span className="text-[10px] text-base-content/50 font-medium">Code Together</span>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-base-200 text-base-content/60 hover:text-base-content transition-all duration-200"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
            </button>

            <SignInButton mode="modal">
              <button className="btn btn-primary btn-sm gap-2 rounded-xl">
                Get Started
                <ArrowRightIcon className="size-3.5" />
              </button>
            </SignInButton>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-7xl mx-auto px-4 pt-20 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* LEFT */}
          <div className="space-y-7 animate-fade-up">
            <div className="badge badge-primary badge-lg gap-2 rounded-full px-4">
              <ZapIcon className="size-3.5" />
              Real-time Collaboration
            </div>

            <h1 className="text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Code Together,
              </span>
              <br />
              <span className="text-base-content">Learn Together</span>
            </h1>

            <p className="text-lg text-base-content/65 leading-relaxed max-w-lg">
              The ultimate platform for collaborative coding interviews and pair programming.
              Connect face-to-face, code in real-time, and ace your technical interviews.
            </p>

            {/* FEATURE PILLS */}
            <div className="flex flex-wrap gap-2.5">
              {["Live Video Chat", "Code Editor", "Multi-Language", "Whiteboard"].map((f) => (
                <div key={f} className="badge badge-outline gap-1.5 px-3 py-3">
                  <CheckIcon className="size-3.5 text-success" />
                  {f}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-wrap gap-3 pt-1">
              <SignInButton mode="modal">
                <button className="btn btn-primary btn-lg gap-2 rounded-xl shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200">
                  Start Coding Now
                  <ArrowRightIcon className="size-5" />
                </button>
              </SignInButton>

              <a href="#features" className="btn btn-outline btn-lg gap-2 rounded-xl">
                <VideoIcon className="size-5" />
                Explore Features
              </a>
            </div>

            {/* STATS */}
            <div className="stats bg-base-200/60 border border-base-content/10 rounded-2xl shadow-sm">
              <div className="stat py-4 px-6">
                <div className="stat-value text-2xl text-primary font-black">10K+</div>
                <div className="stat-title text-xs">Active Users</div>
              </div>
              <div className="stat py-4 px-6">
                <div className="stat-value text-2xl text-secondary font-black">50K+</div>
                <div className="stat-title text-xs">Sessions</div>
              </div>
              <div className="stat py-4 px-6">
                <div className="stat-value text-2xl text-accent font-black">99.9%</div>
                <div className="stat-title text-xs">Uptime</div>
              </div>
            </div>
          </div>

          {/* RIGHT IMAGE */}
          <div className="animate-fade-up delay-200 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/10 to-accent/20 rounded-3xl blur-3xl -z-10 scale-95" />
            <img
              src="/hero.png"
              alt="NeuroHire platform screenshot"
              className="w-full h-auto rounded-3xl shadow-2xl border border-base-content/10 hover:scale-[1.02] transition-transform duration-500"
            />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="bg-base-200/50 border-y border-base-content/8 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 py-20">
          <div className="text-center mb-14 animate-fade-up">
            <h2 className="text-3xl lg:text-4xl font-black mb-3">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent font-mono">
                Succeed
              </span>
            </h2>
            <p className="text-base-content/60 max-w-xl mx-auto">
              Powerful features designed to make coding interviews seamless and productive.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className={`card bg-base-100 border border-base-content/8 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 animate-fade-up delay-${(i + 1) * 100}`}
              >
                <div className="card-body items-center text-center gap-4">
                  <div className={`size-14 ${f.bg} rounded-2xl flex items-center justify-center`}>
                    <f.icon className={`size-7 ${f.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                    <p className="text-base-content/60 text-sm leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center animate-fade-up">
        <h2 className="text-3xl font-black mb-4">Ready to level up your interviews?</h2>
        <p className="text-base-content/60 mb-8 max-w-md mx-auto">
          Join thousands of developers who already use NeuroHire to practice and prepare.
        </p>
        <SignInButton mode="modal">
          <button className="btn btn-primary btn-lg gap-2 rounded-xl shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200">
            Get Started Free
            <ArrowRightIcon className="size-5" />
          </button>
        </SignInButton>
      </section>
    </div>
  );
}
export default HomePage;
