import type { PropsWithChildren } from "react";

import { AppShell } from "@/components/layout/app-shell";

export default function GameLayout({ children }: PropsWithChildren) {
  return <AppShell>{children}</AppShell>;
}
