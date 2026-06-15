"use client";

import Link from "next/link";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Prevents chat UI crashes from blanking the whole app. */
export class ChatErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ChatErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-ivory p-6 text-center">
          <p className="text-sm text-gray-600">
            채팅 화면을 불러오지 못했습니다.
          </p>
          <Link
            href="/characters"
            className="rounded-full bg-pink-accent px-6 py-2 text-sm text-white"
          >
            캐릭터 선택으로
          </Link>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false })}
            className="text-sm text-gray-400 underline"
          >
            다시 시도
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
