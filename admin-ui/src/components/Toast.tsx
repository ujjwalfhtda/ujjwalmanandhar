import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface Toast {
  id: number;
  kind: "success" | "error" | "info";
  text: string;
}

const ToastContext = createContext<{ push: (text: string, kind?: Toast["kind"]) => void }>(null!);

let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((text: string, kind: Toast["kind"] = "success") => {
    const id = nextId++;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const styles: Record<Toast["kind"], string> = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-300",
    info: "border-sky-500/40 bg-sky-500/10 text-sky-300",
  };

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-in rounded-lg border px-4 py-3 text-sm font-medium shadow-card backdrop-blur ${styles[t.kind]}`}
          >
            {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext).push;
}