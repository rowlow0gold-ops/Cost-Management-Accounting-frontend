"use client";

import { useEffect, useState } from "react";

type ToastKind = "success" | "error" | "info";
type ToastItem = { id: number; kind: ToastKind; title?: string; message: string };

type Listener = (items: ToastItem[]) => void;
let items: ToastItem[] = [];
let counter = 0;
const listeners = new Set<Listener>();

function emit() { listeners.forEach(fn => fn([...items])); }

function push(kind: ToastKind, message: string, title?: string, timeoutMs = 4000) {
  if (!message) return;
  const id = ++counter;
  items = [...items, { id, kind, title, message }];
  emit();
  if (timeoutMs > 0) {
    setTimeout(() => {
      items = items.filter(t => t.id !== id);
      emit();
    }, timeoutMs);
  }
}

export const toast = {
  success: (msg: string, title?: string) => push("success", msg, title ?? "성공"),
  error:   (msg: string, title?: string) => push("error",   msg, title ?? "오류"),
  info:    (msg: string, title?: string) => push("info",    msg, title),
  /** Convenience for API errors. Accepts thrown ApiError objects or generic Error. */
  fromError(e: unknown) {
    const msg =
      (e as any)?.message ||
      (typeof e === "string" ? e : "") ||
      "알 수 없는 오류가 발생했습니다.";
    push("error", msg, "오류");
  },
};

const toneMap = {
  success: "bg-emerald-600 text-white",
  error:   "bg-red-600 text-white",
  info:    "bg-slate-800 text-white",
};

export default function ToastHost() {
  const [list, setList] = useState<ToastItem[]>([]);

  useEffect(() => {
    const l: Listener = v => setList(v);
    listeners.add(l);
    l([...items]);
    return () => { listeners.delete(l); };
  }, []);

  return (
    <div className="fixed z-50 top-4 right-4 flex flex-col gap-2 max-w-xs w-full pointer-events-none">
      {list.map(t => (
        <div key={t.id}
             className={`pointer-events-auto rounded-lg shadow-lg px-4 py-3 text-sm ${toneMap[t.kind]}`}>
          {t.title && <div className="font-semibold mb-0.5">{t.title}</div>}
          <div className="opacity-95 whitespace-pre-line">{t.message}</div>
        </div>
      ))}
    </div>
  );
}
