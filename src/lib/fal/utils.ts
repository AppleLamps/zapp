import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { getClientIp, checkAndConsumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getUserId } from "@/lib/auth";
import { saveHistory } from "@/lib/history";

/**
 * Validates that FAL_API_KEY is configured and sets up the fal client
 * @returns null if valid, or a NextResponse with error if invalid
 */
export function validateFalKey(): NextResponse | null {
  const falKey = process.env.FAL_API_KEY;
  if (!falKey) {
    return NextResponse.json(
      { error: "FAL_API_KEY is not configured" },
      { status: 500 }
    );
  }
  fal.config({ credentials: falKey });
  return null;
}

/**
 * Performs rate limiting check for a Fal API request
 * @param req - The incoming request
 * @param scope - The scope for rate limiting ("generate" or "edit")
 * @returns Object containing userId, ip, and rate limit result, or a NextResponse with error if rate limited
 */
export async function performRateLimiting(
  req: Request,
  scope: "generate" | "edit"
): Promise<
  | { userId: string | null; ip: string; allowed: true; remaining: number; resetAt: Date }
  | { allowed: false; response: NextResponse }
> {
  const ip = getClientIp(req);
  const userId = await getUserId();
  const limits = userId ? RATE_LIMITS.authenticated[scope] : RATE_LIMITS.anonymous[scope];
  const { allowed, remaining, resetAt } = await checkAndConsumeRateLimit(userId || ip, scope, limits);

  if (!allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "rate_limited", detail: `Retry after ${resetAt.toISOString()}` },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": String(remaining),
            "X-RateLimit-Reset": resetAt.toISOString(),
          },
        }
      ),
    };
  }

  return { userId, ip, allowed: true, remaining, resetAt };
}

/**
 * Saves a Fal API request to history
 * @param params - History parameters
 */
export async function saveFalHistory(params: {
  userId: string | null;
  mode: "generate" | "edit";
  endpoint: string;
  prompt: string;
  params?: Record<string, any>;
  durationMs: number;
  ip: string;
  result: any;
}) {
  await saveHistory({
    user_id: params.userId,
    provider: "fal",
    mode: params.mode,
    model_or_endpoint: params.endpoint,
    prompt: params.prompt,
    negative_prompt: params.params?.negative_prompt ?? null,
    guidance_scale: params.params?.guidance_scale ?? null,
    seed: params.params?.seed ?? null,
    num_images: params.params?.num_images ?? null,
    status: "completed",
    duration_ms: params.durationMs,
    ip: params.ip,
    request_id: params.result?.requestId ?? null,
    raw_response: params.result,
    result_urls: Array.isArray(params.result?.data?.images)
      ? params.result.data.images.map((i: any) => i.url ?? i)
      : null,
  });
}

/**
 * SSE headers for streaming responses
 */
export function sseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

/**
 * Sends an SSE event to the client
 */
export function sendEvent(controller: ReadableStreamDefaultController, event: string, data: any) {
  const encoder = new TextEncoder();
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(payload));
}
