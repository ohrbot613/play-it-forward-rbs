"use client";

import { useParams, useRouter } from "next/navigation";
import { getGame } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Gamepad2, Users, Clock, MapPin, Heart, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const game = getGame(id);
  const [requested, setRequested] = useState(false);

  if (!game) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <p className="text-muted-foreground">Game not found</p>
        <Button variant="ghost" onClick={() => router.push("/")} className="mt-4">
          Go back
        </Button>
      </div>
    );
  }

  const handleRequest = () => {
    setRequested(true);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hi! I'd like to borrow "${game.name}" from Play it Forward RBS. Is it still available?`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="px-4 pt-4">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="mb-3 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Hero */}
      <div className="relative h-48 rounded-xl bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center mb-4">
        <Gamepad2 className="h-20 w-20 text-primary/30" />
        <Badge
          variant="outline"
          className="absolute top-3 right-3 bg-card/80 backdrop-blur"
        >
          {game.status}
        </Badge>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold">{game.name}</h1>
      <p className="text-base text-muted-foreground" dir="rtl">
        {game.nameHe}
      </p>

      <Separator className="my-4" />

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 rounded-lg bg-card border p-3">
          <Users className="h-4 w-4 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Players</div>
            <div className="text-sm font-medium">
              {game.minPlayers}-{game.maxPlayers}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-card border p-3">
          <Clock className="h-4 w-4 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Ages</div>
            <div className="text-sm font-medium">{game.ageRange}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-card border p-3">
          <MapPin className="h-4 w-4 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Location</div>
            <div className="text-sm font-medium">RBS {game.neighborhood}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-card border p-3">
          <Heart className="h-4 w-4 text-primary" />
          <div>
            <div className="text-xs text-muted-foreground">Condition</div>
            <div className="text-sm font-medium capitalize">{game.condition.replace("-", " ")}</div>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold mb-1">About this game</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">{game.description}</p>
      </div>

      {/* Donor */}
      <div className="mb-6 rounded-lg bg-card border p-3">
        <div className="text-xs text-muted-foreground">Donated by</div>
        <div className="text-sm font-medium">{game.donorName}</div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {game.status === "available" && !requested ? (
          <Button className="flex-1" size="lg" onClick={handleRequest}>
            Request This Game
          </Button>
        ) : requested ? (
          <Button className="flex-1" size="lg" disabled variant="secondary">
            Requested!
          </Button>
        ) : (
          <Button className="flex-1" size="lg" disabled variant="secondary">
            Currently {game.status}
          </Button>
        )}
        <Button variant="outline" size="lg" onClick={handleWhatsApp}>
          <MessageCircle className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
