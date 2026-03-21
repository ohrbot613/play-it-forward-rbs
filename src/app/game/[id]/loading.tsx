export default function GameDetailLoading() {
  return (
    <div className="px-4 pt-6 pb-8 animate-pulse">
      {/* Back button skeleton */}
      <div className="h-8 w-24 bg-muted rounded-xl mb-6" />

      {/* Game image placeholder */}
      <div className="h-56 w-full bg-muted rounded-2xl mb-5" />

      {/* Title + badges */}
      <div className="mb-4">
        <div className="h-7 w-56 bg-muted rounded-xl mb-2" />
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-muted rounded-full" />
          <div className="h-5 w-16 bg-muted rounded-full" />
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 flex-1 bg-muted rounded-2xl" />
        ))}
      </div>

      {/* Description */}
      <div className="space-y-2 mb-6">
        <div className="h-4 w-full bg-muted rounded-lg" />
        <div className="h-4 w-5/6 bg-muted rounded-lg" />
        <div className="h-4 w-4/6 bg-muted rounded-lg" />
      </div>

      {/* CTA button */}
      <div className="h-14 w-full bg-muted rounded-2xl" />
    </div>
  );
}
