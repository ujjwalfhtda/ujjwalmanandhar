import { useEffect, useState } from "react";
import { http, ApiError } from "../lib/api";
import { Field, Spinner } from "../components/UI";
import { useToast } from "../components/Toast";

interface SettingsMap {
  site_title?: string;
  site_tagline?: string;
  dark_mode?: string;
}

export default function Settings() {
  const toast = useToast();
  const [settings, setSettings] = useState<SettingsMap>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    http.get<SettingsMap>("/api/content/settings")
      .then((s) => { setSettings(s); setLoaded(true); })
      .catch((e) => toast((e as ApiError).message, "error"));
  }, [toast]);

  const save = async () => {
    setSaving(true);
    try {
      await http.put<SettingsMap>("/api/content/settings", settings);
      toast("Settings saved");
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="pt-20 text-center text-brand"><Spinner size={28} /></div>;

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold">Settings</h2>
      <p className="mt-1 text-sm text-white/50">Global website preferences.</p>

      <div className="card mt-6 space-y-5 p-6">
        <Field label="Site title">
          <input className="input" value={settings.site_title || ""} onChange={(e) => setSettings({ ...settings, site_title: e.target.value })} />
        </Field>
        <Field label="Site tagline">
          <input className="input" value={settings.site_tagline || ""} onChange={(e) => setSettings({ ...settings, site_tagline: e.target.value })} />
        </Field>
        <Field label="Default theme" hint="Choose the appearance visitors see first.">
          <select className="input" value={settings.dark_mode || "dark"} onChange={(e) => setSettings({ ...settings, dark_mode: e.target.value })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </Field>
        <div className="flex justify-end">
          <button className="btn-primary" onClick={save} disabled={saving}>
            {saving ? <Spinner size={18} /> : "Save settings"}
          </button>
        </div>
      </div>
    </div>
  );
}