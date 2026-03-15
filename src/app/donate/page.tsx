"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { NEIGHBORHOODS, type Neighborhood, type GameCondition } from "@/lib/data";
import { Camera, Upload, Sparkles, CheckCircle2, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "form" | "photo" | "verify" | "done";

export default function DonatePage() {
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [gameName, setGameName] = useState("");
  const [description, setDescription] = useState("");
  const [neighborhood, setNeighborhood] = useState<Neighborhood | "">("");
  const [condition, setCondition] = useState<GameCondition | "">("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = () => {
    // AI verification placeholder - simulates a 1.5s verification
    setStep("verify");
    setTimeout(() => setStep("done"), 1500);
  };

  if (step === "done") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-xl font-bold mb-2">Thank You!</h1>
        <p className="text-sm text-muted-foreground mb-1">
          Your game &ldquo;{gameName}&rdquo; has been listed.
        </p>
        <p className="text-xs text-muted-foreground mb-6" dir="rtl">
          המשחק נוסף בהצלחה. תודה על התרומה!
        </p>
        <Button onClick={() => { setStep("form"); setGameName(""); setPhotoPreview(null); }}>
          Donate Another
        </Button>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 animate-pulse">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-lg font-bold mb-2">Verifying with AI...</h2>
        <p className="text-xs text-muted-foreground">
          Checking that the photo matches a board game
        </p>
      </div>
    );
  }

  if (step === "photo") {
    return (
      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold mb-1">Photo Upload</h1>
        <p className="text-xs text-muted-foreground mb-4">
          Take a photo of the game box so borrowers know what to expect
        </p>

        <div className="mb-4">
          {photoPreview ? (
            <div className="relative rounded-xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreview} alt="Game preview" className="w-full h-48 object-cover" />
              <Button
                size="sm"
                variant="secondary"
                className="absolute bottom-2 right-2"
                onClick={() => setPhotoPreview(null)}
              >
                Retake
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-primary/30 bg-card cursor-pointer hover:border-primary/60 transition-colors">
              <Camera className="h-8 w-8 text-primary/40 mb-2" />
              <span className="text-sm text-muted-foreground">Tap to take photo</span>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoUpload}
              />
            </label>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>
            Back
          </Button>
          <Button
            className="flex-1"
            disabled={!photoPreview}
            onClick={handleVerify}
          >
            <Upload className="mr-2 h-4 w-4" />
            Submit
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">Donate a Game</h1>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Share a game with your neighbors
        </p>
        <p className="text-xs text-muted-foreground" dir="rtl">
          שתפו משחק עם השכנים
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1 block">Your Name</label>
            <Input
              placeholder="e.g. Miriam K."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Game Name</label>
            <Input
              placeholder="e.g. Settlers of Catan"
              value={gameName}
              onChange={(e) => setGameName(e.target.value)}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1 block">Description</label>
            <Textarea
              placeholder="Short description, any missing pieces, etc."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block">Neighborhood</label>
            <div className="flex flex-wrap gap-2">
              {NEIGHBORHOODS.map((n) => (
                <Badge
                  key={n}
                  variant={neighborhood === n ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setNeighborhood(n)}
                >
                  {n}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium mb-1.5 block">Condition</label>
            <div className="flex flex-wrap gap-2">
              {(["like-new", "good", "fair"] as GameCondition[]).map((c) => (
                <Badge
                  key={c}
                  variant={condition === c ? "default" : "outline"}
                  className="cursor-pointer capitalize"
                  onClick={() => setCondition(c)}
                >
                  {c.replace("-", " ")}
                </Badge>
              ))}
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!name || !gameName || !neighborhood || !condition}
            onClick={() => setStep("photo")}
          >
            <Camera className="mr-2 h-4 w-4" />
            Next: Add Photo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
