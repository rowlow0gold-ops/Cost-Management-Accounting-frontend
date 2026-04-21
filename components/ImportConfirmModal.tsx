"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export type ImportMode = "MERGE" | "REPLACE" | "REPLACE_SUBMIT" | null;

export default function ImportConfirmModal({
  onSelect,
  onBackup,
  showSubmitOption,
}: {
  onSelect: (mode: ImportMode) => void;
  onBackup?: () => void;
  showSubmitOption?: boolean;
}) {
  const [step, setStep] = useState<"choose" | "backup">("choose");

  function handleReplace() {
    if (onBackup) {
      setStep("backup");
    } else {
      onSelect("REPLACE");
    }
  }

  if (step === "backup") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        onClick={() => onSelect(null)}>
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h3 className="font-semibold text-sm">기존 데이터 백업</h3>
            <button onClick={() => onSelect(null)}
              className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
          </div>
          <div className="px-5 py-5 space-y-3">
            <p className="text-sm text-slate-600">
              기존 데이터를 Excel로 백업하시겠습니까?
            </p>
            <p className="text-xs text-slate-400">
              대체 후에는 기존 데이터를 복구할 수 없습니다.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => { onBackup?.(); onSelect("REPLACE"); }}
                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200
                           hover:border-blue-300 hover:bg-blue-50 transition group">
                <div className="font-medium text-sm text-slate-800 group-hover:text-blue-700">
                  백업 후 진행
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  기존 데이터를 Excel로 다운로드한 뒤 대체합니다.
                </div>
              </button>
              <button
                onClick={() => onSelect("REPLACE")}
                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200
                           hover:border-orange-300 hover:bg-orange-50 transition group">
                <div className="font-medium text-sm text-slate-800 group-hover:text-orange-700">
                  백업 없이 진행
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  기존 데이터를 바로 삭제하고 대체합니다.
                </div>
              </button>
            </div>
          </div>
          <div className="px-5 py-3 border-t bg-slate-50 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setStep("choose")}>이전</Button>
            <Button variant="ghost" onClick={() => onSelect(null)}>취소</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={() => onSelect(null)}>
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-sm">기존 데이터가 있습니다</h3>
          <button onClick={() => onSelect(null)}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
        </div>
        <div className="px-5 py-5 space-y-3">
          <p className="text-sm text-slate-600">
            이미 등록된 데이터가 있습니다. 어떻게 처리할까요?
          </p>
          <div className="space-y-2">
            <button
              onClick={() => onSelect("MERGE")}
              className="w-full text-left px-4 py-3 rounded-lg border border-slate-200
                         hover:border-blue-300 hover:bg-blue-50 transition group">
              <div className="font-medium text-sm text-slate-800 group-hover:text-blue-700">
                기존 데이터와 병합
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                기존 데이터를 유지하고, Excel 데이터를 추가합니다.
              </div>
            </button>
            <button
              onClick={handleReplace}
              className="w-full text-left px-4 py-3 rounded-lg border border-slate-200
                         hover:border-orange-300 hover:bg-orange-50 transition group">
              <div className="font-medium text-sm text-slate-800 group-hover:text-orange-700">
                Excel 데이터만 사용
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                기존 데이터를 모두 삭제하고, Excel 데이터로 대체합니다.
              </div>
            </button>
            {showSubmitOption && (
              <button
                onClick={() => onSelect("REPLACE_SUBMIT")}
                className="w-full text-left px-4 py-3 rounded-lg border border-slate-200
                           hover:border-green-300 hover:bg-green-50 transition group">
                <div className="font-medium text-sm text-slate-800 group-hover:text-green-700">
                  대체 후 전체 제출
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  기존 데이터를 모두 삭제하고, Excel 데이터를 등록한 뒤 전체 제출합니다.
                </div>
              </button>
            )}
          </div>
        </div>
        <div className="px-5 py-3 border-t bg-slate-50 flex justify-end">
          <Button variant="ghost" onClick={() => onSelect(null)}>취소</Button>
        </div>
      </div>
    </div>
  );
}
