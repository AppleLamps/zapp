"use client";

import { useEffect, useMemo, useState } from "react";
import type { Provider, Mode } from "@/lib/types";

export type HistoryItem = {
  id: number;
  created_at: string;
  provider: Provider;
  mode: Mode;
  model_or_endpoint: string;
  prompt: string;
  result_urls?: string[] | null;
};

export function useHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [providerFilter, setProviderFilter] = useState<"all" | Provider>("all");
  const [modeFilter, setModeFilter] = useState<"all" | Mode>("all");

  async function refresh() {
    try {
      setError(null);
      setLoading(true);
      const res = await fetch("/api/history");
      if (!res.ok) throw new Error("Failed to load history");
      const data = await res.json();
      const items = Array.isArray(data?.data) ? data.data : [];
      setHistory(
        items.map((item: any) => ({
          id: item.id,
          created_at: item.created_at,
          provider: item.provider as Provider,
          mode: item.mode as Mode,
          model_or_endpoint: item.model_or_endpoint,
          prompt: item.prompt,
          result_urls: item.result_urls ?? [],
        }))
      );
    } catch (err: any) {
      setError(err?.message || "Unable to load history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return history.filter((item) => {
      if (providerFilter !== "all" && item.provider !== providerFilter) return false;
      if (modeFilter !== "all" && item.mode !== modeFilter) return false;
      if (!query) return true;
      const haystack = [item.prompt, item.model_or_endpoint, item.provider, item.mode]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [history, search, providerFilter, modeFilter]);

  const filtersActive = search.trim() !== "" || providerFilter !== "all" || modeFilter !== "all";

  return {
    history,
    filteredHistory: filtered,
    loading,
    error,
    search,
    setSearch,
    providerFilter,
    setProviderFilter,
    modeFilter,
    setModeFilter,
    filtersActive,
    refresh,
  };
}

