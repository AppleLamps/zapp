import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { getClientIp, checkAndConsumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getUserId } from "@/lib/auth";
import { saveHistory } from "@/lib/history";

export const runtime = "nodejs";

type FalEditBody = {
  prompt: string;
  imageUrl?: string; // public URL to source image for editing
  imageBase64?: string; // base64 string without data URL prefix
  mimeType?: string; // e.g. image/png
  params?: Record<string, any>; // optional model-specific params
  endpoint?: string; // defaults to "fal-ai/flux-pro/kontext/max"
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FalEditBody;
    const {
      prompt,
      imageUrl,
      imageBase64,
      mimeType,
      params,
      endpoint = "fal-ai/flux-pro/kontext/max",
    } = body || {};

    if (!prompt || (!imageUrl && !imageBase64)) {
      return NextResponse.json(
        { error: "prompt and imageUrl or imageBase64 are required" },
        { status: 400 }
      );
    }

    const falKey = process.env.FAL_API_KEY;
    if (!falKey) {
      return NextResponse.json(
        { error: "FAL_API_KEY is not configured" },
        { status: 500 }
      );
    }

    fal.config({ credentials: falKey });

    const imageUrlOrDataUri = imageUrl
      ? imageUrl
      : `data:${mimeType || "image/png"};base64,${imageBase64}`;

    const ip = getClientIp(req);
    const userId = await getUserId();
    const scope = "edit" as const;
    const limits = userId ? RATE_LIMITS.authenticated[scope] : RATE_LIMITS.anonymous[scope];
    const { allowed, remaining, resetAt } = await checkAndConsumeRateLimit(userId || ip, scope, limits);
    if (!allowed) {
      return NextResponse.json(
        { error: "rate_limited", detail: `Retry after ${resetAt.toISOString()}` },
        { status: 429, headers: { "X-RateLimit-Remaining": String(remaining), "X-RateLimit-Reset": resetAt.toISOString() } }
      );
    }

    const started = Date.now();

    const result = await fal.subscribe(endpoint, {
      input: {
        prompt,
        image_url: imageUrlOrDataUri,
        ...(params || {}),
      },
      logs: true,
      onQueueUpdate: () => {},
    });

    await saveHistory({
      user_id: userId,
      provider: "fal",
      mode: "edit",
      model_or_endpoint: endpoint,
      prompt,
      negative_prompt: params?.negative_prompt ?? null,
      guidance_scale: params?.guidance_scale ?? null,
      seed: params?.seed ?? null,
      num_images: params?.num_images ?? null,
      status: "completed",
      duration_ms: Date.now() - started,
      ip,
      request_id: result?.requestId ?? null,
      raw_response: result,
      result_urls: Array.isArray(result?.data?.images) ? result.data.images.map((i: any) => i.url ?? i) : null,
    });

    return NextResponse.json(
      { data: result?.data, requestId: result?.requestId, logs: (result as any)?.logs },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "unexpected_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}