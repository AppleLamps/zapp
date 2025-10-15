import { NextResponse } from "next/server";
import { getClientIp, checkAndConsumeRateLimit, RATE_LIMITS } from "@/lib/rateLimit";
import { getUserId } from "@/lib/auth";
import { saveHistory } from "@/lib/history";

export const runtime = "nodejs";

type EditBody = {
  model: string;
  prompt: string;
  imageUrl?: string; // public URL
  imageBase64?: string; // base64 without data URL prefix
  mimeType?: string; // e.g. image/png, image/jpeg
};

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as EditBody;
    const { model, prompt, imageUrl, imageBase64, mimeType } = body || {};

    if (!model || !prompt) {
      return NextResponse.json(
        { error: "model and prompt are required" },
        { status: 400 }
      );
    }

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: "imageUrl or imageBase64 is required" },
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
    const imageUrlOrData = imageUrl
      ? imageUrl
      : `data:${mimeType || "image/png"};base64,${imageBase64}`;

    const payload: any = {
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrlOrData } },
          ],
        },
      ],
      modalities: ["text", "image"],
    };

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
        mode: "edit",
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
      mode: "edit",
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