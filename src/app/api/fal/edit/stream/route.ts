import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { validateFalKey, performRateLimiting, saveFalHistory, sseHeaders, sendEvent } from "@/lib/fal/utils";

export const runtime = "nodejs";

type FalEditStreamBody = {
  endpoint?: string; // default: "fal-ai/flux-pro/kontext/max"
  prompt: string;
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  params?: Record<string, any>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FalEditStreamBody;
    const {
      endpoint = "fal-ai/flux-pro/kontext/max",
      prompt,
      imageUrl,
      imageBase64,
      mimeType,
      params,
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
    const userId = rateLimitResult.allowed ? rateLimitResult.userId : null;
    const ip = rateLimitResult.allowed ? rateLimitResult.ip : "";

    const imageUrlOrDataUri = imageUrl
      ? imageUrl
      : `data:${mimeType || "image/png"};base64,${imageBase64}`;

    const stream = new ReadableStream({
      start: async (controller) => {
        try {
          if (!rateLimitResult.allowed) {
            sendEvent(controller, "error", { error: `rate_limited: retry after ${rateLimitResult.response.headers.get("X-RateLimit-Reset")}` });
            controller.close();
            return;
          }
          const started = Date.now();
          const result = await fal.subscribe(endpoint, {
            input: {
              prompt,
              image_url: imageUrlOrDataUri,
              ...(params || {}),
            },
            logs: true,
            onQueueUpdate: (update: any) => {
              try {
                sendEvent(controller, "update", update);
              } catch (e) {}
            },
          });

          sendEvent(controller, "completed", {
            data: result?.data,
            requestId: result?.requestId,
            logs: (result as any)?.logs,
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
        } catch (err: any) {
          sendEvent(controller, "error", { error: err?.message || String(err) });
        } finally {
          controller.close();
        }
      },
      cancel: () => {},
    });

    return new Response(stream, { headers: sseHeaders(), status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "unexpected_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}