import { CheckCircle2Icon, TrophyIcon, UsersIcon } from "lucide-react";

const CARDS = [
  {
    key: "active",
    icon: UsersIcon,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20 hover:border-primary/40",
    badge: { label: "Live", cls: "badge-primary" },
    label: "Active Sessions",
  },
  {
    key: "total",
    icon: TrophyIcon,
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20 hover:border-secondary/40",
    badge: null,
    label: "Your Sessions (all time)",
  },
  {
    key: "solved",
    icon: CheckCircle2Icon,
    color: "text-success",
    bg: "bg-success/10",
    border: "border-success/20 hover:border-success/40",
    badge: null,
    label: "Problems Solved",
  },
];

function StatsCards({ activeSessionsCount, totalSessionsCount, problemsSolvedCount, dsaPublicClearedCount }) {
  const values = {
    active: activeSessionsCount,
    total: totalSessionsCount,
    solved: problemsSolvedCount,
  };

  return (
    <div className="lg:col-span-1 grid grid-cols-1 gap-4">
      {CARDS.map((card, i) => (
        <div
          key={card.key}
          className={`card bg-base-100 border-2 ${card.border} transition-all duration-200 animate-fade-up`}
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="card-body py-5 px-5">
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2.5 ${card.bg} rounded-xl`}>
                <card.icon className={`size-6 ${card.color}`} />
              </div>
              {card.badge && (
                <div className={`badge ${card.badge.cls} gap-1`}>
                  <span className="size-1.5 rounded-full bg-current pulse-dot" />
                  {card.badge.label}
                </div>
              )}
            </div>
            <div className="text-4xl font-black tabular-nums">{values[card.key]}</div>
            <div className="text-sm text-base-content/55 mt-0.5">{card.label}</div>
            {card.key === "solved" && typeof dsaPublicClearedCount === "number" && dsaPublicClearedCount > 0 && (
              <p className="text-xs text-base-content/45 mt-1">
                +{dsaPublicClearedCount} DSA with public tests only
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default StatsCards;
