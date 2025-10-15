import { getSql } from "./db";

export type HistoryRecord = {
  user_id?: string | null;
  provider: string;
  mode: string;
  model_or_endpoint: string;
  prompt: string;
  negative_prompt?: string | null;
  guidance_scale?: number | null;
  seed?: number | null;
  num_images?: number | null;
  status: string;
  duration_ms?: number | null;
  ip?: string | null;
  request_id?: string | null;
  raw_response?: any;
  result_urls?: string[] | null;
  error?: string | null;
};

export async function saveHistory(record: HistoryRecord) {
  try {
    const sql = getSql();
    const result = await sql`
      INSERT INTO app.history (
        user_id, provider, mode, model_or_endpoint, prompt, negative_prompt, guidance_scale, seed,
        num_images, status, duration_ms, ip, request_id, raw_response, result_urls, error
      ) VALUES (
        ${record.user_id ?? null}, ${record.provider}, ${record.mode}, ${record.model_or_endpoint}, ${record.prompt},
        ${record.negative_prompt ?? null}, ${record.guidance_scale ?? null}, ${record.seed ?? null},
        ${record.num_images ?? null}, ${record.status}, ${record.duration_ms ?? null}, ${record.ip ?? null},
        ${record.request_id ?? null}, ${record.raw_response ?? null}, ${record.result_urls ?? null}, ${record.error ?? null}
      ) RETURNING id;
    `;
    return (result as any)?.[0]?.id ?? null;
  } catch (e) {
    // swallow errors so user requests are not impacted
    return null;
  }
}