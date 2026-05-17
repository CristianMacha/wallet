export default function HistorialLoading() {
  return (
    <div className="px-4 py-4 space-y-4 animate-pulse">
      <div className="h-8 rounded-lg bg-muted" />
      <div className="h-8 rounded-full bg-muted w-48" />
      <div className="space-y-px rounded-lg overflow-hidden border border-border">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-muted/60" />
        ))}
      </div>
    </div>
  );
}
