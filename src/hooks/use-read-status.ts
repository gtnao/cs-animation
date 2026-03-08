"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "cs-animation-read-status";

export function useReadStatus() {
  const [readMap, setReadMap] = useState<Record<string, boolean>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setReadMap(JSON.parse(stored));
    } catch {
      // ignore
    }
    setIsLoaded(true);
  }, []);

  const toggleRead = useCallback((slug: string) => {
    setReadMap((prev) => {
      const next = { ...prev, [slug]: !prev[slug] };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const readCount = useCallback(
    (slugs: string[]) => slugs.filter((s) => readMap[s]).length,
    [readMap]
  );

  return { readMap, toggleRead, readCount, isLoaded };
}
