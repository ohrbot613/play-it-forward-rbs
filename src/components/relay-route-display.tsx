"use client";

import { RelayRoute } from "@/lib/relay";
import { ArrowDown, User, MapPin } from "lucide-react";

interface RelayRouteDisplayProps {
  route: RelayRoute;
}

export function RelayRouteDisplay({ route }: RelayRouteDisplayProps) {
  const typeLabel =
    route.type === "direct"
      ? "Direct pickup"
      : route.type === "single-relay"
      ? "1 volunteer relay"
      : "2 volunteer relay";

  return (
    <div className="rounded-2xl bg-background p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xs text-muted-foreground font-medium uppercase tracking-wider">
          Delivery route
        </span>
        <span className="text-2xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
          {typeLabel} · {route.totalDistanceKm.toFixed(1)} km
        </span>
      </div>

      <div className="space-y-1">
        {route.legs.map((leg, i) => (
          <div key={i}>
            {/* From node */}
            {i === 0 && (
              <div className="flex items-center gap-2 py-1.5">
                <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                </div>
                <span className="text-xs font-semibold">{leg.from.label}</span>
              </div>
            )}

            {/* Arrow + distance */}
            <div className="flex items-center gap-2 py-0.5 ml-3">
              <ArrowDown className="h-3 w-3 text-muted-foreground/50 shrink-0" />
              <span className="text-2xs text-muted-foreground">
                {leg.distanceKm.toFixed(1)} km
                {leg.volunteerName ? ` via ${leg.volunteerName}` : ""}
              </span>
            </div>

            {/* To node */}
            <div className="flex items-center gap-2 py-1.5">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                {i === route.legs.length - 1 ? (
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <span className="text-2xs font-bold text-muted-foreground">
                    {leg.volunteerName?.charAt(0) ?? "V"}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold">{leg.to.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
