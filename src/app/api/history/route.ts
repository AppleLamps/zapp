import { NextResponse } from "next/server";
import { saveHistory } from "@/lib/history";
import { getClientIp, checkAndConsumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit";

export const runtime = "nodejs";

type HistoryPayload = {
  provider: string;
  mode: string;
  modelOrEndpoint: string;
  prompt: string;
  negativePrompt?: string;
  guidanceScale?: number;
  seed?: number;
  numImages?: number;
  status: string;
  durationMs?: number;
  requestId?: string;
  raw?: any;
  resultUrls?: string[];
  error?: string;
};

async function getUserId(): Promise<string | null> {
  try {
    // This requires you to run `npx @stackframe/init-stack . --no-browser` and set env keys
    // It will generate a `stack.ts` file at project root.
    // @ts-ignore
    const mod = await import("../../../stack");
    if (mod?.stackServerApp?.getUser) {
      const user = await mod.stackServerApp.getUser();
      return user?.id ?? null;
    }
  } catch {}
  return null;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as HistoryPayload;
    const ip = getClientIp(req);
    const userId = await getUserId();
    const subject = userId || ip;
    const scope = body?.mode === "edit" ? "edit" : "generate";
    const limits = userId ? RATE_LIMITS.authenticated[scope] : RATE_LIMITS.anonymous[scope];

    const { allowed, remaining, resetAt } = await checkAndConsumeRateLimit(subject, scope, limits);
    if (!allowed) {
      return NextResponse.json(
        { error: "rate_limited", detail: `Retry after ${resetAt.toISOString()}` },
        { status: 429, headers: { "X-RateLimit-Remaining": String(remaining), "X-RateLimit-Reset": resetAt.toISOString() } }
      );
    }

    const id = await saveHistory({
      user_id: userId,
      provider: body.provider,
      mode: body.mode,
      model_or_endpoint: body.modelOrEndpoint,
      prompt: body.prompt,
      negative_prompt: body.negativePrompt ?? null,
      guidance_scale: body.guidanceScale ?? null,
      seed: body.seed ?? null,
      num_images: body.numImages ?? null,
      status: body.status,
      duration_ms: body.durationMs ?? null,
      ip,
      request_id: body.requestId ?? null,
      raw_response: body.raw ?? null,
      result_urls: body.resultUrls ?? null,
      error: body.error ?? null,
    });

    return NextResponse.json({ id }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "unexpected_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const userId = await getUserId();
    const sql = (await import("@/lib/db")).getSql();
    const subject = userId || ip;
    const rows = await sql`
      SELECT id, created_at, provider, mode, model_or_endpoint, prompt, result_urls
      FROM app.history
      WHERE COALESCE(user_id, ${ip}) = ${subject}
      ORDER BY created_at DESC
      LIMIT 50;
    ` as { id: number; created_at: string; provider: string; mode: string; model_or_endpoint: string; prompt: string; result_urls: string[] }[];
    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "unexpected_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}