"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_RELAYS, type RelayRequest } from "@/lib/data";
import { Truck, MapPin, ArrowRight, CheckCircle2, Clock, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const statusConfig: Record<RelayRequest["status"], { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: "Needs Courier", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30", icon: Clock },
  claimed: { label: "Courier Assigned", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Package },
  "picked-up": { label: "In Transit", color: "bg-purple-500/20 text-purple-400 border-purple-500/30", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-500/20 text-green-400 border-green-500/30", icon: CheckCircle2 },
};

export default function RelayPage() {
  const [relays, setRelays] = useState(MOCK_RELAYS);

  const handleClaim = (id: string) => {
    setRelays((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "claimed" as const } : r))
    );
  };

  const handlePickup = (id: string) => {
    setRelays((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "picked-up" as const } : r))
    );
  };

  const handleDeliver = (id: string) => {
    setRelays((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: "delivered" as const } : r))
    );
  };

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Relay Dashboard</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Volunteer to deliver games between neighborhoods
        </p>
        <p className="text-xs text-muted-foreground" dir="rtl">
          התנדבו להעביר משחקים בין שכונות
        </p>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-lg bg-card p-2 text-center border">
          <div className="text-lg font-bold text-yellow-400">
            {relays.filter((r) => r.status === "pending").length}
          </div>
          <div className="text-[10px] text-muted-foreground">Need Courier</div>
        </div>
        <div className="rounded-lg bg-card p-2 text-center border">
          <div className="text-lg font-bold text-blue-400">
            {relays.filter((r) => r.status === "claimed" || r.status === "picked-up").length}
          </div>
          <div className="text-[10px] text-muted-foreground">In Progress</div>
        </div>
        <div className="rounded-lg bg-card p-2 text-center border">
          <div className="text-lg font-bold text-green-400">
            {relays.filter((r) => r.status === "delivered").length}
          </div>
          <div className="text-[10px] text-muted-foreground">Delivered</div>
        </div>
      </div>

      {/* Relay Cards */}
      <div className="space-y-3">
        {relays.map((relay) => {
          const config = statusConfig[relay.status];
          const StatusIcon = config.icon;

          return (
            <Card key={relay.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm">{relay.gameName}</h3>
                  <Badge variant="outline" className={cn("text-[10px]", config.color)}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {config.label}
                  </Badge>
                </div>

                {/* Route */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    RBS {relay.fromNeighborhood}
                  </span>
                  <ArrowRight className="h-3 w-3" />
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    RBS {relay.toNeighborhood}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground mb-3">
                  Requested by {relay.requesterName}
                </div>

                {/* Actions */}
                {relay.status === "pending" && (
                  <Button size="sm" className="w-full" onClick={() => handleClaim(relay.id)}>
                    I&apos;ll Deliver This
                  </Button>
                )}
                {relay.status === "claimed" && (
                  <Button size="sm" className="w-full" variant="outline" onClick={() => handlePickup(relay.id)}>
                    Mark as Picked Up
                  </Button>
                )}
                {relay.status === "picked-up" && (
                  <Button size="sm" className="w-full" variant="outline" onClick={() => handleDeliver(relay.id)}>
                    Mark as Delivered
                  </Button>
                )}
                {relay.status === "delivered" && (
                  <div className="flex items-center justify-center gap-1 text-xs text-green-400">
                    <CheckCircle2 className="h-3 w-3" />
                    Complete
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
