"use client";

import { useState, useEffect } from "react";
import type { Provider, Mode } from "../lib/types";

export type AppSettings = {
  providerDefault: Provider;
  modeDefault: Mode;
  openrouterModelDefault: string;
  aspectRatioDefault: string | "";
  falGenerateEndpointDefault: string;
  falEditEndpointDefault: string;
  numImagesDefault: number;
  guidanceScaleDefault: number | "";
  seedDefault: number | "";
  showLogsByDefault: boolean;
  showRawByDefault: boolean;
};

const SETTINGS_KEY = "ai_image_studio_settings";

export const defaultSettings: AppSettings = {
  providerDefault: "openrouter",
  modeDefault: "generate",
  openrouterModelDefault: "google/gemini-2.5-flash-image-preview",
  aspectRatioDefault: "",
  falGenerateEndpointDefault: "fal-ai/flux/dev",
  falEditEndpointDefault: "fal-ai/flux-pro/kontext/max",
  numImagesDefault: 1,
  guidanceScaleDefault: "",
  seedDefault: "",
  showLogsByDefault: false,
  showRawByDefault: false,
};

export function loadSettings(): AppSettings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    const parsed = JSON.parse(raw);
    return { ...defaultSettings, ...parsed } as AppSettings;
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(s: AppSettings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {}
}

export function useLocalSettings() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function updateSettings(patch: Partial<AppSettings>) {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }

  function resetSettings() {
    setSettings(() => {
      saveSettings(defaultSettings);
      return { ...defaultSettings };
    });
  }

  return { settings, updateSettings, resetSettings };
}