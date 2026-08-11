import { useEffect, useMemo, useRef, useState } from "react";
import { http, ApiError } from "../lib/api";
import type { ContentSections } from "../lib/types";
import { PageLoader, Spinner } from "../components/UI";
import { useToast } from "../components/Toast";

const SECTION_CONFIG: Record<string, { label: string; fields: { field: string; label: string; type?: "input" | "textarea" }[] }> = {
  hero: {
    label: "Hero Section",
    fields: [
      { field: "eyebrow", label: "Eyebrow Text" },
      { field: "title", label: "Hero Title / Headline", type: "textarea" },
      { field: "lede", label: "Intro / Lede Paragraph", type: "textarea" },
    ],
  },
  about: {
    label: "About Me",
    fields: [
      { field: "title", label: "Section Title" },
      { field: "subtitle", label: "Bio Intro / Lede Paragraph", type: "textarea" },
      { field: "body", label: "Bio Story Paragraph", type: "textarea" },
    ],
  },
  skills: {
    label: "Skills / Capabilities",
    fields: [
      { field: "title", label: "Section Title" },
      { field: "subtitle", label: "Subtitle Description", type: "textarea" },
    ],
  },
  projects: {
    label: "Projects & Portfolio",
    fields: [
      { field: "title", label: "Section Title" },
      { field: "subtitle", label: "Subtitle Description", type: "textarea" },
    ],
  },
  journey: {
    label: "Experience & Journey",
    fields: [
      { field: "title", label: "Section Title" },
      { field: "subtitle", label: "Subtitle Description", type: "textarea" },
    ],
  },
  contact: {
    label: "Contact Information",
    fields: [
      { field: "title", label: "Contact Section Title" },
      { field: "subtitle", label: "Contact Subtitle", type: "textarea" },
      { field: "email", label: "Email Address" },
      { field: "phone", label: "Phone Number" },
    ],
  },
  cta: {
    label: "Call to Action Band",
    fields: [
      { field: "title", label: "CTA Title" },
      { field: "subtitle", label: "CTA Subtitle", type: "textarea" },
      { field: "reply", label: "Response Time Guarantee" },
    ],
  },
  footer: {
    label: "Footer Content",
    fields: [
      { field: "copyright", label: "Copyright Notice" },
      { field: "tagline", label: "Footer Tagline", type: "textarea" },
    ],
  },
  menu: {
    label: "Navigation Menu",
    fields: [
      { field: "about", label: "About Menu Link" },
      { field: "skills", label: "Skills Menu Link" },
      { field: "projects", label: "Projects Menu Link" },
      { field: "contact", label: "Contact Menu Link" },
    ],
  },
};

interface EditableField {
  section: string;
  field: string;
  value: string;
}

export default function Content() {
  const toast = useToast();
  const [data, setData] = useState<ContentSections | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [history, setHistory] = useState<EditableField[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const previewKey = useRef(0);

  useEffect(() => {
    http.get<{ sections: ContentSections }>("/api/content")
      .then((res) => setData(res.sections))
      .catch((e) => toast((e as ApiError).message, "error"));
  }, [toast]);

  const setValue = (section: string, field: string, value: string) => {
    if (!data) return;
    const prev = data[section]?.[field] ?? "";
    setHistory((h) => [{ section, field, value: prev }, ...h].slice(0, 50));
    setData({ ...data, [section]: { ...data[section], [field]: value } });
  };

  const undo = () => {
    if (!history.length || !data) return;
    const last = history[0];
    setHistory((h) => h.slice(1));
    setData({ ...data, [last.section]: { ...data[last.section], [last.field]: last.value } });
  };

  const save = async (section: string, field: string, value: string) => {
    const key = `${section}.${field}`;
    setSaving(key);
    try {
      await http.put(`/api/content/${section}/${field}`, { value });
      toast(`Saved ${SECTION_CONFIG[section]?.label || section} › ${field}`);
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setSaving(null);
    }
  };

  if (!data) return <PageLoader />;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Website Text & Content</h2>
          <p className="mt-1 text-sm text-white/50">
            Edit text sections across your portfolio. Changes update on the website immediately.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" disabled={!history.length} onClick={undo} title="Undo last edit">
            ↩ Undo ({history.length})
          </button>
          <button
            className={showPreview ? "btn-primary" : "btn-outline"}
            onClick={() => { setShowPreview((s) => !s); previewKey.current++; }}
          >
            {showPreview ? "Hide Preview" : "Live Preview"}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
          <div className="flex items-center justify-between bg-ink-900 px-4 py-2 text-xs text-white/50">
            <span>Live preview of your public website</span>
            <button onClick={() => previewKey.current++} className="text-brand hover:underline">
              Refresh
            </button>
          </div>
          <iframe key={previewKey.current} src="/" className="h-[60vh] w-full bg-white" title="Website preview" />
        </div>
      )}

      <div className="mt-6 space-y-6">
        {Object.entries(SECTION_CONFIG).map(([sectionKey, sec]) => (
          <div key={sectionKey} className="card p-5">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white/50">{sec.label}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {sec.fields.map((f) => {
                const key = `${sectionKey}.${f.field}`;
                const val = data[sectionKey]?.[f.field] ?? "";
                const isWide = f.type === "textarea" || f.field === "title" || f.field === "lede" || f.field === "body";
                return (
                  <div key={key} className={isWide ? "md:col-span-2" : ""}>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-white/70">{f.label}</span>
                      <div className="flex items-center gap-2">
                        {f.type === "textarea" ? (
                          <textarea
                            className="input"
                            rows={f.field === "body" || f.field === "lede" ? 4 : 2}
                            value={val}
                            onChange={(e) => setValue(sectionKey, f.field, e.target.value)}
                            onBlur={(e) => save(sectionKey, f.field, e.target.value)}
                          />
                        ) : (
                          <input
                            className="input"
                            value={val}
                            onChange={(e) => setValue(sectionKey, f.field, e.target.value)}
                            onBlur={(e) => save(sectionKey, f.field, e.target.value)}
                          />
                        )}
                        {saving === key && <Spinner size={16} />}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}