import { useCallback, useEffect, useRef, useState } from "react";
import { http, ApiError, mediaUrl } from "../lib/api";
import type { VideoItem, Paged } from "../lib/types";
import { Pagination, Modal, ConfirmDialog, Field, Spinner } from "../components/UI";
import { useToast } from "../components/Toast";

const LIMIT = 24;

function csrf(): string {
  const m = document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function uploadVideo(path: string, file: File, onProgress: (p: number) => void) {
  return new Promise<VideoItem>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", path);
    xhr.setRequestHeader("x-csrf-token", csrf());
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 400) reject(new ApiError(xhr.status, data.error || "Upload failed"));
        else resolve(data);
      } catch {
        reject(new ApiError(xhr.status, "Upload failed"));
      }
    };
    xhr.onerror = () => reject(new ApiError(0, "Network error during upload"));
    xhr.send(form);
  });
}

export default function Videos() {
  const toast = useToast();
  const [items, setItems] = useState<VideoItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const [edit, setEdit] = useState<VideoItem | null>(null);
  const [preview, setPreview] = useState<VideoItem | null>(null);
  const [del, setDel] = useState<VideoItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await http.get<Paged<VideoItem>>(
        `/api/videos?page=${page}&limit=${LIMIT}&sort=${sort}&search=${encodeURIComponent(search)}`
      );
      setItems(res.items);
      setTotalPages(res.totalPages);
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, sort, search, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const uploadFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setProgress(0);
    for (const file of Array.from(files)) {
      try {
        await uploadVideo("/api/videos/upload", file, setProgress);
        toast(`Uploaded ${file.name}`);
      } catch (e) {
        toast((e as ApiError).message, "error");
      }
    }
    setUploading(false);
    setProgress(0);
    load();
  };

  const saveEdit = async () => {
    if (!edit) return;
    try {
      await http.put<VideoItem>(`/api/videos/${edit.id}`, {
        title: edit.title,
        description: edit.description,
        thumbnail: edit.thumbnail || "",
      });
      toast("Changes saved");
      setEdit(null);
      load();
    } catch (e) {
      toast((e as ApiError).message, "error");
    }
  };

  const confirmDelete = async () => {
    if (!del) return;
    setDeleting(true);
    try {
      await http.del(`/api/videos/${del.id}`);
      toast("Video deleted");
      setDel(null);
      load();
    } catch (e) {
      toast((e as ApiError).message, "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Videos</h2>
          <p className="mt-1 text-sm text-white/50">Manage every video shown on your website.</p>
        </div>
        <button className="btn-primary" onClick={() => fileInput.current?.click()}>
          + Upload
        </button>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
        onClick={() => fileInput.current?.click()}
        className={`mt-6 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
          dragOver ? "border-brand bg-brand/10" : "border-white/15 hover:border-white/30"
        }`}
      >
        <input
          ref={fileInput}
          type="file"
          accept="video/*"
          multiple
          hidden
          onChange={(e) => uploadFiles(e.target.files)}
        />
        {uploading ? (
          <div className="text-center">
            <Spinner label={`Uploading… ${progress}%`} />
            <div className="mx-auto mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <div className="text-white/60">
            <div className="text-lg font-semibold">Drop videos here or click to browse</div>
            <div className="mt-1 text-xs">MP4, MOV, WEBM, M4V · large files upload in the background</div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search videos…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <select className="input max-w-[160px]" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
        <span className="text-sm text-white/40">{items.length} shown</span>
      </div>

      {loading ? (
        <div className="mt-10 text-center text-brand"><Spinner size={30} /></div>
      ) : items.length === 0 ? (
        <div className="card mt-6 p-12 text-center text-white/40">No videos found.</div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((v) => (
            <div key={v.id} className="card group overflow-hidden">
              <button onClick={() => setPreview(v)} className="block aspect-[9/12] w-full bg-ink-800">
                <video src={mediaUrl(v.url)} poster={mediaUrl(v.thumbnail)} muted preload="metadata" className="h-full w-full object-cover" />
              </button>
              <div className="p-3">
                <div className="truncate text-sm font-semibold">{v.title || "(untitled)"}</div>
                <div className="mt-1 truncate text-xs text-white/40">{v.created_at}</div>
                <div className="mt-3 flex gap-2">
                  <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => setEdit(v)}>Edit</button>
                  <button className="btn-ghost !px-2 !py-1 text-xs !text-rose-400" onClick={() => setDel(v)}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview?.title || "Preview"} wide>
        {preview && (
          <div>
            <video src={mediaUrl(preview.url)} poster={mediaUrl(preview.thumbnail)} controls className="max-h-[70vh] w-full rounded-xl bg-black" />
            <p className="mt-3 text-sm text-white/60">{preview.description || "No description"}</p>
          </div>
        )}
      </Modal>

      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit Video">
        {edit && (
          <div className="space-y-4">
            <video src={mediaUrl(edit.url)} poster={mediaUrl(edit.thumbnail)} className="h-40 w-full rounded-xl bg-black object-cover" muted preload="metadata" />
            <Field label="Title">
              <input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            </Field>
            <Field label="Description">
              <textarea className="input" rows={3} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
            </Field>
            <Field label="Thumbnail URL (optional)">
              <input className="input" value={edit.thumbnail || ""} placeholder="image/thumb.jpg" onChange={(e) => setEdit({ ...edit, thumbnail: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-3">
              <button className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveEdit}>Save</button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!del}
        title="Delete video?"
        message={`"${del?.title}" will be removed from the website permanently.`}
        onConfirm={confirmDelete}
        onCancel={() => setDel(null)}
        loading={deleting}
      />
    </div>
  );
}