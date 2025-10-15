"use client";

import { useState, useEffect } from "react";
import JSZip from "jszip";
import { loadSettings } from "@/hooks/useLocalSettings";

type Provider = "openrouter" | "fal";
type Mode = "generate" | "edit";

const OPENROUTER_MODELS = [
  { id: "google/gemini-2.5-flash-image-preview", label: "Google: Gemini 2.5 Flash Image Preview" },
];

const FAL_GENERATE_ENDPOINTS = [
  { id: "fal-ai/flux/dev", label: "FLUX.1 [dev] (Text to Image)" },
  { id: "fal-ai/flux-pro/kontext/max/text-to-image", label: "FLUX.1 Kontext [max] (Text to Image)" },
];

const FAL_EDIT_ENDPOINTS = [
  { id: "fal-ai/flux-pro/kontext/max", label: "FLUX.1 Kontext [max] (Image to Image)" },
];

const ASPECT_RATIOS = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "2:3",
  "3:2",
  "4:5",
  "5:4",
  "21:9",
] as const;

export default function HomePage() {
  const [provider, setProvider] = useState<Provider>("openrouter");
  const [mode, setMode] = useState<Mode>("generate");
  const [prompt, setPrompt] = useState("");
  const [openrouterModel, setOpenrouterModel] = useState<string>(
    OPENROUTER_MODELS[0].id
  );
  const [aspectRatio, setAspectRatio] = useState<(typeof ASPECT_RATIOS)[number] | "">("");
  const [falGenerateEndpoint, setFalGenerateEndpoint] = useState<string>(
    FAL_GENERATE_ENDPOINTS[0].id
  );
  const [falEditEndpoint, setFalEditEndpoint] = useState<string>(
    FAL_EDIT_ENDPOINTS[0].id
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [requestStatus, setRequestStatus] = useState<"idle" | "queued" | "running" | "completed" | "error">("idle");
  const [progress, setProgress] = useState<number>(0);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<Array<{ id: number; type: "success" | "error" | "info"; message: string }>>([]);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [numImages, setNumImages] = useState<number>(1);
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [guidanceScale, setGuidanceScale] = useState<number | "">("");
  const [seed, setSeed] = useState<number | "">("");
  const [openRawByDefault, setOpenRawByDefault] = useState(false);
  const [openLogsByDefault, setOpenLogsByDefault] = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setProvider(s.providerDefault as Provider);
    setMode(s.modeDefault as Mode);
    setOpenrouterModel(s.openrouterModelDefault);
    setAspectRatio((s.aspectRatioDefault || "") as any);
    setFalGenerateEndpoint(s.falGenerateEndpointDefault);
    setFalEditEndpoint(s.falEditEndpointDefault);
    setNumImages(s.numImagesDefault);
    setGuidanceScale(s.guidanceScaleDefault === "" ? "" : Number(s.guidanceScaleDefault));
    setSeed(s.seedDefault === "" ? "" : Number(s.seedDefault));
    setOpenLogsByDefault(s.showLogsByDefault);
    setOpenRawByDefault(s.showRawByDefault);
  }, []);

  function log(message: string) {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `${ts} — ${message}`]);
  }

  function showToast(type: "success" | "error" | "info", message: string) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  function setPhaseQueued() {
    setRequestStatus("queued");
    setProgress((p) => (p < 10 ? 10 : p));
  }
  function setPhaseRunning() {
    setRequestStatus("running");
    setProgress((p) => (p < 60 ? 60 : p));
  }
  function setPhaseCompleted() {
    setRequestStatus("completed");
    setProgress(100);
  }
  function setPhaseError() {
    setRequestStatus("error");
    setProgress(0);
  }

  async function streamFalGenerate(payload: { endpoint: string; prompt: string; params?: Record<string, any> }, signal?: AbortSignal) {
    const res = await fetch("/api/fal/generate/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "FAL generate stream failed");
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    while (true) {
      if (signal?.aborted) {
        log("FAL.ai: stream aborted by user");
        try { await reader.cancel(); } catch {}
        break;
      }
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const chunk of parts) {
        const lines = chunk.split("\n");
        const eventLine = lines.find((l) => l.startsWith("event:"));
        const dataLine = lines.find((l) => l.startsWith("data:"));
        if (!eventLine || !dataLine) continue;
        const event = eventLine.replace("event:", "").trim();
        const dataStr = dataLine.replace("data:", "").trim();
        let payload: any = {};
        try { payload = JSON.parse(dataStr); } catch {}
        if (event === "update") {
          const status = String(payload?.status || "").toUpperCase();
          if (status.includes("QUEUE") || status === "IN_QUEUE") setPhaseQueued();
          else if (status.includes("PROGRESS") || status === "IN_PROGRESS") setPhaseRunning();
          if (typeof payload?.queue_position === "number") {
            log(`FAL.ai: queue position ${payload.queue_position}`);
          }
        } else if (event === "completed") {
          setPhaseCompleted();
          const serverLogs: string[] = Array.isArray(payload?.logs) ? payload.logs : [];
          if (serverLogs.length) serverLogs.forEach((l) => log(`FAL.ai: ${l}`));
          const imgs: string[] = [];
          const d = payload?.data;
          if (Array.isArray(d?.images)) {
            for (const img of d.images) {
              if (img?.url) imgs.push(img.url);
              else if (img?.content) {
                const type = img?.content_type || "image/png";
                imgs.push(`data:${type};base64,${img.content}`);
              }
            }
          } else if (d?.image?.url) {
            imgs.push(d.image.url);
          } else if (d?.image?.content) {
            const type = d?.image?.content_type || "image/png";
            imgs.push(`data:${type};base64,${d.image.content}`);
          }
          setImages(imgs);
          setRawResponse(payload);
          showToast("success", `FAL.ai: generated ${imgs.length} image(s)`);
        } else if (event === "error") {
          setPhaseError();
          setError(payload?.error || "Streaming error");
          log(`FAL.ai: ${payload?.error || "Streaming error"}`);
          showToast("error", payload?.error || "Streaming error");
        }
      }
    }
  }

  async function streamFalEdit(payload: { endpoint: string; prompt: string; imageUrl?: string; imageBase64?: string; mimeType?: string; params?: Record<string, any> }, signal?: AbortSignal) {
    const res = await fetch("/api/fal/edit/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "FAL edit stream failed");
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    while (true) {
      if (signal?.aborted) {
        log("FAL.ai: stream aborted by user");
        try { await reader.cancel(); } catch {}
        break;
      }
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() || "";
      for (const chunk of parts) {
        const lines = chunk.split("\n");
        const eventLine = lines.find((l) => l.startsWith("event:"));
        const dataLine = lines.find((l) => l.startsWith("data:"));
        if (!eventLine || !dataLine) continue;
        const event = eventLine.replace("event:", "").trim();
        const dataStr = dataLine.replace("data:", "").trim();
        let payload: any = {};
        try { payload = JSON.parse(dataStr); } catch {}
        if (event === "update") {
          const status = String(payload?.status || "").toUpperCase();
          if (status.includes("QUEUE") || status === "IN_QUEUE") setPhaseQueued();
          else if (status.includes("PROGRESS") || status === "IN_PROGRESS") setPhaseRunning();
          if (typeof payload?.queue_position === "number") {
            log(`FAL.ai: queue position ${payload.queue_position}`);
          }
        } else if (event === "completed") {
          setPhaseCompleted();
          const serverLogs: string[] = Array.isArray(payload?.logs) ? payload.logs : [];
          if (serverLogs.length) serverLogs.forEach((l) => log(`FAL.ai: ${l}`));
          const imgs: string[] = [];
          const d = payload?.data;
          if (Array.isArray(d?.images)) {
            for (const img of d.images) {
              if (img?.url) imgs.push(img.url);
              else if (img?.content) {
                const type = img?.content_type || "image/png";
                imgs.push(`data:${type};base64,${img.content}`);
              }
            }
          } else if (d?.image?.url) {
            imgs.push(d.image.url);
          } else if (d?.image?.content) {
            const type = d?.image?.content_type || "image/png";
            imgs.push(`data:${type};base64,${d.image.content}`);
          }
          setImages(imgs);
          setRawResponse(payload);
          showToast("success", `FAL.ai: edited ${imgs.length} image(s)`);
        } else if (event === "error") {
          setPhaseError();
          setError(payload?.error || "Streaming error");
          log(`FAL.ai: ${payload?.error || "Streaming error"}`);
          showToast("error", payload?.error || "Streaming error");
        }
      }
    }
  }

  async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    const mimeType = file.type || "image/png";
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // result is data URL like "data:image/png;base64,...." -> strip prefix
        const base64 = result.split(",")[1] || result;
        resolve({ base64, mimeType });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setImages([]);
    setRawResponse(null);

    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    try {
      setLoading(true);
      const controller = new AbortController();
      setAbortController(controller);
      log(`Starting request: provider=${provider}, mode=${mode}`);
      if (provider === "openrouter") {
        if (mode === "generate") {
          log(`OpenRouter: sending generate request (model=${openrouterModel}, aspectRatio=${aspectRatio || "default"})`);
          const res = await fetch("/api/openrouter/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: openrouterModel,
              prompt,
              aspectRatio: aspectRatio || undefined,
            }),
            signal: controller.signal,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "OpenRouter generate failed");
          setRawResponse(data?.raw ?? data);
          const imgs: string[] = Array.isArray(data?.images) ? data.images : [];
          setImages(imgs);
          log(`OpenRouter: response received with ${imgs.length} image(s)`);
        } else {
          // edit
          let payload: any = { model: openrouterModel, prompt };
          if (imageFile) {
            log(`OpenRouter: reading uploaded file for edit`);
            const { base64, mimeType } = await fileToBase64(imageFile);
            payload.imageBase64 = base64;
            payload.mimeType = mimeType;
          } else if (imageUrl) {
            log(`OpenRouter: using provided image URL for edit`);
            payload.imageUrl = imageUrl;
          } else {
            setError("Please upload an image file or provide an image URL for editing.");
            log(`OpenRouter: edit aborted — no image file or URL provided`);
            return;
          }

          log(`OpenRouter: sending edit request (model=${openrouterModel})`);
          const res = await fetch("/api/openrouter/edit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "OpenRouter edit failed");
          setRawResponse(data?.raw ?? data);
          const imgs: string[] = Array.isArray(data?.images) ? data.images : [];
          setImages(imgs);
          log(`OpenRouter: response received with ${imgs.length} image(s)`);
        }
      } else if (provider === "fal") {
        if (mode === "generate") {
          log(`FAL.ai: streaming generate request (endpoint=${falGenerateEndpoint})`);
          setPhaseQueued();
          await streamFalGenerate({
            endpoint: falGenerateEndpoint,
            prompt,
            params: {
              image_size: "landscape_4_3",
              output_format: "png",
              ...(numImages ? { num_images: numImages } : {}),
              ...(negativePrompt ? { negative_prompt: negativePrompt } : {}),
              ...(guidanceScale !== "" ? { guidance_scale: Number(guidanceScale) } : {}),
              ...(seed !== "" ? { seed: Number(seed) } : {}),
            },
          }, controller.signal);
        } else {
          // edit
          let imageBase64: string | undefined;
          let mimeType: string | undefined;
          if (imageFile) {
            log(`FAL.ai: reading uploaded file for edit`);
            const fileData = await fileToBase64(imageFile);
            imageBase64 = fileData.base64;
            mimeType = fileData.mimeType;
          }
          if (!imageBase64 && !imageUrl) {
            setError("Please upload an image file or provide an image URL for editing.");
            log(`FAL.ai: edit aborted — no image file or URL provided`);
            return;
          }
          log(`FAL.ai: streaming edit request (endpoint=${falEditEndpoint})`);
          setPhaseQueued();
          await streamFalEdit({
            endpoint: falEditEndpoint,
            prompt,
            imageUrl: imageUrl || undefined,
            imageBase64,
            mimeType,
            params: {
              output_format: "png",
              ...(negativePrompt ? { negative_prompt: negativePrompt } : {}),
              ...(guidanceScale !== "" ? { guidance_scale: Number(guidanceScale) } : {}),
              ...(seed !== "" ? { seed: Number(seed) } : {}),
              ...(numImages ? { num_images: numImages } : {}),
            },
          }, controller.signal);
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        // Request was cancelled
        setError(null);
        showToast("info", "Request cancelled");
        log("Request cancelled by user");
      } else {
        setError(err?.message || "Something went wrong.");
        log(`Error: ${err?.message || String(err)}`);
      }
      } finally {
        setLoading(false);
        setAbortController(null);
        log(`Request finished`);
      }
    }

  async function copyImage(src: string) {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      // @ts-ignore - ClipboardItem may be missing in TS lib
      await navigator.clipboard.write([
        // @ts-ignore
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      log("Copied image to clipboard");
    } catch (e: any) {
      setError(e?.message || "Failed to copy image");
      log(`Copy failed: ${e?.message || e}`);
    }
  }

  function extFromMime(type: string) {
    if (type.includes("png")) return "png";
    if (type.includes("jpeg") || type.includes("jpg")) return "jpg";
    if (type.includes("webp")) return "webp";
    if (type.includes("gif")) return "gif";
    return "png";
  }

  async function downloadImage(src: string, idx: number) {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `image-${idx + 1}.${extFromMime(blob.type)}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      log("Downloaded image");
    } catch (e: any) {
      setError(e?.message || "Failed to download image");
      log(`Download failed: ${e?.message || e}`);
    }
  }

  function toggleSelect(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  function selectAll() {
    setSelected(new Set(images.map((_, i) => i)));
  }

  async function copySelected() {
    if (selected.size === 0) return;
    let count = 0;
    for (const idx of selected) {
      await copyImage(images[idx]);
      count++;
    }
    showToast("success", `Copied ${count} image(s) to clipboard`);
  }

  async function downloadSelected() {
    if (selected.size === 0) return;
    let count = 0;
    for (const idx of selected) {
      await downloadImage(images[idx], idx);
      count++;
    }
    showToast("success", `Downloaded ${count} image(s)`);
  }

  async function downloadSelectedZip() {
    if (selected.size === 0) return;
    try {
      const zip = new JSZip();
      let count = 0;
      for (const idx of selected) {
        const src = images[idx];
        const response = await fetch(src);
        const blob = await response.blob();
        const ext = extFromMime(blob.type);
        const arrayBuffer = await blob.arrayBuffer();
        zip.file(`image-${idx + 1}.${ext}`, arrayBuffer);
        count++;
      }
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `images-${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      showToast("success", `Downloaded ${count} image(s) as ZIP`);
      log("Downloaded selected images as ZIP");
    } catch (e: any) {
      const msg = e?.message || "Failed to download ZIP";
      setError(msg);
      showToast("error", msg);
      log(`ZIP download failed: ${msg}`);
    }
  }

  function cancelRequest() {
    if (abortController) {
      try {
        abortController.abort();
      } catch {}
      setAbortController(null);
      setLoading(false);
      setRequestStatus("idle");
      setProgress(0);
      showToast("info", "Request cancelled");
      log("Request cancelled by user");
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">AI Image Studio</h1>
          <a href="/settings" className="text-sm text-blue-600 hover:underline">Settings</a>
        </div>
        <p className="mt-2 text-gray-600">
          Create and edit images using OpenRouter and FAL.ai. Select provider, operation, enter a prompt, and optionally upload an image.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as Provider)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="fal">FAL.ai</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Operation</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as Mode)}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
              >
                <option value="generate">Generate (Text → Image)</option>
                <option value="edit">Edit (Image → Image)</option>
              </select>
            </div>
          </div>

          {provider === "openrouter" && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Model</label>
                <select
                  value={openrouterModel}
                  onChange={(e) => setOpenrouterModel(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                >
                  {OPENROUTER_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {mode === "generate" && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Aspect Ratio (optional)</label>
                  <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as any)}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                  >
                    <option value="">Default</option>
                    {ASPECT_RATIOS.map((ar) => (
                      <option key={ar} value={ar}>
                        {ar}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {provider === "fal" && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {mode === "generate" ? (
                <div>
                  <label className="text-sm font-medium text-gray-700">Endpoint</label>
                  <select
                    value={falGenerateEndpoint}
                    onChange={(e) => setFalGenerateEndpoint(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                  >
                    {FAL_GENERATE_ENDPOINTS.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-gray-700">Endpoint</label>
                  <select
                    value={falEditEndpoint}
                    onChange={(e) => setFalEditEndpoint(e.target.value)}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                  >
                    {FAL_EDIT_ENDPOINTS.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Advanced controls for FAL */}
              <div>
                <label className="text-sm font-medium text-gray-700">Number of Images</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={numImages}
                  onChange={(e) => setNumImages(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">FAL endpoints support multiple outputs; limits vary by endpoint.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Guidance Scale</label>
                <input
                  type="number"
                  placeholder="e.g. 7"
                  value={guidanceScale === "" ? "" : guidanceScale}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") setGuidanceScale("");
                    else setGuidanceScale(Number(v));
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Negative Prompt</label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Describe what to avoid in the image (FAL only)"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Seed</label>
                <input
                  type="number"
                  placeholder="optional"
                  value={seed === "" ? "" : seed}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") setSeed("");
                    else setSeed(Number(v));
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <label className="text-sm font-medium text-gray-700">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image or the edit you want..."
              rows={3}
              className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
            />
          </div>

          {mode === "edit" && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700">Upload Image (for OpenRouter and FAL)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Or Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 text-gray-900 focus:border-gray-500 focus:outline-none"
                />
                <p className="mt-1 text-xs text-gray-500">If both are provided, file upload takes precedence.</p>
              </div>
            </div>
          )}

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-700">
              <span>Status: {requestStatus === "idle" ? "Idle" : requestStatus === "queued" ? "Queued" : requestStatus === "running" ? "Running" : requestStatus === "completed" ? "Completed" : "Error"}</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 w-full rounded bg-gray-200">
              <div
                className="h-2 rounded bg-gray-900 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
              )}
              <span>{mode === "generate" ? "Generate" : "Apply Edit"}</span>
            </button>
            <button
              type="button"
              onClick={cancelRequest}
              disabled={!loading}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel Request
            </button>
            <button
              type="button"
              onClick={() => {
                setImages([]);
                setRawResponse(null);
                setError(null);
                setLogs([]);
              }}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-900 hover:bg-gray-100"
            >
              Reset Results
            </button>
          </div>
        </form>

        {images.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold">Results</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button onClick={selectAll} type="button" className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100">Select all</button>
              <button onClick={clearSelection} type="button" className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100">Clear</button>
              <button onClick={copySelected} type="button" className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100">Copy selected</button>
              <button onClick={downloadSelected} type="button" className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100">Download selected</button>
              <button onClick={downloadSelectedZip} type="button" className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-100">Download selected as ZIP</button>
              <span className="text-xs text-gray-500">Selected: {selected.size}</span>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {images.map((src, idx) => (
                <div key={idx} className={`relative overflow-hidden rounded-lg border ${selected.has(idx) ? "border-gray-900 ring-2 ring-gray-900" : "border-gray-200"} bg-white`}
                  onClick={() => toggleSelect(idx)}
                >
                  <img src={src} alt={`Result ${idx + 1}`} className="h-full w-full object-cover" />
                  {selected.has(idx) && (
                    <div className="pointer-events-none absolute left-2 top-2 rounded bg-gray-900 px-2 py-1 text-xs text-white">Selected</div>
                  )}
                  <div className="flex items-center gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => copyImage(src)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 hover:bg-gray-100"
                    >
                      Copy image
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadImage(src, idx)}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-900 hover:bg-gray-100"
                    >
                      Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {rawResponse && (
          <div className="mt-8">
            <details className="rounded-lg border border-gray-200 bg-white p-4" open={openRawByDefault}>
              <summary className="cursor-pointer text-sm font-medium text-gray-700">View Raw Response (Debug)</summary>
              <pre className="mt-3 overflow-auto rounded bg-gray-50 p-3 text-xs text-gray-800">{JSON.stringify(rawResponse, null, 2)}</pre>
            </details>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-8">
            <details className="rounded-lg border border-gray-200 bg-white p-4" open={openLogsByDefault}>
              <summary className="cursor-pointer text-sm font-medium text-gray-700">Request Logs</summary>
              <div className="mt-3 space-y-1 text-sm text-gray-800">
                {logs.map((l, i) => (
                  <div key={i} className="rounded bg-gray-50 p-2">{l}</div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Toasts */}
        <div className="fixed right-4 top-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div key={t.id} className={`rounded-lg px-4 py-2 text-sm shadow ${t.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : t.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-gray-50 text-gray-800 border border-gray-200"}`}>
              {t.message}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
