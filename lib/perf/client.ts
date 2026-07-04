"use client";

import { isPerfEnabled, PerfTrace } from "@/lib/perf/trace";
import { useEffect, useRef } from "react";

/** React 컴포넌트 re-render 횟수 (PERF_TRACE=1) */
export function usePerfRenderCount(componentName: string): void {
  const countRef = useRef(0);
  countRef.current += 1;

  useEffect(() => {
    if (!isPerfEnabled()) return;
    console.log(`[Render] ${componentName} mount #${countRef.current}`);
    return () => {
      console.log(
        `[Render] ${componentName} unmount (renders during mount: ${countRef.current})`
      );
    };
  }, [componentName]);

  if (isPerfEnabled() && countRef.current > 1) {
    console.log(`[Render] ${componentName} re-render #${countRef.current}`);
  }
}

export function perfClientTrace(title: string): PerfTrace {
  return new PerfTrace(title);
}
