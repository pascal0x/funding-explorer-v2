import { AppShell } from "../../components/app-shell";
import { StrategyView } from "../../components/strategy-view";

export default function ComparePage() {
  return (
    <AppShell page="compare">
      <StrategyView page="compare" />
    </AppShell>
  );
}
