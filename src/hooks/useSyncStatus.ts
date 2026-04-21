import { useState, useCallback } from "react";

export type SyncStatus = "idle" | "saving" | "saved" | "offline";

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>("idle");

  const markSaving = useCallback(() => setStatus("saving"), []);
  const markSaved = useCallback(() => {
    setStatus("saved");
    // Reset to idle after 3s
    setTimeout(() => setStatus(prev => prev === "saved" ? "idle" : prev), 3000);
  }, []);
  const markOffline = useCallback(() => setStatus("offline"), []);

  return { syncStatus: status, markSaving, markSaved, markOffline };
}
