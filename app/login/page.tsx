"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { saveSession } from "@/lib/auth";
import { Button, Input } from "@/components/ui";
import { toast } from "@/components/Toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@noaats.com");
  const [password, setPassword] = useState("password123");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const r = await api.login(email, password);
      saveSession(r);
      toast.success(`환영합니다, ${r.name}님`);
      router.replace("/dashboard");
    } catch (e: any) {
      const msg = e?.message || "로그인 실패";
      setErr(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-lg p-8">
        <div className="mb-6">
          <div className="text-xs text-slate-500">Cost &amp; Management</div>
          <h1 className="text-xl font-bold">원가/관리회계 플랫폼</h1>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm">
            <span className="block text-slate-600 mb-1">이메일</span>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label className="block text-sm">
            <span className="block text-slate-600 mb-1">비밀번호</span>
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>
          {err && <div className="text-red-600 text-sm">{err}</div>}
          <Button className="w-full" disabled={loading}>{loading ? "로그인 중..." : "로그인"}</Button>
        </form>

        <div className="mt-6 text-xs text-slate-500 border-t pt-4">
          <div className="font-medium text-slate-600 mb-1">테스트 계정 (비밀번호: password123)</div>
          <div>admin@noaats.com — 전체 권한</div>
          <div>manager@noaats.com — 승인/배분/대체</div>
          <div>user@noaats.com — 공수 입력</div>
        </div>
      </div>
    </div>
  );
}
