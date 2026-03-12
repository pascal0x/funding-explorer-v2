import { AppShell } from "../components/app-shell";
import { ExplorerView } from "../components/explorer-view";

export default function HomePage() {
  return (
    <AppShell page="explorer">
      <ExplorerView />
    </AppShell>
  );
}
