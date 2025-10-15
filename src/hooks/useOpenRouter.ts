"use client";

import { ASPECT_RATIOS } from "@/lib/types";

type AspectRatio = (typeof ASPECT_RATIOS)[number] | "";

export function useOpenRouter() {
  async function generate(params: {
    model: string;
    prompt: string;
    aspectRatio?: AspectRatio;
    signal?: AbortSignal;
  }): Promise<{ images: string[]; raw: any }> {
    const res = await fetch("/api/openrouter/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        aspectRatio: params.aspectRatio || undefined,
      }),
      signal: params.signal,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data?.error ||
          "OpenRouter generate failed. Check your API key in Settings, model access, and network connectivity."
      );
    }
    const imgs: string[] = Array.isArray(data?.images) ? data.images : [];
    return { images: imgs, raw: data?.raw ?? data };
  }

  async function edit(params: {
    model: string;
    prompt: string;
    imageUrl?: string;
    imageBase64?: string;
    mimeType?: string;
    signal?: AbortSignal;
  }): Promise<{ images: string[]; raw: any }> {
    if (!params.imageUrl && !params.imageBase64) {
      throw new Error("Please upload an image file or provide an image URL for editing.");
    }
    const res = await fetch("/api/openrouter/edit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: params.model,
        prompt: params.prompt,
        imageUrl: params.imageUrl,
        imageBase64: params.imageBase64,
        mimeType: params.mimeType,
      }),
      signal: params.signal,
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(
        data?.error ||
          "OpenRouter edit failed. Ensure an image is provided and your API key and model permissions are valid."
      );
    }
    const imgs: string[] = Array.isArray(data?.images) ? data.images : [];
    return { images: imgs, raw: data?.raw ?? data };
  }

  return { generate, edit };
}

