import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PageLoader } from "./UI";
import { http } from "../lib/api";

const NAV = [
  { to: "/", label: "Dashboard", icon: "M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z" },
  { to: "/images", label: "Images", icon: "M4 5h16v14H4V5Zm2 2v10h12V7H6Zm2 2h8v6H8V9Z" },
  { to: "/videos", label: "Videos", icon: "M8 5v14l11-7L8 5Z" },
  { to: "/content", label: "Website Text", icon: "M5 4h14v16H5V4Zm4 3h6v2H9V7Zm0 4h6v2H9v-2Zm0 4h4v2H9v-2Z" },
  { to: "/settings", label: "Settings", icon: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm8 4h2m-8 8v2m8-10h-2a6 6 0 0 0-12 0H2m8-8v2m-8 8h2" },
  { to: "/profile", label: "Profile", icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0H4Z" },
];

export function Layout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => (localStorage.getItem("adminDark") ?? "dark") === "dark");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("adminDark", dark ? "dark" : "light");
  }, [dark]);

  if (loading) return <PageLoader />;
  if (!user) return null;

  const initial = (user.name || "A").charAt(0).toUpperCase();

  const onLogout = async () => {
    await logout();
    navigate("/login");
  };

  const [pushing, setPushing] = useState(false);
  const [githubStatus, setGithubStatus] = useState<string | null>(null);

  const onPushGithub = async () => {
    setPushing(true);
    setGithubStatus(null);
    try {
      const res = await http.post<{ ok: boolean; message: string }>("/api/github/push");
      setGithubStatus("✅ " + res.message);
      setTimeout(() => setGithubStatus(null), 4000);
    } catch (e: any) {
      setGithubStatus("⚠️ " + (e.message || "Failed to push to GitHub"));
      setTimeout(() => setGithubStatus(null), 6000);
    } finally {
      setPushing(false);
    }
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand font-black text-ink-950">{initial}</div>
        <div className="leading-tight">
          <div className="text-sm font-bold text-white">Ujjwal's Website</div>
          <div className="text-xs text-white/40">Content Manager</div>
        </div>
      </div>
      <nav className="mt-2 flex-1 space-y-1 px-3">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive ? "bg-brand text-ink-950" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon path={item.icon} active={undefined} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="mb-2 flex items-center justify-between px-2">
          <span className="text-xs text-white/50">{user.email}</span>
          <button
            onClick={() => setDark((d) => !d)}
            className="grid h-7 w-7 place-items-center rounded-lg text-white/70 transition hover:bg-white/10"
            title="Toggle theme"
          >
            {dark ? "☀️" : "🌙"}
          </button>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-rose-400 transition hover:bg-rose-500/10"
        >
          <Icon path="M10 17l5-5-5-5v3H3v4h7v3Zm9-12h-6v-2h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6v-2h6V5Z" active={undefined} />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 bg-ink-900 lg:block">{sidebar}</aside>

      {/* Mobile sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-ink-900">{sidebar}</aside>
        </div>
      )}

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-5 backdrop-blur dark:border-white/10 dark:bg-ink-950/80">
          <div className="flex items-center gap-3">
            <button className="btn-ghost !px-3 lg:hidden" onClick={() => setMobileOpen(true)}>
              ☰
            </button>
            <h1 className="text-sm font-semibold text-slate-600 dark:text-white/60">
              Welcome back, <span className="text-ink-900 dark:text-white">{user.name}</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {githubStatus && (
              <span className="text-xs font-medium px-3 py-1.5 rounded-lg bg-ink-800 text-white/90 border border-white/10 shadow-sm">
                {githubStatus}
              </span>
            )}
            <button
              onClick={onPushGithub}
              disabled={pushing}
              className="flex items-center gap-2 rounded-xl bg-brand px-3.5 py-1.5 text-xs font-bold text-ink-950 transition hover:brightness-110 disabled:opacity-50"
              title="Commit & Push Project to GitHub"
            >
              {pushing ? (
                <>
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-950 border-t-transparent" />
                  <span>Updating GitHub...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
                  </svg>
                  <span>Update GitHub</span>
                </>
              )}
            </button>
            <button
              onClick={onLogout}
              className="btn-danger !py-1.5 !px-3 text-xs lg:hidden"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function Icon({ path, active }: { path: string; active?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 ${active ? "" : ""}`} fill="currentColor">
      <path d={path} />
    </svg>
  );
}