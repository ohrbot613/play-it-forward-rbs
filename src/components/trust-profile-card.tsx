"use client";

import { cn } from "@/lib/utils";
import { CourierBadge, type BadgeVariant } from "@/components/courier-badge";

const NEIGHBORHOOD_COLORS: Record<string, { bg: string; text: string }> = {
  "RBS Aleph": { bg: "bg-blue-50", text: "text-blue-700" },
  "RBS Bet": { bg: "bg-emerald-50", text: "text-emerald-700" },
  "RBS Gimmel": { bg: "bg-amber-50", text: "text-amber-700" },
  "RBS Dalet": { bg: "bg-purple-50", text: "text-purple-700" },
  "Old Beit Shemesh": { bg: "bg-rose-50", text: "text-rose-700" },
};

interface TrustProfileCardProps {
  name: string;
  neighborhood: string;
  avatar?: string;
  gamesLent: number;
  gamesBorrowed: number;
  activeMonths: number;
  quote?: string;
  badges?: BadgeVariant[];
  compact?: boolean;
}

export function TrustProfileCard({
  name,
  neighborhood,
  avatar,
  gamesLent,
  gamesBorrowed,
  activeMonths,
  quote,
  badges,
  compact = false,
}: TrustProfileCardProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);

  const nhColor = NEIGHBORHOOD_COLORS[neighborhood] ?? {
    bg: "bg-gray-50",
    text: "text-gray-700",
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2.5">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate">{name}</span>
            <span
              className={cn(
                "text-2xs font-medium px-1.5 py-0.5 rounded-full shrink-0",
                nhColor.bg,
                nhColor.text
              )}
            >
              {neighborhood}
            </span>
          </div>
          <div className="text-2xs text-muted-foreground">
            Lent {gamesLent} · Borrowed {gamesBorrowed}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white elevation-2 p-4">
      {/* Top row: avatar + name + neighborhood */}
      <div className="flex items-center gap-3 mb-3">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-primary/10"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-base ring-2 ring-primary/10">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-sm truncate">{name}</h3>
          <span
            className={cn(
              "inline-flex text-2xs font-medium px-2 py-0.5 rounded-full mt-0.5",
              nhColor.bg,
              nhColor.text
            )}
          >
            {neighborhood}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-2xs text-muted-foreground mb-3 px-1">
        <span>
          Lent <span className="font-semibold text-foreground">{gamesLent}</span>
        </span>
        <span className="text-border">·</span>
        <span>
          Borrowed{" "}
          <span className="font-semibold text-foreground">{gamesBorrowed}</span>
        </span>
        <span className="text-border">·</span>
        <span>
          Active{" "}
          <span className="font-semibold text-foreground">{activeMonths}</span> months
        </span>
      </div>

      {/* Courier badges */}
      {badges && badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {badges.map((badge) => (
            <CourierBadge key={badge} variant={badge} />
          ))}
        </div>
      )}

      {/* Community quote */}
      {quote && (
        <div className="bg-background rounded-xl px-3 py-2.5">
          <p className="text-xs text-muted-foreground italic leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
        </div>
      )}
    </div>
  );
}
