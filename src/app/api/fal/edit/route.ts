import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { validateFalKey, performRateLimiting, saveFalHistory } from "@/lib/fal/utils";

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

    const keyError = validateFalKey();
    if (keyError) return keyError;

    const rateLimitResult = await performRateLimiting(req, "edit");
    if (!rateLimitResult.allowed) return rateLimitResult.response;

    const { userId, ip } = rateLimitResult;

    const imageUrlOrDataUri = imageUrl
      ? imageUrl
      : `data:${mimeType || "image/png"};base64,${imageBase64}`;

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

    await saveFalHistory({
      userId,
      mode: "edit",
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