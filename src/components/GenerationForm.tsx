"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Provider, Mode } from "@/lib/types";
import { ASPECT_RATIOS } from "@/lib/types";
import { useImageOperations } from "@/hooks/useImageOperations";
import { useOpenRouter } from "@/hooks/useOpenRouter";
import { useFal } from "@/hooks/useFal";

type AspectRatio = (typeof ASPECT_RATIOS)[number] | "";

type OpenrouterModelOption = {
  id: string;
  label: string;
  description: string;
  cost: {
    generate: number;
    edit: number;
  };
};

type FalEndpointOption = {
  id: string;
  label: string;
  description: string;
  costPerImage: number;
};

const OPENROUTER_MODEL_OPTIONS: OpenrouterModelOption[] = [
  {
    id: "google/gemini-2.5-flash-image-preview",
    label: "Google: Gemini 2.5 Flash Image Preview",
    description:
      "Fast multimodal model tuned for preview-quality image renders. Great for rapid iteration.",
    cost: {
      generate: 0.02,
      edit: 0.03,
    },
  },
];

const FAL_GENERATE_OPTIONS: FalEndpointOption[] = [
  {
    id: "fal-ai/flux/dev",
    label: "FLUX.1 [dev] (Text to Image)",
    description:
      "Development endpoint with quick turnaround. Ideal for experimenting with prompts.",
    costPerImage: 0.012,
  },
  {
    id: "fal-ai/flux-pro/kontext/max/text-to-image",
    label: "FLUX.1 Kontext [max] (Text to Image)",
    description: "High fidelity text-to-image endpoint for production-ready assets.",
    costPerImage: 0.035,
  },
];

const FAL_EDIT_OPTIONS: FalEndpointOption[] = [
  {
    id: "fal-ai/flux-pro/kontext/max",
    label: "FLUX.1 Kontext [max] (Image to Image)",
    description:
      "Image-to-image endpoint preserving composition while applying prompt-driven edits.",
    costPerImage: 0.028,
  },
];

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export type GenerationFormProps = {
  provider: Provider;
  setProvider: (v: Provider) => void;
  mode: Mode;
  setMode: (v: Mode) => void;

  openrouterModel: string;
  setOpenrouterModel: (v: string) => void;
  aspectRatio: AspectRatio;
  setAspectRatio: (v: AspectRatio) => void;

  falGenerateEndpoint: string;
  setFalGenerateEndpoint: (v: string) => void;
  falEditEndpoint: string;
  setFalEditEndpoint: (v: string) => void;

  numImages: number;
  setNumImages: (v: number) => void;
  guidanceScale: number | "";
  setGuidanceScale: (v: number | "") => void;
  seed: number | "";
  setSeed: (v: number | "") => void;
  negativePrompt: string;
  setNegativePrompt: (v: string) => void;

  prompt: string;
  setPrompt: (v: string) => void;
  imageFile: File | null;
  setImageFile: (f: File | null) => void;
  imageUrl: string;
  setImageUrl: (v: string) => void;

  loading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (v: string | null) => void;
  requestStatus: "idle" | "queued" | "running" | "completed" | "error";
  setRequestStatus: (s: "idle" | "queued" | "running" | "completed" | "error") => void;
  progress: number;
  setProgress: (v: number) => void;
  abortController: AbortController | null;
  setAbortController: (c: AbortController | null) => void;

  onResults: (images: string[], raw: any) => void;
  onResetResults: () => void;
  onCancelRequest: () => void;
  onLog: (msg: string) => void;
  notify: (type: "success" | "error" | "info", message: string) => void;
};

type CostEstimate = { total: number; breakdown: string; note?: string };

