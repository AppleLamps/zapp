export type Provider = "openrouter" | "fal";
export type Mode = "generate" | "edit";

export const ASPECT_RATIOS = [
  "1:1",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "2:3",
  "3:2",
  "4:5",
  "5:4",
  "21:9",
] as const;