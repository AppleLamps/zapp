import { NextResponse } from "next/server";
import { getClientIp, checkAndConsumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getUserId } from "@/lib/auth";
import { saveHistory } from "@/lib/history";

export const runtime = "nodejs";

type GenerateBody = {
  model: string;
  prompt: string;
  aspectRatio?:
    | "1:1"
    | "2:3"
    | "3:2"
    | "3:4"
    | "4:3"
    | "4:5"
    | "5:4"
    | "9:16"
    | "16:9"
    | "21:9";
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as GenerateBody;
    const { model, prompt, aspectRatio } = body || {};

    if (!model || !prompt) {
      return NextResponse.json(
        { error: "model and prompt are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY is not configured" },
        { status: 500 }
      );
    }

    // Rate limiting
    const ip = getClientIp(req);
    const userId = await getUserId();
    const scope = "generate" as const;
    const limits = userId ? RATE_LIMITS.authenticated[scope] : RATE_LIMITS.anonymous[scope];
    const { allowed, remaining, resetAt } = await checkAndConsumeRateLimit(userId || ip, scope, limits);
    if (!allowed) {
      return NextResponse.json(
        { error: "rate_limited", detail: `Retry after ${resetAt.toISOString()}` },
        { status: 429, headers: { "X-RateLimit-Remaining": String(remaining), "X-RateLimit-Reset": resetAt.toISOString() } }
      );
    }

    const started = Date.now();
    const payload: any = {
      model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
      modalities: ["text", "image"],
    };

    if (aspectRatio) {
      payload.image_config = { aspect_ratio: aspectRatio };
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      await saveHistory({
        user_id: userId,
        provider: "openrouter",
        mode: "generate",
        model_or_endpoint: model,
        prompt,
        status: "error",
        duration_ms: Date.now() - started,
        ip,
        request_id: data?.id ?? null,
        raw_response: data,
        error: JSON.stringify(data),
      });
      return NextResponse.json(
        { error: "openrouter_error", detail: data },
        { status: res.status }
      );
    }

    const choice = data?.choices?.[0];
    const images: string[] | undefined = choice?.message?.images;

    await saveHistory({
      user_id: userId,
      provider: "openrouter",
      mode: "generate",
      model_or_endpoint: model,
      prompt,
      status: "completed",
      duration_ms: Date.now() - started,
      ip,
      request_id: data?.id ?? null,
      raw_response: data,
      result_urls: images ?? null,
    });
    return NextResponse.json({ images, raw: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "unexpected_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}