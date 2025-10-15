"use client";

import { useCallback, useState } from "react";

export type FalStatus = "idle" | "queued" | "running" | "completed" | "error";

export function useFal() {
  const [status, setStatus] = useState<FalStatus>("idle");
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);

  const log = useCallback((message: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev, `${ts} - ${message}`]);
  }, []);

  const setPhaseQueued = useCallback(() => {
    setStatus("queued");
    setProgress((p) => (p < 10 ? 10 : p));
  }, []);

  const setPhaseRunning = useCallback(() => {
    setStatus("running");
    setProgress((p) => (p < 60 ? 60 : p));
  }, []);

  const setPhaseCompleted = useCallback(() => {
    setStatus("completed");
    setProgress(100);
  }, []);

  const setPhaseError = useCallback(() => {
    setStatus("error");
    setProgress(0);
  }, []);

  function reset() {
    setStatus("idle");
    setProgress(0);
    setLogs([]);
  }

  async function streamGenerate(
    payload: { endpoint: string; prompt: string; params?: Record<string, any> },
    signal?: AbortSignal
  ): Promise<{ images: string[]; raw: any }> {
    const res = await fetch("/api/fal/generate/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        data?.error ||
          "FAL.ai generate stream failed. Check your API key, selected endpoint, and network connectivity."
      );
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let images: string[] = [];
    let raw: any = null;
    while (true) {
      if (signal?.aborted) {
        log("FAL.ai: stream aborted by user");
        try {
          await reader.cancel();
        } catch {}
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
        try {
          payload = JSON.parse(dataStr);
        } catch {}
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
          const d = payload?.data;
          const imgs: string[] = [];
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
          images = imgs;
          raw = payload;
        } else if (event === "error") {
          setPhaseError();
          const msg =
            payload?.error ||
            "FAL.ai streaming error. Verify the endpoint is available and your parameters are valid.";
          throw new Error(msg);
        }
      }
    }
    return { images, raw };
  }

  async function streamEdit(
    payload: {
      endpoint: string;
      prompt: string;
      imageUrl?: string;
      imageBase64?: string;
      mimeType?: string;
      params?: Record<string, any>;
    },
    signal?: AbortSignal
  ): Promise<{ images: string[]; raw: any }> {
    const res = await fetch("/api/fal/edit/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok || !res.body) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        data?.error ||
          "FAL.ai edit stream failed. Ensure an image is provided and the endpoint supports edits."
      );
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let images: string[] = [];
    let raw: any = null;
    while (true) {
      if (signal?.aborted) {
        log("FAL.ai: stream aborted by user");
        try {
          await reader.cancel();
        } catch {}
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
        try {
          payload = JSON.parse(dataStr);
        } catch {}
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
          const d = payload?.data;
          const imgs: string[] = [];
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
          images = imgs;
          raw = payload;
        } else if (event === "error") {
          setPhaseError();
          const msg =
            payload?.error ||
            "FAL.ai streaming error. Verify the endpoint is available and your parameters are valid.";
          throw new Error(msg);
        }
      }
    }
    return { images, raw };
  }

  return {
    status,
    progress,
    logs,
    setStatus,
    setProgress,
    setLogs,
    reset,
    streamGenerate,
    streamEdit,
  };
}