export function GenerationForm(props: GenerationFormProps) {
  const {
    provider,
    setProvider,
    mode,
    setMode,
    openrouterModel,
    setOpenrouterModel,
    aspectRatio,
    setAspectRatio,
    falGenerateEndpoint,
    setFalGenerateEndpoint,
    falEditEndpoint,
    setFalEditEndpoint,
    numImages,
    setNumImages,
    guidanceScale,
    setGuidanceScale,
    seed,
    setSeed,
    negativePrompt,
    setNegativePrompt,
    prompt,
    setPrompt,
    imageFile,
    setImageFile,
    imageUrl,
    setImageUrl,
    loading,
    setLoading,
    error,
    setError,
    requestStatus,
    setRequestStatus,
    progress,
    setProgress,
    abortController,
    setAbortController,
    onResults,
    onResetResults,
    onCancelRequest,
    onLog,
    notify,
  } = props;

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const { fileToBase64 } = useImageOperations();
  const { generate: orGenerate, edit: orEdit } = useOpenRouter();
  const fal = useFal();

  // Mirror fal hook status/progress to parent state
  useEffect(() => {
    setRequestStatus(fal.status);
  }, [fal.status, setRequestStatus]);
  useEffect(() => {
    setProgress(fal.progress);
  }, [fal.progress, setProgress]);

  // Image preview for uploaded file
  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return objectUrl;
    });
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  const selectedOpenrouterModel = useMemo(
    () =>
      OPENROUTER_MODEL_OPTIONS.find((m) => m.id === openrouterModel) ||
      OPENROUTER_MODEL_OPTIONS[0] ||
      null,
    [openrouterModel]
  );

  const selectedFalGenerateEndpoint = useMemo(
    () =>
      FAL_GENERATE_OPTIONS.find((ep) => ep.id === falGenerateEndpoint) ||
      FAL_GENERATE_OPTIONS[0] ||
      null,
    [falGenerateEndpoint]
  );

  const selectedFalEditEndpoint = useMemo(
    () =>
      FAL_EDIT_OPTIONS.find((ep) => ep.id === falEditEndpoint) || FAL_EDIT_OPTIONS[0] || null,
    [falEditEndpoint]
  );

  const costEstimate = useMemo<CostEstimate | null>(() => {
    const negativePromptMultiplier = negativePrompt.trim() ? 1.02 : 1;
    const guidanceValue = guidanceScale === "" ? null : Number(guidanceScale);
    let guidanceMultiplier = 1;
    if (typeof guidanceValue === "number" && !Number.isNaN(guidanceValue)) {
      if (guidanceValue > 12) guidanceMultiplier = 1.12;
      else if (guidanceValue > 8) guidanceMultiplier = 1.06;
    }
    if (provider === "openrouter") {
      const model = selectedOpenrouterModel;
      if (!model) return null;
      const baseCost = model.cost[mode];
      const aspectMultiplier = aspectRatio && aspectRatio !== "" && aspectRatio !== "1:1" ? 1.08 : 1;
      const total = baseCost * aspectMultiplier * guidanceMultiplier * negativePromptMultiplier;
      const breakdownParts = [
        `${currencyFormatter.format(baseCost)} ${mode === "generate" ? "base cost" : "edit base cost"}`,
      ];
      if (aspectMultiplier > 1) breakdownParts.push("aspect ratio adjustment (+8%)");
      if (guidanceMultiplier > 1)
        breakdownParts.push(`guidance scale adjustment (+${Math.round((guidanceMultiplier - 1) * 100)}%)`);
      if (negativePromptMultiplier > 1) breakdownParts.push("negative prompt parsing (+2%)");
      return {
        total,
        breakdown: `${breakdownParts.join(" + ")} via ${model.label}`,
        note: "Estimate recalculates automatically while you update OpenRouter settings.",
      };
    }
    if (provider === "fal") {
      const endpoint = mode === "generate" ? selectedFalGenerateEndpoint : selectedFalEditEndpoint;
      if (!endpoint) return null;
      const imageCount = Math.max(1, Number(numImages) || 1);
      let perImage = endpoint.costPerImage * guidanceMultiplier * negativePromptMultiplier;
      const total = perImage * imageCount;
      const breakdown = `${imageCount} x ${currencyFormatter.format(perImage)} via ${endpoint.label}`;
      let note: string | undefined;
      if (guidanceMultiplier > 1) note = "Higher guidance scales can extend runtime, so a small buffer is included.";
      else if (negativePromptMultiplier > 1) note = "Negative prompts add minimal cost for safety filtering.";
      return { total, breakdown, note };
    }
    return null;
  }, [
    provider,
    mode,
    selectedOpenrouterModel,
    selectedFalGenerateEndpoint,
    selectedFalEditEndpoint,
    aspectRatio,
    numImages,
    guidanceScale,
    negativePrompt,
  ]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    onResults([], null);

    if (!prompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }

    try {
      setLoading(true);
      const controller = new AbortController();
      setAbortController(controller);
      onLog(`Starting request: provider=${provider}, mode=${mode}`);

      if (provider === "openrouter") {
        if (mode === "generate") {
          onLog(
            `OpenRouter: sending generate request (model=${openrouterModel}, aspectRatio=${aspectRatio || "default"})`
          );
          const { images, raw } = await orGenerate({
            model: openrouterModel,
            prompt,
            aspectRatio,
            signal: controller.signal,
          });
          onResults(images, raw);
          onLog(`OpenRouter: response received with ${images.length} image(s)`);
        } else {
          let payload: { imageUrl?: string; imageBase64?: string; mimeType?: string } = {};
          if (imageFile) {
            onLog(`OpenRouter: reading uploaded file for edit`);
            const { base64, mimeType } = await fileToBase64(imageFile);
            payload.imageBase64 = base64;
            payload.mimeType = mimeType;
          } else if (imageUrl) {
            onLog(`OpenRouter: using provided image URL for edit`);
            payload.imageUrl = imageUrl;
          } else {
            setError("Please upload an image file or provide an image URL for editing.");
            onLog(`OpenRouter: edit aborted - no image file or URL provided`);
            return;
          }
          onLog(`OpenRouter: sending edit request (model=${openrouterModel})`);
          const { images, raw } = await orEdit({
            model: openrouterModel,
            prompt,
            ...payload,
            signal: controller.signal,
          });
          onResults(images, raw);
          onLog(`OpenRouter: response received with ${images.length} image(s)`);
        }
      } else if (provider === "fal") {
        if (mode === "generate") {
          onLog(`FAL.ai: streaming generate request (endpoint=${falGenerateEndpoint})`);
          // Prime status for UX
          fal.setStatus("queued");
          fal.setProgress((p) => (p < 10 ? 10 : p));
          const { images, raw } = await fal.streamGenerate(
            {
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
            },
            controller.signal
          );
          onResults(images, raw);
          notify("success", `FAL.ai: generated ${images.length} image(s)`);
        } else {
          let imageBase64: string | undefined;
          let mimeType: string | undefined;
          if (imageFile) {
            onLog(`FAL.ai: reading uploaded file for edit`);
            const fileData = await fileToBase64(imageFile);
            imageBase64 = fileData.base64;
            mimeType = fileData.mimeType;
          }
          if (!imageBase64 && !imageUrl) {
            setError("Please upload an image file or provide an image URL for editing.");
            onLog(`FAL.ai: edit aborted - no image file or URL provided`);
            return;
          }
          onLog(`FAL.ai: streaming edit request (endpoint=${falEditEndpoint})`);
          fal.setStatus("queued");
          fal.setProgress((p) => (p < 10 ? 10 : p));
          const { images, raw } = await fal.streamEdit(
            {
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
            },
            controller.signal
          );
          onResults(images, raw);
          notify("success", `FAL.ai: edited ${images.length} image(s)`);
        }
      }
    } catch (err: any) {
      if (err?.name === "AbortError") {
        setError(null);
        notify("info", "Request cancelled");
        onLog("Request cancelled by user");
      } else {
        setError(err?.message || "Something went wrong.");
        onLog(`Error: ${err?.message || String(err)}`);
        notify("error", err?.message || "Request failed");
      }
    } finally {
      setLoading(false);
      setAbortController(null);
      onLog(`Request finished`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-6 shadow-sm transition-colors">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value as Provider)}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
          >
            <option value="openrouter">OpenRouter</option>
            <option value="fal">FAL.ai</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Operation</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as Mode)}
            className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
          >
            <option value="generate">Generate</option>
            <option value="edit">Edit</option>
          </select>
        </div>
      </div>

      {provider === "openrouter" && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
            <select
              value={openrouterModel}
              onChange={(e) => setOpenrouterModel(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
            >
              {OPENROUTER_MODEL_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            {selectedOpenrouterModel && (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{selectedOpenrouterModel.description}</p>
            )}
          </div>
          {mode === "generate" && (
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Aspect Ratio</label>
              <select
                value={aspectRatio || ""}
                onChange={(e) => setAspectRatio((e.target.value as AspectRatio) || "")}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
              >
                <option value="">Default (1:1)</option>
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
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {mode === "generate" ? (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Endpoint</label>
                <select
                  value={falGenerateEndpoint}
                  onChange={(e) => setFalGenerateEndpoint(e.target.value)}
                  title={selectedFalGenerateEndpoint?.description || undefined}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
                >
                  {FAL_GENERATE_OPTIONS.map((ep) => (
                    <option key={ep.id} value={ep.id} title={ep.description}>
                      {ep.label}
                    </option>
                  ))}
                </select>
                {selectedFalGenerateEndpoint && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{selectedFalGenerateEndpoint.description}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Endpoint</label>
                <select
                  value={falEditEndpoint}
                  onChange={(e) => setFalEditEndpoint(e.target.value)}
                  title={selectedFalEditEndpoint?.description || undefined}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
                >
                  {FAL_EDIT_OPTIONS.map((ep) => (
                    <option key={ep.id} value={ep.id} title={ep.description}>
                      {ep.label}
                    </option>
                  ))}
                </select>
                {selectedFalEditEndpoint && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{selectedFalEditEndpoint.description}</p>
                )}
              </div>
            )}
          </div>
          <details className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-4 transition-colors">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">Advanced FAL.ai Settings</summary>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Number of Images</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={numImages}
                  onChange={(e) => setNumImages(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">FAL endpoints support multiple outputs; limits vary by endpoint.</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Guidance Scale</label>
                <input
                  type="number"
                  placeholder="e.g. 7"
                  value={guidanceScale === "" ? "" : guidanceScale}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") setGuidanceScale("");
                    else setGuidanceScale(Number(v));
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Negative Prompt</label>
                <textarea
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="Describe what to avoid in the image (FAL only)"
                  rows={2}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Seed</label>
                <input
                  type="number"
                  placeholder="optional"
                  value={seed === "" ? "" : seed}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "") setSeed("");
                    else setSeed(Number(v));
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
                />
              </div>
            </div>
          </details>
        </div>
      )}

      <div className="mt-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image or the edit you want..."
          rows={3}
          className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
        />
      </div>

      {mode === "edit" && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Image (for edit mode only)</label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              disabled={Boolean(imageUrl)}
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setImageFile(file);
                if (file) setImageUrl("");
              }}
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            />
            {imagePreviewUrl && (
              <div className="mt-3 overflow-hidden rounded-md border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900">
                <img src={imagePreviewUrl} alt="Uploaded preview" className="h-48 w-full object-cover" />
                <div className="flex items-center justify-between gap-3 px-3 py-2">
                  <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{imageFile?.name || "Uploaded image"}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImageUrl("");
                      setImagePreviewUrl((prev) => {
                        if (prev) URL.revokeObjectURL(prev);
                        return null;
                      });
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="text-xs font-medium text-red-600 dark:text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Or Image URL</label>
            <input
              type="url"
              value={imageUrl}
              disabled={Boolean(imageFile)}
              onChange={(e) => {
                const value = e.target.value;
                setImageUrl(value);
                if (value) setImageFile(null);
              }}
              placeholder="https://example.com/image.jpg"
              className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">If both are provided, file upload takes precedence.</p>
          </div>
        </div>
      )}

      {costEstimate && (
        <div className="mt-4 rounded-md border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/40 p-3 text-sm text-blue-900 dark:text-blue-200">
          <div className="flex items-center justify-between">
            <span className="font-medium">Estimated cost</span>
            <span className="font-semibold">{currencyFormatter.format(costEstimate.total)}</span>
          </div>
          <p className="mt-1 text-xs text-blue-800 dark:text-blue-300">{costEstimate.breakdown}</p>
          {costEstimate.note && <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">{costEstimate.note}</p>}
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-3 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
          <span>
            Status: {requestStatus === "idle" ? "Idle" : requestStatus === "queued" ? "Queued" : requestStatus === "running" ? "Running" : requestStatus === "completed" ? "Completed" : "Error"}
          </span>
          <span>{progress}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded bg-gray-200 dark:bg-gray-800">
          <div className="h-2 rounded bg-gray-900 dark:bg-gray-100 transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-md bg-gray-900 dark:bg-gray-100 px-4 py-2 text-white dark:text-gray-900 shadow-sm hover:bg-gray-800 dark:hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          {loading && <img src="/loading.svg" alt="Loading" className="inline-block h-5 w-5 text-current" />}
          <span>{mode === "generate" ? "Generate" : "Apply Edit"}</span>
        </button>
        <button
          type="button"
          onClick={onCancelRequest}
          disabled={!loading}
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          Cancel Request
        </button>
        <button
          type="button"
          onClick={() => {
            onResetResults();
            setError(null);
            fal.reset();
          }}
          className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-4 py-2 text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
        >
          Reset Results
        </button>
      </div>
    </form>
  );
}
