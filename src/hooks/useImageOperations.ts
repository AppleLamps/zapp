"use client";

import { useEffect, useRef, useState } from "react";
import JSZip from "jszip";

export function useImageOperations() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) clearTimeout(copyResetRef.current);
    };
  }, []);

  function extFromMime(type: string) {
    if (!type) return "png";
    const t = type.toLowerCase();
    if (t.includes("png")) return "png";
    if (t.includes("jpeg") || t.includes("jpg")) return "jpg";
    if (t.includes("webp")) return "webp";
    if (t.includes("gif")) return "gif";
    return "png";
  }

  async function copyImage(src: string, idx?: number) {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      // @ts-ignore ClipboardItem may be missing in TS lib
      await navigator.clipboard.write([
        // @ts-ignore
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      if (typeof idx === "number") {
        setCopiedIndex(idx);
        if (copyResetRef.current) clearTimeout(copyResetRef.current);
        copyResetRef.current = setTimeout(() => {
          setCopiedIndex(null);
          copyResetRef.current = null;
        }, 2000);
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async function downloadImage(src: string, idx: number) {
    const response = await fetch(src);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `image-${idx + 1}.${extFromMime(blob.type)}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function copySelected(images: string[], selected: Set<number>) {
    if (selected.size === 0) return 0;
    let count = 0;
    for (const idx of selected) {
      const success = await copyImage(images[idx], idx);
      if (success) count++;
    }
    return count;
  }

  async function downloadSelected(images: string[], selected: Set<number>) {
    if (selected.size === 0) return 0;
    let count = 0;
    for (const idx of selected) {
      await downloadImage(images[idx], idx);
      count++;
    }
    return count;
  }

  async function downloadSelectedZip(images: string[], selected: Set<number>) {
    if (selected.size === 0) return 0;
    const zip = new JSZip();
    let count = 0;
    for (const idx of selected) {
      const src = images[idx];
      const response = await fetch(src);
      const blob = await response.blob();
      const ext = extFromMime(blob.type);
      const arrayBuffer = await blob.arrayBuffer();
      zip.file(`image-${idx + 1}.${ext}`, arrayBuffer);
      count++;
    }
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `images-${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return count;
  }

  async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    const mimeType = file.type || "image/png";
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] || result;
        resolve({ base64, mimeType });
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  return {
    copiedIndex,
    setCopiedIndex,
    copyImage,
    downloadImage,
    copySelected,
    downloadSelected,
    downloadSelectedZip,
    fileToBase64,
  };
}

