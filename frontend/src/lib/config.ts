export function getApiBase(): string {
  // Prefer Vite env, fallback to localhost
  const fromEnv = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  return fromEnv && typeof fromEnv === "string" && fromEnv.length > 0
    ? fromEnv.replace(/\/$/, "")
    : "http://127.0.0.1:8000";
}

export function getHotspotThreshold(): number {
  const raw = (import.meta as any).env?.VITE_HOTSPOT_THRESHOLD as string | undefined;
  const value = raw ? Number(raw) : NaN;
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(Math.max(value, 0), 1);
}

