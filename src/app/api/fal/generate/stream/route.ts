import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { getClientIp, checkAndConsumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getUserId } from "@/lib/auth";
import { saveHistory } from "@/lib/history";

export const runtime = "nodejs";

type FalGenerateStreamBody = {
  endpoint?: string; // default: "fal-ai/flux/dev"
  prompt: string;
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
    const body = (await req.json()) as FalGenerateStreamBody;
    const { endpoint = "fal-ai/flux/dev", prompt, params } = body || {};

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const falKey = process.env.FAL_API_KEY;
    if (!falKey) {
      return NextResponse.json({ error: "FAL_API_KEY is not configured" }, { status: 500 });
    }

    fal.config({ credentials: falKey });

    const ip = getClientIp(req);
    const userId = await getUserId();
    const scope = "generate" as const;
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
              ...(params || {}),
            },
            logs: true,
            onQueueUpdate: (update: any) => {
              try {
                sendEvent(controller, "update", update);
              } catch (e) {
                // ignore enqueue errors if stream closed
              }
            },
          });

          sendEvent(controller, "completed", {
            data: result?.data,
            requestId: result?.requestId,
            logs: (result as any)?.logs,
          });

          // Persist history (best-effort)
          await saveHistory({
            user_id: userId,
            provider: "fal",
            mode: "generate",
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
      cancel: () => {
        // connection closed by client
      },
    });

    return new Response(stream, { headers: sseHeaders(), status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "unexpected_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}