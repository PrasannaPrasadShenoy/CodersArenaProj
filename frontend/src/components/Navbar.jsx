import { Link, useLocation } from "react-router";
import { BookOpenIcon, LayoutDashboardIcon, MoonIcon, SparklesIcon, SunIcon } from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import { useTheme } from "../context/ThemeContext";

function Navbar() {
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  const isActive = (path) => location.pathname === path;
  const isExcalidrawSection =
    location.pathname === "/excalidraw" || location.pathname.startsWith("/excalidraw/");

  return (
    <nav className="bg-base-100/80 backdrop-blur-md border-b border-base-content/10 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* LOGO */}
        <Link
          to="/"
          className="group flex items-center gap-3 hover:scale-105 transition-transform duration-200 shrink-0"
        >
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

        {/* NAV LINKS */}
        <div className="flex items-center gap-1">
          <Link
            to="/problems"
            className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2
              ${isActive("/problems")
                ? "bg-primary text-primary-content font-semibold"
                : "hover:bg-base-200 text-base-content/70 hover:text-base-content font-medium"
              }`}
          >
            <BookOpenIcon className="size-4 shrink-0" />
            <span className="hidden sm:inline">Problems</span>
          </Link>

          <Link
            to="/excalidraw"
            className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2
              ${isExcalidrawSection
                ? "bg-primary text-primary-content font-semibold"
                : "hover:bg-base-200 text-base-content/70 hover:text-base-content font-medium"
              }`}
          >
            <SparklesIcon className="size-4 shrink-0" />
            <span className="hidden sm:inline">Whiteboard</span>
          </Link>

          <Link
            to="/dashboard"
            className={`px-3 py-2 rounded-lg text-sm transition-all duration-200 flex items-center gap-2
              ${isActive("/dashboard")
                ? "bg-primary text-primary-content font-semibold"
                : "hover:bg-base-200 text-base-content/70 hover:text-base-content font-medium"
              }`}
          >
            <LayoutDashboardIcon className="size-4 shrink-0" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          {/* THEME TOGGLE */}
          <button
            onClick={toggleTheme}
            className="ml-1 p-2 rounded-lg hover:bg-base-200 text-base-content/60 hover:text-base-content transition-all duration-200"
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            title={isDark ? "Light mode" : "Dark mode"}
          >
            {isDark ? (
              <SunIcon className="size-4" />
            ) : (
              <MoonIcon className="size-4" />
            )}
          </button>

          <div className="ml-2">
            <UserButton />
          </div>
        </div>
      </div>
    </nav>
  );
}
export default Navbar;
