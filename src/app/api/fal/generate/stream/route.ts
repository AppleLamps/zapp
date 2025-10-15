import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { validateFalKey, performRateLimiting, saveFalHistory, sseHeaders, sendEvent } from "@/lib/fal/utils";

export const runtime = "nodejs";

type FalGenerateStreamBody = {
  endpoint?: string; // default: "fal-ai/flux/dev"
  prompt: string;
  params?: Record<string, any>;
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FalGenerateStreamBody;
    const { endpoint = "fal-ai/flux/dev", prompt, params } = body || {};

    if (!prompt) {
      return NextResponse.json({ error: "prompt is required" }, { status: 400 });
    }

    const keyError = validateFalKey();
    if (keyError) return keyError;

    const rateLimitResult = await performRateLimiting(req, "generate");
    const userId = rateLimitResult.allowed ? rateLimitResult.userId : null;
    const ip = rateLimitResult.allowed ? rateLimitResult.ip : "";

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