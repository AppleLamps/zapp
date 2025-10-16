"use client";

import Masonry from "react-masonry-css";
import { useState } from "react";
import { useImageOperations } from "@/hooks/useImageOperations";
import { useAppStore } from "@/store/appStore";

export function Results() {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { images, loading, addToast, addLog } = useAppStore();
  const { copiedIndex, copyImage, downloadImage, copySelected, downloadSelected, downloadSelectedZip } =
    useImageOperations();

  function toggleSelect(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(images.map((_, i) => i)));
  }

  async function handleCopySelected() {
    const count = await copySelected(images, selected);
    addToast("success", `Copied ${count} image(s) to clipboard`);
    addLog(`Copied ${count} image(s) to clipboard`);
  }

  async function handleDownloadSelected() {
    const count = await downloadSelected(images, selected);
    addToast("success", `Downloaded ${count} image(s)`);
    addLog(`Downloaded ${count} image(s)`);
  }

  async function handleDownloadSelectedZip() {
    try {
      const count = await downloadSelectedZip(images, selected);
      addToast("success", `Downloaded ${count} image(s) as ZIP`);
      addLog("Downloaded selected images as ZIP");
    } catch (e: unknown) {
      const error = e instanceof Error ? e : new Error(String(e));
      const msg = error.message || "Failed to create ZIP. Try downloading selected images individually.";
      addToast("error", msg);
      addLog(`ZIP download failed: ${msg}`);
    }
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold">Results</h2>
      {images.length > 0 ? (
        <>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <button
              onClick={selectAll}
              type="button"
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Select all
            </button>
            <button
              onClick={() => setSelected(new Set())}
              type="button"
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Clear Selection
            </button>
            <button
              onClick={handleCopySelected}
              type="button"
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Copy selected
            </button>
            <button
              onClick={handleDownloadSelected}
              type="button"
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Download selected
            </button>
            <button
              onClick={handleDownloadSelectedZip}
              type="button"
              className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
            >
              Download selected as ZIP
            </button>
            <span className="text-xs text-gray-500 dark:text-gray-400">Selected: {selected.size}</span>
          </div>
          <Masonry
            breakpointCols={{ default: 3, 1024: 2, 640: 1 }}
            className="flex -ml-4 mt-4 w-auto"
            columnClassName="pl-4 bg-clip-padding"
          >
            {images.map((src, idx) => (
              <div
                key={idx}
                className={`mb-4 relative overflow-hidden rounded-lg border ${selected.has(idx)
                  ? "border-gray-900 dark:border-gray-100 ring-2 ring-gray-900 dark:ring-gray-100"
                  : "border-gray-200 dark:border-gray-800"
                  } bg-white dark:bg-neutral-900 transition-all cursor-pointer hover:shadow-lg`}
                onClick={() => toggleSelect(idx)}
              >
                <img src={src} alt={`Result ${idx + 1}`} className="w-full h-auto object-cover" />
                {selected.has(idx) && (
                  <div className="pointer-events-none absolute left-2 top-2 rounded bg-gray-900 dark:bg-gray-100 px-2 py-1 text-xs text-white dark:text-gray-900">
                    Selected
                  </div>
                )}
                <div className="flex items-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyImage(src, idx);
                    }}
                    className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    {copiedIndex === idx ? "Copied!" : "Copy image"}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadImage(src, idx);
                    }}
                    className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Download
                  </button>
                </div>
              </div>
            ))}
          </Masonry>
        </>
      ) : loading ? (
        <div className="mt-6 flex h-48 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-neutral-950 text-gray-700 dark:text-gray-300">
          <img src="/loading.svg" alt="Loading" className="h-10 w-10" />
          <p className="text-sm font-medium">Generating your images...</p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">No images yet. Run a prompt to see results here.</p>
      )}
    </div>
  );
}

