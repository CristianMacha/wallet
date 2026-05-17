export default function DashboardLoading() {
  return (
    <div className="px-4 py-4 space-y-4 animate-pulse">
      <div className="h-12 rounded-lg bg-muted" />
      <div className="h-20 rounded-lg bg-muted" />
      <div className="space-y-2">
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="h-16 rounded-lg bg-muted" />
        <div className="h-16 rounded-lg bg-muted" />
        <div className="h-16 rounded-lg bg-muted" />
      </div>
    </div>
  );
}
