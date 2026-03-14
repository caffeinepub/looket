import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Blook, UserProfile, backendInterface } from "../backend.d";

const RARITY_CONFIG: Record<
  string,
  { color: string; emoji: string; glow: string }
> = {
  common: { color: "border-gray-500/40 bg-gray-500/10", emoji: "⚪", glow: "" },
  uncommon: {
    color: "border-green-500/40 bg-green-500/10",
    emoji: "🟢",
    glow: "shadow-green-500/20",
  },
  rare: {
    color: "border-blue-500/40 bg-blue-500/10",
    emoji: "🔵",
    glow: "shadow-blue-500/20",
  },
  epic: {
    color: "border-purple-500/40 bg-purple-500/10",
    emoji: "🟣",
    glow: "shadow-purple-500/20",
  },
  legendary: {
    color: "border-yellow-500/40 bg-yellow-500/10",
    emoji: "⭐",
    glow: "shadow-yellow-500/20",
  },
};

const DEFAULT_BLOOKS: [string, Blook][] = [
  [
    "Friendly Fish",
    { name: "Friendly Fish", cost: BigInt(50), rarity: "common" },
  ],
  ["Galaxy Cat", { name: "Galaxy Cat", cost: BigInt(100), rarity: "uncommon" }],
  ["Cyber Wolf", { name: "Cyber Wolf", cost: BigInt(200), rarity: "rare" }],
  [
    "Dragon Phoenix",
    { name: "Dragon Phoenix", cost: BigInt(400), rarity: "epic" },
  ],
  [
    "Cosmic Unicorn",
    { name: "Cosmic Unicorn", cost: BigInt(800), rarity: "legendary" },
  ],
  ["Neon Panda", { name: "Neon Panda", cost: BigInt(150), rarity: "uncommon" }],
  ["Thunder Hawk", { name: "Thunder Hawk", cost: BigInt(300), rarity: "rare" }],
  ["Shadow Fox", { name: "Shadow Fox", cost: BigInt(500), rarity: "epic" }],
];

export function ShopPage({
  actor,
  profile,
  onProfileUpdate,
}: {
  actor: backendInterface | null;
  profile: UserProfile;
  onProfileUpdate: (p: UserProfile) => void;
}) {
  const [blooks, setBlooks] = useState<[string, Blook][]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!actor) return;
      setLoading(true);
      try {
        const b = await actor.getShopBlooks();
        setBlooks(b.length > 0 ? b : DEFAULT_BLOOKS);
      } catch {
        setBlooks(DEFAULT_BLOOKS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [actor]);

  const handleBuy = async (name: string, cost: bigint) => {
    if (!actor) return;
    if (profile.coins < cost) {
      toast.error("Not enough coins! 💸");
      return;
    }
    setBuying(name);
    try {
      await actor.buyBlook(name);
      const newProfile = {
        ...profile,
        coins: profile.coins - cost,
        ownedBlooks: [...profile.ownedBlooks, name],
      };
      onProfileUpdate(newProfile);
      toast.success(`🎉 You got ${name}!`);
    } catch {
      toast.error("Purchase failed.");
    } finally {
      setBuying(null);
    }
  };

  const rarityConfig = (rarity: string) =>
    RARITY_CONFIG[rarity.toLowerCase()] ?? RARITY_CONFIG.common;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">🛍️ Blook Shop</h1>
        <div className="flex items-center gap-2 bg-muted/60 rounded-full px-4 py-2">
          <span className="text-yellow-400">🪙</span>
          <span className="font-bold text-yellow-300">
            {profile.coins.toString()}
          </span>
          <span className="text-muted-foreground text-sm">coins</span>
        </div>
      </div>

      {loading ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          data-ocid="shop.loading_state"
        >
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {blooks.map(([name, blook], idx) => {
            const rc = rarityConfig(blook.rarity);
            const owned = profile.ownedBlooks.includes(name);
            return (
              <div
                key={name}
                className={`border rounded-2xl p-4 flex flex-col items-center gap-3 transition-all ${rc.color} ${rc.glow} shadow-lg`}
                data-ocid={`shop.item.${idx + 1}`}
              >
                <div className="text-5xl">{rc.emoji}</div>
                <div className="text-center">
                  <p className="font-display font-bold text-sm leading-tight">
                    {name}
                  </p>
                  <Badge
                    variant="secondary"
                    className="mt-1 text-xs capitalize"
                  >
                    {blook.rarity}
                  </Badge>
                </div>
                <div className="text-center">
                  <p className="text-yellow-300 font-bold">
                    🪙 {blook.cost.toString()}
                  </p>
                </div>
                {owned ? (
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    ✓ Owned
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleBuy(name, blook.cost)}
                    disabled={buying === name || profile.coins < blook.cost}
                    className="w-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/30 rounded-xl"
                    data-ocid={`shop.item.${idx + 1}.button`}
                  >
                    {buying === name ? "Buying..." : "Buy"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
