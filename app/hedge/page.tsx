import { AppShell } from "../../components/app-shell";
import { StrategyView } from "../../components/strategy-view";

export default function HedgePage() {
  return (
    <AppShell page="hedge">
      <StrategyView page="hedge" />
    </AppShell>
  );
}
