import { useEffect, useState } from "react";
import { http, ApiError } from "../lib/api";
import type { User } from "../lib/types";
import { Field, PageLoader, Spinner } from "../components/UI";
import { useToast } from "../components/Toast";

export default function Profile() {
  const toast = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    http.get<{ user: User }>("/api/auth/me")
      .then((r) => {
        setUser(r.user);
        setName(r.user.name);
        setEmail(r.user.email);
      })
      .catch((e) => toast((e as ApiError).message, "error"));
  }, [toast]);

  if (!user) return <PageLoader />;

  const save = async () => {
    setBusy(true);
    try {
      await http.put("/api/profile", {
        name,
        email,
        current_password: currentPassword || undefined,
        new_password: newPassword || undefined,
      });
      toast("Profile updated");
      setCurrentPassword("");
      setNewPassword("");
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold">Profile</h2>
      <p className="mt-1 text-sm text-white/50">Update your account details and password.</p>

      <div className="card mt-6 space-y-5 p-6">
        <Field label="Name">
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <div className="border-t border-white/10 pt-5">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white/50">Change password</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Current password">
              <input className="input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" />
            </Field>
            <Field label="New password">
              <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
            </Field>
          </div>
        </div>
        <div className="flex justify-end">
          <button className="btn-primary" onClick={save} disabled={busy}>
            {busy ? <Spinner size={18} /> : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}