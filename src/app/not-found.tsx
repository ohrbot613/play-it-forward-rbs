import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-6">
        <SearchX className="h-8 w-8 text-muted-foreground" />
      </div>

      <h1 className="text-xl font-bold text-foreground mb-1">
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground mb-1">
        הדף לא נמצא
      </p>

      <p className="text-xs text-muted-foreground max-w-[260px] mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.{" "}
        <span className="block mt-0.5">הדף שחיפשת לא קיים או הועבר.</span>
      </p>

      <Link
        href="/"
        className="px-6 py-3 rounded-2xl bg-foreground text-white text-sm font-medium hover:bg-foreground/90 transition-colors"
      >
        Back to Home / חזרה לדף הבית
      </Link>
    </div>
  );
}
