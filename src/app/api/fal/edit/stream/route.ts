import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { getClientIp, checkAndConsumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getUserId } from "@/lib/auth";
import { saveHistory } from "@/lib/history";

export const runtime = "nodejs";

type FalEditStreamBody = {
  endpoint?: string; // default: "fal-ai/flux-pro/kontext/max"
  prompt: string;
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  params?: Record<string, any>;
};

function sseHeaders() {
  return {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
}

function sendEvent(controller: ReadableStreamDefaultController, event: string, data: any) {
  const encoder = new TextEncoder();
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  controller.enqueue(encoder.encode(payload));
}

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

    const falKey = process.env.FAL_API_KEY;
    if (!falKey) {
      return NextResponse.json({ error: "FAL_API_KEY is not configured" }, { status: 500 });
    }

    fal.config({ credentials: falKey });

    const imageUrlOrDataUri = imageUrl
      ? imageUrl
      : `data:${mimeType || "image/png"};base64,${imageBase64}`;

    const ip = getClientIp(req);
    const userId = await getUserId();
    const scope = "edit" as const;
    const limits = userId ? RATE_LIMITS.authenticated[scope] : RATE_LIMITS.anonymous[scope];

    const stream = new ReadableStream({
      start: async (controller) => {
        try {
          const { allowed, remaining, resetAt } = await checkAndConsumeRateLimit(userId || ip, scope, limits);
          if (!allowed) {
            sendEvent(controller, "error", { error: `rate_limited: retry after ${resetAt.toISOString()}` });
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