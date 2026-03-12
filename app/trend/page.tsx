import { AppShell } from "../../components/app-shell";
import { StrategyView } from "../../components/strategy-view";

export default function TrendPage() {
  return (
    <AppShell page="trend">
      <StrategyView page="trend" />
    </AppShell>
  );
}
