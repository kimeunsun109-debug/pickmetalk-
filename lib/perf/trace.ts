/**
 * PickmeTalk 성능 측정 로그 (수정용 아님 — 관측 전용)
 * 활성화: PERF_TRACE=1 (서버) / NEXT_PUBLIC_PERF_TRACE=1 (클라이언트)
 */

export function isPerfEnabled(): boolean {
  if (typeof process !== "undefined" && process.env?.PERF_TRACE === "1") {
    return true;
  }
  if (
    typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_PERF_TRACE === "1"
  ) {
    return true;
  }
  return false;
}

export type PerfLine = { label: string; ms: number; detail?: string };

export class PerfTrace {
  private readonly t0: number;
  private lines: PerfLine[] = [];
  private lastMark: number;

  constructor(
    public readonly title: string,
    private readonly sink: (text: string) => void = console.log
  ) {
    this.t0 = now();
    this.lastMark = this.t0;
    if (isPerfEnabled()) {
      this.sink(`[${title}]\nstart`);
    }
  }

  mark(label: string, detail?: string): void {
    if (!isPerfEnabled()) return;
    const t = now();
    const ms = Math.round(t - this.lastMark);
    this.lines.push({ label, ms, detail });
    this.lastMark = t;
    const extra = detail ? ` (${detail})` : "";
    this.sink(`${label}\n${ms}ms${extra}`);
  }

  async span<T>(label: string, fn: () => Promise<T>, detail?: string): Promise<T> {
    if (!isPerfEnabled()) return fn();
    const s = now();
    try {
      return await fn();
    } finally {
      const ms = Math.round(now() - s);
      this.lines.push({ label, ms, detail });
      this.lastMark = now();
      const extra = detail ? ` (${detail})` : "";
      this.sink(`${label}\n${ms}ms${extra}`);
    }
  }

  sync<T>(label: string, fn: () => T, detail?: string): T {
    if (!isPerfEnabled()) return fn();
    const s = now();
    try {
      return fn();
    } finally {
      const ms = Math.round(now() - s);
      this.lines.push({ label, ms, detail });
      this.lastMark = now();
      const extra = detail ? ` (${detail})` : "";
      this.sink(`${label}\n${ms}ms${extra}`);
    }
  }

  end(extra?: string): number {
    if (!isPerfEnabled()) return 0;
    const total = Math.round(now() - this.t0);
    this.sink(`end`);
    this.sink(`총 소요 : ${total}ms${extra ? ` — ${extra}` : ""}`);
    this.sink("----------------");
    return total;
  }

  getLines(): PerfLine[] {
    return [...this.lines];
  }

  getTotalMs(): number {
    return Math.round(now() - this.t0);
  }
}

function now(): number {
  if (typeof performance !== "undefined" && performance.now) {
    return performance.now();
  }
  return Date.now();
}

/** 서버 전용 — process.hrtime.bigint() 기반 고해상도 */
export class ServerPerfTrace {
  private readonly t0: bigint;
  private lines: PerfLine[] = [];
  private lastMark: bigint;

  constructor(
    public readonly title: string,
    private readonly sink: (text: string) => void = console.log
  ) {
    this.t0 = process.hrtime.bigint();
    this.lastMark = this.t0;
    if (isPerfEnabled()) {
      this.sink(`[${title}]\nstart`);
    }
  }

  mark(label: string, detail?: string): void {
    if (!isPerfEnabled()) return;
    const t = process.hrtime.bigint();
    const ms = nsToMs(t - this.lastMark);
    this.lines.push({ label, ms, detail });
    this.lastMark = t;
    const extra = detail ? ` (${detail})` : "";
    this.sink(`${label}\n${ms}ms${extra}`);
  }

  async span<T>(label: string, fn: () => Promise<T>, detail?: string): Promise<T> {
    if (!isPerfEnabled()) return fn();
    const s = process.hrtime.bigint();
    try {
      return await fn();
    } finally {
      const ms = nsToMs(process.hrtime.bigint() - s);
      this.lines.push({ label, ms, detail });
      this.lastMark = process.hrtime.bigint();
      const extra = detail ? ` (${detail})` : "";
      this.sink(`${label}\n${ms}ms${extra}`);
    }
  }

  sync<T>(label: string, fn: () => T, detail?: string): T {
    if (!isPerfEnabled()) return fn();
    const s = process.hrtime.bigint();
    try {
      return fn();
    } finally {
      const ms = nsToMs(process.hrtime.bigint() - s);
      this.lines.push({ label, ms, detail });
      this.lastMark = process.hrtime.bigint();
      const extra = detail ? ` (${detail})` : "";
      this.sink(`${label}\n${ms}ms${extra}`);
    }
  }

  end(extra?: string): number {
    if (!isPerfEnabled()) return 0;
    const total = nsToMs(process.hrtime.bigint() - this.t0);
    this.sink(`end`);
    this.sink(`총 소요 : ${total}ms${extra ? ` — ${extra}` : ""}`);
    this.sink("----------------");
    return total;
  }

  getLines(): PerfLine[] {
    return [...this.lines];
  }
}

function nsToMs(ns: bigint): number {
  return Math.round(Number(ns) / 1_000_000);
}
