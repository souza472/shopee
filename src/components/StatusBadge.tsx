export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETE: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    CANCELED: "bg-gray-100 text-gray-700",
  };
  return <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] ?? "bg-gray-100 text-gray-700"}`}>{status}</span>;
}
