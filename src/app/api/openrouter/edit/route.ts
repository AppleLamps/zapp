import { NextResponse } from "next/server";
import {
  validateOpenRouterKey,
  performRateLimiting,
  callOpenRouterAPI,
  saveOpenRouterHistory,
} from "@/lib/openrouter/utils";

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

    const keyError = validateOpenRouterKey();
    if (keyError) return keyError;

    const rateLimitResult = await performRateLimiting(req, "edit");
    if (!rateLimitResult.allowed) return rateLimitResult.response;

    const { userId, ip } = rateLimitResult;
    const apiKey = process.env.OPENROUTER_API_KEY!;
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

    const { ok, status, data } = await callOpenRouterAPI(payload, apiKey);

    if (!ok) {
      await saveOpenRouterHistory({
        userId,
        mode: "edit",
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
      mode: "edit",
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