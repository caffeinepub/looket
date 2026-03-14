import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import type { UserProfile, backendInterface } from "../backend.d";

const PACKS = [
  {
    id: "starter",
    name: "Starter Pack",
    emoji: "📦",
    cost: 50,
    desc: "3 blooks: mostly Common",
    color: "border-gray-500/40 bg-gray-500/10",
    blooks: ["Friendly Fish", "Neon Panda", "Galaxy Cat", "Cyber Wolf"],
    count: 3,
  },
  {
    id: "rare",
    name: "Rare Pack",
    emoji: "💎",
    cost: 150,
    desc: "5 blooks: Uncommon to Rare",
    color: "border-blue-500/40 bg-blue-500/10",
    blooks: [
      "Galaxy Cat",
      "Cyber Wolf",
      "Neon Panda",
      "Thunder Hawk",
      "Dragon Phoenix",
    ],
    count: 5,
  },
  {
    id: "legendary",
    name: "Legendary Pack",
    emoji: "✨",
    cost: 500,
    desc: "7 blooks: Rare to Legendary!",
    color: "border-yellow-500/40 bg-yellow-500/10",
    blooks: [
      "Dragon Phoenix",
      "Cosmic Unicorn",
      "Shadow Fox",
      "Thunder Hawk",
      "Cyber Wolf",
      "Galaxy Cat",
      "Neon Panda",
    ],
    count: 7,
  },
];

export function PacksPage({
  actor,
  profile,
  onProfileUpdate,
}: {
  actor: backendInterface | null;
  profile: UserProfile;
  onProfileUpdate: (p: UserProfile) => void;
}) {
  const [opening, setOpening] = useState<string | null>(null);
  const [revealedBlooks, setRevealedBlooks] = useState<string[]>([]);
  const [showReveal, setShowReveal] = useState(false);

  const openPack = async (pack: (typeof PACKS)[number]) => {
    if (!actor) return;
    if (profile.coins < BigInt(pack.cost)) {
      toast.error("Not enough coins! 💸");
      return;
    }
    setOpening(pack.id);
    try {
      const picked: string[] = [];
      for (let i = 0; i < pack.count; i++) {
        const randomBlook =
          pack.blooks[Math.floor(Math.random() * pack.blooks.length)];
        picked.push(randomBlook);
      }
      const newCoins = profile.coins - BigInt(pack.cost);
      const newOwnedBlooks = [...new Set([...profile.ownedBlooks, ...picked])];
      const newProfile = {
        ...profile,
        coins: newCoins,
        ownedBlooks: newOwnedBlooks,
      };
      await actor.saveCallerUserProfile(newProfile);
      onProfileUpdate(newProfile);
      setRevealedBlooks(picked);
      setShowReveal(true);
    } catch {
      toast.error("Failed to open pack.");
    } finally {
      setOpening(null);
    }
  };

  const BLOOK_EMOJIS: Record<string, string> = {
    "Friendly Fish": "🐟",
    "Galaxy Cat": "🐱",
    "Cyber Wolf": "🐺",
    "Dragon Phoenix": "🐉",
    "Cosmic Unicorn": "🦄",
    "Neon Panda": "🐼",
    "Thunder Hawk": "🦅",
    "Shadow Fox": "🦊",
  };

  if (showReveal) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="text-5xl animate-float">🎁</div>
        <h2 className="font-display text-4xl font-bold text-accent neon-pink">
          Pack Opened!
        </h2>
        <div className="flex flex-wrap gap-4 justify-center max-w-md">
          {revealedBlooks.map((blook, i) => (
            <div
              key={blook + String(i)}
              className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center gap-2 animate-reveal-up"
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}
              data-ocid={`packs.item.${i + 1}`}
            >
              <span className="text-4xl">{BLOOK_EMOJIS[blook] ?? "⭐"}</span>
              <span className="font-display font-bold text-sm text-center">
                {blook}
              </span>
            </div>
          ))}
        </div>
        <Button
          onClick={() => setShowReveal(false)}
          className="bg-primary text-primary-foreground rounded-xl font-display font-bold px-8"
          data-ocid="packs.primary_button"
        >
          Awesome! ✨
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">🎁 Packs</h1>
        <div className="flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2">
          <span className="text-yellow-400">🪙</span>
          <span className="font-bold text-yellow-300">
            {profile.coins.toString()}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {PACKS.map((pack) => (
          <div
            key={pack.id}
            className={`border rounded-2xl p-6 flex flex-col items-center gap-4 transition-all hover:scale-105 ${pack.color}`}
            data-ocid={`packs.item.${PACKS.indexOf(pack) + 1}`}
          >
            <div className="text-6xl animate-float">{pack.emoji}</div>
            <div className="text-center space-y-1">
              <h2 className="font-display text-xl font-bold">{pack.name}</h2>
              <p className="text-sm text-muted-foreground">{pack.desc}</p>
            </div>
            <p className="text-2xl font-bold text-yellow-300">🪙 {pack.cost}</p>
            <div className="text-xs text-muted-foreground text-center">
              Possible blooks:
              <br />
              {pack.blooks.slice(0, 3).join(", ")}
              {pack.blooks.length > 3 ? " & more" : ""}
            </div>
            <Button
              onClick={() => openPack(pack)}
              disabled={
                opening === pack.id || profile.coins < BigInt(pack.cost)
              }
              className="w-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 rounded-xl font-display font-bold"
              data-ocid={`packs.item.${PACKS.indexOf(pack) + 1}.button`}
            >
              {opening === pack.id ? "Opening..." : `Open for 🪙${pack.cost}`}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
