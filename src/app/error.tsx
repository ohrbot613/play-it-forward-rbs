"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>

      <h1 className="text-xl font-bold text-foreground mb-1">
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground mb-1">
        משהו השתבש
      </p>

      <p className="text-xs text-muted-foreground max-w-[260px] mb-8">
        An unexpected error occurred. Please try again.{" "}
        <span className="block mt-0.5">אירעה שגיאה בלתי צפויה. נסה שוב.</span>
      </p>

      <button
        onClick={reset}
        className="px-6 py-3 rounded-2xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        Try again / נסה שוב
      </button>
    </div>
  );
}
