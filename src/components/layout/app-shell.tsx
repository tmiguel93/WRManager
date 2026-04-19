import type { PropsWithChildren } from "react";

import { SideNav } from "@/components/layout/side-nav";
import { TopBar } from "@/components/layout/top-bar";
import { FadeIn } from "@/components/motion/fade-in";

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="relative flex min-h-screen bg-app-surface">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18)_0%,_transparent_36%),radial-gradient(circle_at_bottom_left,_rgba(234,179,8,0.12)_0%,_transparent_34%)]" />
      <SideNav />
      <div className="relative z-10 flex min-h-screen flex-1 flex-col">
        <TopBar />
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-10">
          <FadeIn>{children}</FadeIn>
        </main>
      </div>
    </div>
  );
}
