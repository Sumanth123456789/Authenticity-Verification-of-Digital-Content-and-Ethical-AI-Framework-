import { useEffect, useState } from "react";

/** Returns true only after client-side hydration completes. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}