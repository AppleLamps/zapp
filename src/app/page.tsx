"use client";

import { useEffect, useState } from "react";
import { loadSettings } from "@/hooks/useLocalSettings";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import type { Provider, Mode } from "@/lib/types";
import { ASPECT_RATIOS } from "@/lib/types";
import { GenerationForm } from "@/components/GenerationForm";
import { Results } from "@/components/Results";
import { History } from "@/components/History";

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const [provider, setProvider] = useState<Provider>("openrouter");
  const [mode, setMode] = useState<Mode>("generate");
  const [prompt, setPrompt] = useState("");
  const [openrouterModel, setOpenrouterModel] = useState<string>(
    "google/gemini-2.5-flash-image-preview"
  );
  const [aspectRatio, setAspectRatio] = useState<(typeof ASPECT_RATIOS)[number] | "">("");
  const [falGenerateEndpoint, setFalGenerateEndpoint] = useState<string>("fal-ai/flux/dev");
  const [falEditEndpoint, setFalEditEndpoint] = useState<string>("fal-ai/flux-pro/kontext/max");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [rawResponse, setRawResponse] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [requestStatus, setRequestStatus] = useState<"idle" | "queued" | "running" | "completed" | "error">(
    "idle"
  );
  const [progress, setProgress] = useState<number>(0);
  const [toasts, setToasts] = useState<
    Array<{ id: number; type: "success" | "error" | "info"; message: string }>
  >([]);
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
    setLogs((prev) => [...prev, `${ts} - ${message}`]);
  }

  function showToast(type: "success" | "error" | "info", message: string) {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }

  function handleHistoryRerun(item: {
    id: number;
    provider: Provider;
    mode: Mode;
    prompt: string;
    model_or_endpoint: string;
    result_urls?: string[] | null;
  }) {
    setProvider(item.provider);
    setMode(item.mode);
    setPrompt(item.prompt);
    if (item.provider === "openrouter") {
      setOpenrouterModel(item.model_or_endpoint);
    } else {
      if (item.mode === "generate") setFalGenerateEndpoint(item.model_or_endpoint);
      else setFalEditEndpoint(item.model_or_endpoint);
    }
    setImages(Array.isArray(item.result_urls) ? item.result_urls : []);
    setError(null);
    setRawResponse(null);
    setLogs([]);
    setImageFile(null);
    setImageUrl("");
    showToast("info", "Loaded history settings. Review and run when ready.");
    log(`Loaded history item ${item.id} for rerun`);
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
    <main className="min-h-screen bg-gray-50 text-gray-900 dark:bg-neutral-950 dark:text-gray-100 transition-colors">
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">AI Image Studio</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <a href="/settings" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Settings
            </a>
          </div>
        </div>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Create and edit images using OpenRouter and FAL.ai. Select provider, operation, enter a prompt, and optionally upload an image.
        </p>

        <GenerationForm
          provider={provider}
          setProvider={(v) => setProvider(v)}
          mode={mode}
          setMode={(v) => setMode(v)}
          openrouterModel={openrouterModel}
          setOpenrouterModel={setOpenrouterModel}
          aspectRatio={aspectRatio}
          setAspectRatio={setAspectRatio}
          falGenerateEndpoint={falGenerateEndpoint}
          setFalGenerateEndpoint={setFalGenerateEndpoint}
          falEditEndpoint={falEditEndpoint}
          setFalEditEndpoint={setFalEditEndpoint}
          numImages={numImages}
          setNumImages={setNumImages}
          guidanceScale={guidanceScale}
          setGuidanceScale={setGuidanceScale}
          seed={seed}
          setSeed={setSeed}
          negativePrompt={negativePrompt}
          setNegativePrompt={setNegativePrompt}
          prompt={prompt}
          setPrompt={setPrompt}
          imageFile={imageFile}
          setImageFile={setImageFile}
          imageUrl={imageUrl}
          setImageUrl={setImageUrl}
          loading={loading}
          setLoading={setLoading}
          error={error}
          setError={setError}
          requestStatus={requestStatus}
          setRequestStatus={setRequestStatus}
          progress={progress}
          setProgress={setProgress}
          abortController={abortController}
          setAbortController={setAbortController}
          onResults={(imgs, raw) => {
            setImages(imgs);
            setRawResponse(raw);
          }}
          onResetResults={() => {
            setImages([]);
            setRawResponse(null);
            setLogs([]);
          }}
          onCancelRequest={cancelRequest}
          onLog={log}
          notify={showToast}
        />

        <Results images={images} loading={loading} notify={showToast} onLog={log} />

        <History onRerun={handleHistoryRerun} />

        {rawResponse && (
          <div className="mt-8">
            <details
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-4 transition-colors"
              open={openRawByDefault}
            >
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                View Raw Response (Debug)
              </summary>
              <pre className="mt-3 overflow-auto rounded bg-gray-50 dark:bg-neutral-950 p-3 text-xs text-gray-800 dark:text-gray-300">{JSON.stringify(rawResponse, null, 2)}</pre>
            </details>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-8">
            <details
              className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-4 transition-colors"
              open={openLogsByDefault}
            >
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                Request Logs
              </summary>
              <div className="mt-3 space-y-1 text-sm text-gray-800 dark:text-gray-300">
                {logs.map((l, i) => (
                  <div key={i} className="rounded bg-gray-50 dark:bg-neutral-950 p-2">
                    {l}
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        <div className="fixed right-4 top-4 z-50 space-y-2">
          {toasts.map((t) => (
            <div
              key={t.id}
              className={`rounded-lg px-4 py-2 text-sm shadow-lg ${
                t.type === "success"
                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900"
                  : t.type === "error"
                  ? "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900"
                  : "bg-gray-50 dark:bg-neutral-900 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-800"
              }`}
            >
              {t.message}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

