import { NextResponse } from "next/server";
import {
  validateOpenRouterKey,
  performRateLimiting,
  callOpenRouterAPI,
  saveOpenRouterHistory,
} from "@/lib/openrouter/utils";

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

    const keyError = validateOpenRouterKey();
    if (keyError) return keyError;

    const rateLimitResult = await performRateLimiting(req, "generate");
    if (!rateLimitResult.allowed) return rateLimitResult.response;

    const { userId, ip } = rateLimitResult;
    const apiKey = process.env.OPENROUTER_API_KEY!;
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

    const { ok, status, data } = await callOpenRouterAPI(payload, apiKey);

    if (!ok) {
      await saveOpenRouterHistory({
        userId,
        mode: "generate",
        model,
        prompt,
        status: "error",
        durationMs: Date.now() - started,
        ip,
        requestId: data?.id ?? null,
        rawResponse: data,
        error: JSON.stringify(data),
      });
      return NextResponse.json(
        { error: "openrouter_error", detail: data },
        { status }
      );
    }

    const choice = data?.choices?.[0];
    const imageObjects = choice?.message?.images;
    const images: string[] | undefined = Array.isArray(imageObjects)
      ? imageObjects.map((img: any) => img?.url || img).filter(Boolean)
      : undefined;

    await saveOpenRouterHistory({
      userId,
      mode: "generate",
      model,
      prompt,
      status: "completed",
      durationMs: Date.now() - started,
      ip,
      requestId: data?.id ?? null,
      rawResponse: data,
      resultUrls: images ?? null,
    });
    return NextResponse.json({ images, raw: data }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "unexpected_error", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}