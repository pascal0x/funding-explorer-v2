export function formatHourlyRate(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(4)}%`;
}

export function formatApr(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatMinutesAgo(iso: string) {
  const diffMinutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  return `${diffMinutes}m ago`;
}

export function titleCase(value: string) {
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
