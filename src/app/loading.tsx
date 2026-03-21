export default function Loading() {
  return (
    <div className="px-4 pt-8 pb-6 animate-pulse">
      {/* Hero skeleton */}
      <div className="mb-6">
        <div className="h-8 w-48 bg-muted rounded-xl mb-2" />
        <div className="h-4 w-64 bg-muted rounded-lg mb-3" />
        <div className="h-3 w-40 bg-muted rounded-lg" />
      </div>

      {/* Search bar skeleton */}
      <div className="h-12 w-full bg-muted rounded-2xl mb-4" />

      {/* Category filters skeleton */}
      <div className="flex gap-2 mb-4 overflow-hidden">
        {[80, 72, 96, 64, 80].map((w, i) => (
          <div
            key={i}
            className="shrink-0 h-8 bg-muted rounded-full"
            style={{ width: w }}
          />
        ))}
      </div>

      {/* Game grid skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-2xl h-52" />
        ))}
      </div>
    </div>
  );
}
