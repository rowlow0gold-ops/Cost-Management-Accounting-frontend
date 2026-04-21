"use client";

import { toPng } from "html-to-image";
import { RefObject } from "react";
import { toast } from "./Toast";

/** Small icon button that downloads the current chart as a PNG. */
export function ExportPngButton({
  targetRef, filename = "chart.png", title = "이미지 저장",
}: {
  targetRef: RefObject<HTMLElement>;
  filename?: string;
  title?: string;
}) {
  async function handle() {
    if (!targetRef.current) return;
    try {
      const dataUrl = await toPng(targetRef.current,
        { backgroundColor: "#ffffff", pixelRatio: 2 });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = filename;
      a.click();
    } catch (e: any) {
      toast.error("이미지 저장 실패: " + (e?.message || ""));
    }
  }
  return (
    <button type="button" onClick={handle} title={title}
      className="text-xs text-slate-500 hover:text-slate-700 inline-flex items-center gap-1">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
      다운로드
    </button>
  );
}
