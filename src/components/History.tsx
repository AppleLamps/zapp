"use client";

import { useHistory } from "@/hooks/useHistory";
import type { Provider, Mode } from "@/lib/types";

export type HistoryProps = {
  onRerun: (item: {
    id: number;
    provider: Provider;
    mode: Mode;
    prompt: string;
    model_or_endpoint: string;
    result_urls?: string[] | null;
  }) => void;
};

export function History({ onRerun }: HistoryProps) {
  const {
    history,
    filteredHistory,
    loading,
    error,
    search,
    setSearch,
    providerFilter,
    setProviderFilter,
    modeFilter,
    setModeFilter,
    filtersActive,
  } = useHistory();

  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold">History</h2>
      {loading ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading your recent runs...</p>
      ) : error ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">Could not load history: {error}</p>
      ) : history.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No history yet. Generate something to build your timeline.</p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <label htmlFor="history-search-input" className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Search history</label>
              <input
                id="history-search-input"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search prompt, model, or endpoint"
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label htmlFor="history-provider-filter" className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Provider</label>
              <select
                id="history-provider-filter"
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value as "all" | Provider)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
              >
                <option value="all">All providers</option>
                <option value="openrouter">OpenRouter</option>
                <option value="fal">FAL.ai</option>
              </select>
            </div>
            <div>
              <label htmlFor="history-mode-filter" className="text-xs font-medium uppercase tracking-wide text-gray-600 dark:text-gray-400">Operation</label>
              <select
                id="history-mode-filter"
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as "all" | Mode)}
                className="mt-1 w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-gray-500 dark:focus:border-gray-600 focus:outline-none transition-colors"
              >
                <option value="all">All operations</option>
                <option value="generate">Generate</option>
                <option value="edit">Edit</option>
              </select>
            </div>
            {filtersActive && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setProviderFilter("all");
                    setModeFilter("all");
                  }}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
          <div className="mt-4 space-y-4">
            {filteredHistory.map((item) => (
              <div key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-neutral-900 p-4 transition-colors">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{item.prompt}</p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {item.provider === "fal" ? "FAL.ai" : "OpenRouter"} • {item.mode === "edit" ? "Edit" : "Generate"} • {item.model_or_endpoint}
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRerun(item)}
                    className="self-start rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors"
                  >
                    Re-run
                  </button>
                </div>
                {item.result_urls && item.result_urls.length > 0 && (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {item.result_urls.map((url, idx) => (
                      <img
                        key={`${item.id}-${idx}`}
                        src={url}
                        alt={`History ${item.id} result ${idx + 1}`}
                        className="h-24 w-full rounded-md object-cover"
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

