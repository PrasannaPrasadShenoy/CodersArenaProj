import { useState } from "react";
import { Navigate } from "react-router";
import Navbar from "../components/Navbar";
import {
  useIsAdmin,
  useAdminStats,
  useAdminUsers,
  useUpdateUserRole,
  useAdminSubmissions,
} from "../hooks/useAdmin";
import {
  UsersIcon,
  BarChart3Icon,
  FileTextIcon,
  ActivityIcon,
  TrophyIcon,
  ShieldIcon,
  SearchIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

function OverviewTab() {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!stats) return <p className="text-base-content/60">Failed to load stats.</p>;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, icon: UsersIcon, color: "text-primary" },
    { label: "Total Sessions", value: stats.totalSessions, icon: ActivityIcon, color: "text-secondary" },
    { label: "Active Sessions", value: stats.activeSessions, icon: ActivityIcon, color: "text-success" },
    { label: "Total Submissions", value: stats.totalSubmissions, icon: FileTextIcon, color: "text-info" },
    { label: "Submissions (24h)", value: stats.recentSubmissions24h, icon: BarChart3Icon, color: "text-warning" },
    { label: "Overall Pass Rate", value: `${stats.overallPassRate}%`, icon: TrophyIcon, color: "text-success" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="card bg-base-100 border border-base-300">
          <div className="card-body flex-row items-center gap-4">
            <div className={`p-3 rounded-xl bg-base-200 ${c.color}`}>
              <c.icon className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-sm text-base-content/60">{c.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAdminUsers({ page, limit: 20, search: search || undefined });
  const updateRole = useUpdateUserRole();

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-base-content/50" />
        <input
          type="search"
          placeholder="Search users..."
          className="input input-bordered input-sm w-full pl-9"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Problems Solved</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.users || []).map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {u.profileImage ? (
                          <img src={u.profileImage} alt="" className="size-8 rounded-full" />
                        ) : (
                          <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                            {(u.name || "?")[0]}
                          </div>
                        )}
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-sm text-base-content/70">{u.email}</td>
                    <td>
                      <span className={`badge badge-sm ${u.role === "admin" ? "badge-primary" : "badge-ghost"}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{u.solvedProblemKeys?.length || 0}</td>
                    <td className="text-sm text-base-content/60">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <select
                        className="select select-xs select-bordered"
                        value={u.role}
                        onChange={(e) => updateRole.mutate({ id: u._id, role: e.target.value })}
                        disabled={updateRole.isPending}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                className="btn btn-sm btn-ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <span className="text-sm">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                className="btn btn-sm btn-ghost"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SubmissionsTab() {
  const [page, setPage] = useState(1);
  const [track, setTrack] = useState("");
  const [status, setStatus] = useState("");
  const params = { page, limit: 20 };
  if (track) params.track = track;
  if (status) params.status = status;

  const { data, isLoading } = useAdminSubmissions(params);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select
          className="select select-sm select-bordered"
          value={track}
          onChange={(e) => { setTrack(e.target.value); setPage(1); }}
        >
          <option value="">All tracks</option>
          <option value="dsa">DSA</option>
          <option value="ml">ML</option>
        </select>
        <select
          className="select select-sm select-bordered"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="">All statuses</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="error">Error</option>
          <option value="queued">Queued</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Problem</th>
                  <th>Track</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Runtime</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {(data?.submissions || []).map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {s.user?.profileImage ? (
                          <img src={s.user.profileImage} alt="" className="size-6 rounded-full" />
                        ) : null}
                        <span className="text-sm">{s.user?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="font-medium text-sm">{s.problemId}</td>
                    <td><span className="badge badge-xs badge-outline uppercase">{s.track}</span></td>
                    <td className="text-sm">{s.language}</td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          s.status === "passed"
                            ? "badge-success"
                            : s.status === "failed"
                              ? "badge-error"
                              : s.status === "error"
                                ? "badge-warning"
                                : "badge-ghost"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="text-sm">{s.score ?? "—"}</td>
                    <td className="text-sm">{s.runtimeMs ? `${s.runtimeMs} ms` : "—"}</td>
                    <td className="text-xs text-base-content/60">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                className="btn btn-sm btn-ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeftIcon className="size-4" />
              </button>
              <span className="text-sm">
                Page {data.page} of {data.totalPages}
              </span>
              <button
                className="btn btn-sm btn-ghost"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRightIcon className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const TABS = [
  { key: "overview", label: "Overview", icon: BarChart3Icon },
  { key: "users", label: "Users", icon: UsersIcon },
  { key: "submissions", label: "Submissions", icon: FileTextIcon },
];

function AdminPage() {
  const { isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const [activeTab, setActiveTab] = useState("overview");

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-base-200">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      </div>
    );
  }

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-gradient-to-br from-primary to-secondary rounded-xl">
            <ShieldIcon className="size-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-base-content/60 text-sm">Manage users, review submissions, view analytics</p>
          </div>
        </div>

        <div className="tabs tabs-boxed mb-6 inline-flex">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab gap-2 ${activeTab === t.key ? "tab-active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              <t.icon className="size-4" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="card bg-base-100 border border-base-300">
          <div className="card-body">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "users" && <UsersTab />}
            {activeTab === "submissions" && <SubmissionsTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
