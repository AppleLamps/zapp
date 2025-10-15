"use client";

import { useLocalSettings } from "../../hooks/useLocalSettings";
import { OPENROUTER_MODELS, FAL_GENERATE_ENDPOINTS, FAL_EDIT_ENDPOINTS } from "../../lib/models";
import { ASPECT_RATIOS } from "../../lib/types";

export default function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useLocalSettings();

  const MIN_IMAGES = 1;
  const MAX_IMAGES = 6;
  const GUIDANCE_MIN = 0;
  const GUIDANCE_MAX = 20;
  const isGuidanceInvalid =
    settings.guidanceScaleDefault !== "" &&
    (Number(settings.guidanceScaleDefault) < GUIDANCE_MIN || Number(settings.guidanceScaleDefault) > GUIDANCE_MAX);
  const isNumImagesInvalid = settings.numImagesDefault < MIN_IMAGES || settings.numImagesDefault > MAX_IMAGES;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={resetSettings}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
              title="Reset all settings to the default values"
            >
              Reset to defaults
            </button>
            <a href="/" className="text-sm text-blue-600 hover:underline">Back to Home</a>
          </div>
        </div>
        <p className="mt-2 text-gray-600">Configure default provider, operation, models/endpoints, parameters, and debugging preferences. These settings persist in your browser.</p>

        <form className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Default Provider</label>
              <select
                value={settings.providerDefault}
                onChange={(e) => updateSettings({ providerDefault: e.target.value as any })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="fal">FAL.ai</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Default Operation</label>
              <select
                value={settings.modeDefault}
                onChange={(e) => updateSettings({ modeDefault: e.target.value as any })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2"
              >
                <option value="generate">Generate</option>
                <option value="edit">Edit</option>
              </select>
            </div>
          </div>

          {/* OpenRouter defaults */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">OpenRouter Model (default)</label>
              <select
                value={settings.openrouterModelDefault}
                onChange={(e) => updateSettings({ openrouterModelDefault: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2"
              >
                {OPENROUTER_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Aspect Ratio (default for generate)</label>
              <select
                value={settings.aspectRatioDefault}
                onChange={(e) => updateSettings({ aspectRatioDefault: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2"
              >
                <option value="">Default</option>
                {ASPECT_RATIOS.map((ar) => (
                  <option key={ar} value={ar}>{ar}</option>
                ))}
              </select>
            </div>
          </div>

          {/* FAL defaults */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-gray-700">FAL Generate Endpoint (default)</label>
              <select
                value={settings.falGenerateEndpointDefault}
                onChange={(e) => updateSettings({ falGenerateEndpointDefault: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2"
              >
                {FAL_GENERATE_ENDPOINTS.map((ep) => (
                  <option key={ep.id} value={ep.id}>{ep.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">FAL Edit Endpoint (default)</label>
              <select
                value={settings.falEditEndpointDefault}
                onChange={(e) => updateSettings({ falEditEndpointDefault: e.target.value })}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2"
              >
                {FAL_EDIT_ENDPOINTS.map((ep) => (
                  <option key={ep.id} value={ep.id}>{ep.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Number of Images (default)</label>
              <input
                type="number"
                min={MIN_IMAGES}
                max={MAX_IMAGES}
                value={settings.numImagesDefault}
                onChange={(e) => {
                  const v = Math.max(MIN_IMAGES, Math.min(MAX_IMAGES, Number(e.target.value) || MIN_IMAGES));
                  updateSettings({ numImagesDefault: v });
                }}
                aria-invalid={isNumImagesInvalid}
                className={`mt-1 w-full rounded-md border bg-white p-2 ${isNumImagesInvalid ? "border-red-500" : "border-gray-300"}`}
              />
              <p className="mt-1 text-xs text-gray-500">Allowed range: {MIN_IMAGES}–{MAX_IMAGES}. Higher values may increase latency and cost.</p>
              {isNumImagesInvalid && (
                <p className="mt-1 text-xs text-red-600">Please enter a value between {MIN_IMAGES} and {MAX_IMAGES}.</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Guidance Scale (default)</label>
              <input
                type="number"
                placeholder="e.g. 7"
                value={settings.guidanceScaleDefault === "" ? "" : String(settings.guidanceScaleDefault)}
                onChange={(e) => {
                  const v = e.target.value;
                  updateSettings({ guidanceScaleDefault: v === "" ? "" : Number(v) });
                }}
                min={GUIDANCE_MIN}
                max={GUIDANCE_MAX}
                step={0.1}
                aria-invalid={isGuidanceInvalid}
                className={`mt-1 w-full rounded-md border bg-white p-2 ${isGuidanceInvalid ? "border-red-500" : "border-gray-300"}`}
              />
              <p className="mt-1 text-xs text-gray-500">Leave blank to use model default. Typical range is {GUIDANCE_MIN}–{GUIDANCE_MAX}. Higher values can improve adherence to the prompt but may reduce creativity.</p>
              {isGuidanceInvalid && (
                <p className="mt-1 text-xs text-red-600">Please enter a value between {GUIDANCE_MIN} and {GUIDANCE_MAX}, or leave blank.</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Seed (default)</label>
              <input
                type="number"
                placeholder="optional"
                value={settings.seedDefault === "" ? "" : String(settings.seedDefault)}
                onChange={(e) => {
                  const v = e.target.value;
                  updateSettings({ seedDefault: v === "" ? "" : Number(v) });
                }}
                className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2"
              />
              <p className="mt-1 text-xs text-gray-500">Leave blank for randomization. Use an integer for reproducible results (e.g., 12345).</p>
            </div>
          </div>

          {/* Debugging preferences */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showRawByDefault}
                onChange={(e) => updateSettings({ showRawByDefault: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Show Raw Response by default</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.showLogsByDefault}
                onChange={(e) => updateSettings({ showLogsByDefault: e.target.checked })}
              />
              <span className="text-sm text-gray-700">Show Logs by default</span>
            </label>
          </div>
        </form>
      </section>
    </main>
  );
}