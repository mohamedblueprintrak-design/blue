"use client";

import { useEffect } from "react";
import { initCsrfFetch } from "@/lib/api/csrf-fetch";

/**
 * CSRF Provider Component
 * Initializes the global fetch wrapper to automatically include
 * CSRF tokens on all mutation requests.
 *
 * Must be rendered on the client side, inside the root layout.
 * Place it as high as possible in the component tree.
 */
export function CsrfProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initCsrfFetch();
  }, []);

  return <>{children}</>;
}
