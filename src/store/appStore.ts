"use client";

import { create } from "zustand";
import type { Provider, Mode } from "@/lib/types";
import { ASPECT_RATIOS } from "@/lib/types";

export type FalStatus = "idle" | "queued" | "running" | "completed" | "error";
export type AspectRatio = (typeof ASPECT_RATIOS)[number] | "";

export type Toast = {
    id: number;
    type: "success" | "error" | "info";
    message: string;
};

export type AppStore = {
    // Provider and mode settings
    provider: Provider;
    mode: Mode;
    setProvider: (provider: Provider) => void;
    setMode: (mode: Mode) => void;

    // OpenRouter settings
    openrouterModel: string;
    setOpenrouterModel: (model: string) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (ratio: AspectRatio) => void;

    // FAL settings
    falGenerateEndpoint: string;
    setFalGenerateEndpoint: (endpoint: string) => void;
    falEditEndpoint: string;
    setFalEditEndpoint: (endpoint: string) => void;

    // Advanced FAL settings
    numImages: number;
    setNumImages: (num: number) => void;
    guidanceScale: number | "";
    setGuidanceScale: (scale: number | "") => void;
    seed: number | "";
    setSeed: (seed: number | "") => void;
    negativePrompt: string;
    setNegativePrompt: (prompt: string) => void;

    // Prompt and image inputs
    prompt: string;
    setPrompt: (prompt: string) => void;
    imageFile: File | null;
    setImageFile: (file: File | null) => void;
    imageUrl: string;
    setImageUrl: (url: string) => void;

    // Results and response state
    images: string[];
    setImages: (images: string[]) => void;
    rawResponse: Record<string, unknown> | null;
    setRawResponse: (response: Record<string, unknown> | null) => void;    // Request state
    loading: boolean;
    setLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    requestStatus: FalStatus;
    setRequestStatus: (status: FalStatus) => void;
    progress: number;
    setProgress: (progress: number) => void;
    abortController: AbortController | null;
    setAbortController: (controller: AbortController | null) => void;

    // Logging and debug
    logs: string[];
    addLog: (message: string) => void;
    clearLogs: () => void;
    toasts: Toast[];
    addToast: (type: "success" | "error" | "info", message: string) => void;
    removeToast: (id: number) => void;

    // UI preferences
    openRawByDefault: boolean;
    setOpenRawByDefault: (open: boolean) => void;
    openLogsByDefault: boolean;
    setOpenLogsByDefault: (open: boolean) => void;

    // Bulk operations
    resetResults: () => void;
    loadSettings: (settings: Partial<AppStore>) => void;
};

export const useAppStore = create<AppStore>((set) => ({
    // Provider and mode settings
    provider: "openrouter",
    mode: "generate",
    setProvider: (provider) => set({ provider }),
    setMode: (mode) => set({ mode }),

    // OpenRouter settings
    openrouterModel: "google/gemini-2.5-flash-image-preview",
    setOpenrouterModel: (model) => set({ openrouterModel: model }),
    aspectRatio: "",
    setAspectRatio: (ratio) => set({ aspectRatio: ratio }),

    // FAL settings
    falGenerateEndpoint: "fal-ai/flux/dev",
    setFalGenerateEndpoint: (endpoint) => set({ falGenerateEndpoint: endpoint }),
    falEditEndpoint: "fal-ai/flux-pro/kontext/max",
    setFalEditEndpoint: (endpoint) => set({ falEditEndpoint: endpoint }),

    // Advanced FAL settings
    numImages: 1,
    setNumImages: (num) => set({ numImages: num }),
    guidanceScale: "",
    setGuidanceScale: (scale) => set({ guidanceScale: scale }),
    seed: "",
    setSeed: (seed) => set({ seed }),
    negativePrompt: "",
    setNegativePrompt: (prompt) => set({ negativePrompt: prompt }),

    // Prompt and image inputs
    prompt: "",
    setPrompt: (prompt) => set({ prompt }),
    imageFile: null,
    setImageFile: (file) => set({ imageFile: file }),
    imageUrl: "",
    setImageUrl: (url) => set({ imageUrl: url }),

    // Results and response state
    images: [],
    setImages: (images) => set({ images }),
    rawResponse: null,
    setRawResponse: (response) => set({ rawResponse: response }),

    // Request state
    loading: false,
    setLoading: (loading) => set({ loading }),
    error: null,
    setError: (error) => set({ error }),
    requestStatus: "idle",
    setRequestStatus: (status) => set({ requestStatus: status }),
    progress: 0,
    setProgress: (progress) => set({ progress }),
    abortController: null,
    setAbortController: (controller) => set({ abortController: controller }),

    // Logging and debug
    logs: [],
    addLog: (message) =>
        set((state) => {
            const ts = new Date().toLocaleTimeString();
            return { logs: [...state.logs, `${ts} - ${message}`] };
        }),
    clearLogs: () => set({ logs: [] }),
    toasts: [],
    addToast: (type, message) =>
        set((state) => {
            const id = Date.now() + Math.random();
            const newToasts = [...state.toasts, { id, type, message }];
            // Auto-remove toast after 3 seconds
            setTimeout(() => {
                set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
            }, 3000);
            return { toasts: newToasts };
        }),
    removeToast: (id) =>
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

    // UI preferences
    openRawByDefault: false,
    setOpenRawByDefault: (open) => set({ openRawByDefault: open }),
    openLogsByDefault: false,
    setOpenLogsByDefault: (open) => set({ openLogsByDefault: open }),

    // Bulk operations
    resetResults: () =>
        set({
            images: [],
            rawResponse: null,
            logs: [],
            error: null,
            requestStatus: "idle",
            progress: 0,
        }),

    loadSettings: (settings) => set(settings),
}));
