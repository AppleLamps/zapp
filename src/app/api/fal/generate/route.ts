import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { validateFalKey, performRateLimiting, saveFalHistory } from "@/lib/fal/utils";

export const runtime = "nodejs";

type FalGenerateBody = {
  endpoint?: string; // e.g. "fal-ai/flux/dev" or "fal-ai/flux-pro/kontext/max/text-to-image"
  prompt: string;
  params?: Record<string, any>; // model-specific params (image_size, num_images, guidance_scale, etc.)
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FalGenerateBody;
    const { endpoint = "fal-ai/flux/dev", prompt, params } = body || {};

    if (!prompt) {
      return NextResponse.json(
        { error: "prompt is required" },
        { status: 400 }
      );
    }

    const keyError = validateFalKey();
    if (keyError) return keyError;

    const rateLimitResult = await performRateLimiting(req, "generate");
    if (!rateLimitResult.allowed) return rateLimitResult.response;

    const { userId, ip } = rateLimitResult;

    const started = Date.now();
    const result = await fal.subscribe(endpoint, {
      input: {
        prompt,
        ...(params || {}),
      },
      logs: true,
      onQueueUpdate: () => {},
    });

    await saveFalHistory({
      userId,
      mode: "generate",
      endpoint,
      prompt,
      params,
      durationMs: Date.now() - started,
      ip,
      result,
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