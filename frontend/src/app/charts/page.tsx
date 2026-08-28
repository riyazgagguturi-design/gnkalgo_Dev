"use client";

import { AppShell } from "@/components/AppShell";
import { EmptyState, PageHeader, Panel } from "@/components/ui/terminal";

export default function ChartsPage() {
  return (
    <AppShell>
      <PageHeader title="Charts" subtitle="Advanced charting coming soon" />
      <Panel>
        <EmptyState
          title="Charts module"
          detail="Connect a charting provider or embed TradingView-style charts in a future release."
        />
      </Panel>
    </AppShell>
  );
}
