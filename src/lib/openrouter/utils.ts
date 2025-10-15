import { NextResponse } from "next/server";
import { getClientIp, checkAndConsumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getUserId } from "@/lib/auth";
import { saveHistory } from "@/lib/history";

/**
 * Validates that OPENROUTER_API_KEY is configured
 * @returns null if valid, or a NextResponse with error if invalid
 */
export function validateOpenRouterKey(): NextResponse | null {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured" },
      { status: 500 }
    );
  }
  return null;
}

/**
 * Performs rate limiting check for an OpenRouter API request
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
 * Calls the OpenRouter API with the given payload
 * @param payload - The request payload for OpenRouter API
 * @param apiKey - The OpenRouter API key
 * @returns The response data and status
 */
export async function callOpenRouterAPI(
  payload: any,
  apiKey: string
): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

/**
 * Saves an OpenRouter API request to history
 * @param params - History parameters
 */
export async function saveOpenRouterHistory(params: {
  userId: string | null;
  mode: "generate" | "edit";
  model: string;
  prompt: string;
  status: "completed" | "error";
  durationMs: number;
  ip: string;
  requestId: string | null;
  rawResponse: any;
  resultUrls?: string[] | null;
  error?: string | null;
}) {
  await saveHistory({
    user_id: params.userId,
    provider: "openrouter",
    mode: params.mode,
    model_or_endpoint: params.model,
    prompt: params.prompt,
    status: params.status,
    duration_ms: params.durationMs,
    ip: params.ip,
    request_id: params.requestId,
    raw_response: params.rawResponse,
    result_urls: params.resultUrls ?? null,
    error: params.error ?? null,
  });
}
