export function getApiBase(): string {
  // Prefer Vite env, fallback to localhost
  const fromEnv = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  return fromEnv && typeof fromEnv === "string" && fromEnv.length > 0
    ? fromEnv.replace(/\/$/, "")
    : "http://127.0.0.1:8000";
}

