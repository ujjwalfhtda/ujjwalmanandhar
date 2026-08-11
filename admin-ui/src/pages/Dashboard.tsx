import { useEffect, useState } from "react";
import { http, mediaUrl } from "../lib/api";
import type { Stats, ActivityItem } from "../lib/types";
import { PageLoader } from "../components/UI";

function StatCard({ label, value, sub, href }: { label: string; value: string | number; sub?: string; href?: string }) {
  return (
    <div className="card p-5">
      <div className="text-sm font-medium text-white/50">{label}</div>
      <div className="mt-2 text-3xl font-black text-white">{value}</div>
      {sub && <div className="mt-2 text-xs text-white/40">{sub}</div>}
      {href && (
        <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-semibold text-brand hover:underline">
          View →
        </a>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([http.get<Stats>("/api/stats"), http.get<{ items: ActivityItem[] }>("/api/activity?limit=15")])
      .then(([s, a]) => {
        setStats(s);
        setActivity(a.items);
      })
      .catch((e) => setError(e.message));
  }, []);

  const [pushing, setPushing] = useState(false);
  const [githubMsg, setGithubMsg] = useState<string | null>(null);

  const onPushGithub = async () => {
    setPushing(true);
    setGithubMsg(null);
    try {
      const res = await http.post<{ ok: boolean; message: string }>("/api/github/push");
      setGithubMsg("✅ " + res.message);
    } catch (e: any) {
      setGithubMsg("❌ " + (e.message || "Failed to update GitHub"));
    } finally {
      setPushing(false);
    }
  };

  if (!stats && !error) return <PageLoader />;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <p className="mt-1 text-sm text-white/50">Live overview of your website content.</p>
        </div>
        <button
          onClick={onPushGithub}
          disabled={pushing}
          className="flex items-center gap-2.5 rounded-xl bg-brand px-5 py-2.5 text-sm font-bold text-ink-950 shadow-lg transition hover:brightness-110 disabled:opacity-50"
        >
          {pushing ? (
            <>
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
              <span>Updating GitHub...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
              </svg>
              <span>Update Website on GitHub</span>
            </>
          )}
        </button>
      </div>

      {githubMsg && (
        <div className="mt-4 rounded-xl border border-white/10 bg-ink-900 p-4 text-sm font-semibold text-white shadow-card">
          {githubMsg}
        </div>
      )}

      {stats && (
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Total Images" value={stats.totalImages} />
          <StatCard label="Total Videos" value={stats.totalVideos} />
          <StatCard label="Activity (30d)" value={stats.activity30d} />
          <StatCard label="Admins" value={stats.totalUsers} />
        </div>
      )}

      {stats && (stats.lastImage || stats.lastVideo) && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {stats.lastImage && (
            <div className="card flex items-center gap-4 p-4">
              <img src={mediaUrl(stats.lastImage.url)} alt="" className="h-16 w-16 rounded-xl object-cover" />
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Last image</div>
                <div className="truncate font-medium">{stats.lastImage.title}</div>
                <div className="text-xs text-white/40">{stats.lastImage.created_at}</div>
              </div>
            </div>
          )}
          {stats.lastVideo && (
            <div className="card flex items-center gap-4 p-4">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-ink-800 text-brand">▶</div>
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-wide text-white/40">Last video</div>
                <div className="truncate font-medium">{stats.lastVideo.title}</div>
                <div className="text-xs text-white/40">{stats.lastVideo.created_at}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card mt-8 overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4 font-semibold">Recent Activity</div>
        <ul className="divide-y divide-white/5">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-5 py-3 text-sm">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  a.action === "delete" ? "bg-rose-400" : a.action === "upload" || a.action === "create" ? "bg-emerald-400" : "bg-brand"
                }`}
              />
              <span className="font-medium capitalize">{a.action}</span>
              <span className="text-white/40">·</span>
              <span className="text-white/70">{a.entity}</span>
              <span className="min-w-0 flex-1 truncate text-white/40">{a.detail}</span>
              <span className="shrink-0 text-xs text-white/30">{a.created_at}</span>
            </li>
          ))}
          {activity.length === 0 && <li className="px-5 py-6 text-center text-sm text-white/40">No activity yet.</li>}
        </ul>
      </div>
    </div>
  );
}