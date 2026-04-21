import { NextResponse } from "next/server";

/**
 * Vercel Cron job — pings the backend every 14 minutes
 * to prevent Render free-tier from sleeping.
 */
export async function GET() {
  const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";
  try {
    const res = await fetch(`${base}/api/health`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json({ backend: data, pingedAt: new Date().toISOString() });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message, pingedAt: new Date().toISOString() },
      { status: 502 },
    );
  }
}
