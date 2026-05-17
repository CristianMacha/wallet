export default function MiembrosLoading() {
  return (
    <div className="px-4 py-4 space-y-2 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg bg-muted" />
      ))}
    </div>
  );
}
