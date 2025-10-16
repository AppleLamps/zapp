"use client";

import { useEffect } from "react";
import { loadSettings } from "@/hooks/useLocalSettings";
import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import type { Provider, Mode } from "@/lib/types";
import { GenerationForm } from "@/components/GenerationForm";
import { Results } from "@/components/Results";
import { History } from "@/components/History";
import { useAppStore, type AspectRatio } from "@/store/appStore";

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const {
    setProvider,
    setMode,
    setPrompt,
    rawResponse,
    logs,
    toasts,
    openRawByDefault,
    openLogsByDefault,
    addToast,
    addLog,
    loadSettings: storeLoadSettings,
  } = useAppStore();

  useEffect(() => {
    const s = loadSettings();
    storeLoadSettings({
      provider: (s.providerDefault || "openrouter") as Provider,
      mode: (s.modeDefault || "generate") as Mode,
      openrouterModel: s.openrouterModelDefault,
      aspectRatio: s.aspectRatioDefault as AspectRatio,
      falGenerateEndpoint: s.falGenerateEndpointDefault,
      falEditEndpoint: s.falEditEndpointDefault,
      numImages: s.numImagesDefault,
      guidanceScale: s.guidanceScaleDefault === "" ? "" : Number(s.guidanceScaleDefault),
      seed: s.seedDefault === "" ? "" : Number(s.seedDefault),
      openLogsByDefault: s.showLogsByDefault,
      openRawByDefault: s.showRawByDefault,
    });
  }, [storeLoadSettings]);

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
      // Note: model/endpoint updates handled through store setters
    }
    if (item.provider === "fal") {
      if (item.mode === "generate") {
        useAppStore.setState({ falGenerateEndpoint: item.model_or_endpoint });
      } else {
        useAppStore.setState({ falEditEndpoint: item.model_or_endpoint });
      }
    } else {
      useAppStore.setState({ openrouterModel: item.model_or_endpoint });
    }
    useAppStore.setState({
      images: Array.isArray(item.result_urls) ? item.result_urls : [],
      error: null,
      rawResponse: null,
      logs: [],
      imageFile: null,
      imageUrl: "",
    });
    addToast("info", "Loaded history settings. Review and run when ready.");
    addLog(`Loaded history item ${item.id} for rerun`);
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

        <GenerationForm />

        <Results />

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
              className={`rounded-lg px-4 py-2 text-sm shadow-lg ${t.type === "success"
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

