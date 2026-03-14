import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useState } from "react";
import type { User, backendInterface } from "../backend.d";

const DEMO_LEADERBOARD: User[] = [
  { id: BigInt(1), name: "CryptoKing", coins: BigInt(9842), xp: BigInt(4200) },
  { id: BigInt(2), name: "FishMaster", coins: BigInt(7651), xp: BigInt(3800) },
  { id: BigInt(3), name: "QuizWizard", coins: BigInt(6200), xp: BigInt(3100) },
  { id: BigInt(4), name: "NeonPanda99", coins: BigInt(5100), xp: BigInt(2700) },
  { id: BigInt(5), name: "StarBlazer", coins: BigInt(4800), xp: BigInt(2400) },
  { id: BigInt(6), name: "HackerPro", coins: BigInt(3900), xp: BigInt(2100) },
  { id: BigInt(7), name: "BrainStorm", coins: BigInt(3200), xp: BigInt(1800) },
  { id: BigInt(8), name: "GalaxyRider", coins: BigInt(2800), xp: BigInt(1500) },
];

const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

export function LeaderboardPage({
  actor,
  _myPrincipal,
  myName,
}: {
  actor: backendInterface | null;
  _myPrincipal: string;
  myName: string;
}) {
  const [leaders, setLeaders] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!actor) return;
      setLoading(true);
      try {
        const data = await actor.getLeaderboard();
        setLeaders(data.length > 0 ? data.slice(0, 20) : DEMO_LEADERBOARD);
      } catch {
        setLeaders(DEMO_LEADERBOARD);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [actor]);

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="font-display text-4xl font-bold">🏆 Leaderboard</h1>
        <p className="text-muted-foreground">Top players this season</p>
      </div>

      {loading ? (
        <div className="space-y-2" data-ocid="leaderboard.loading_state">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="space-y-2" data-ocid="leaderboard.list">
          {leaders.map((user, idx) => {
            const isMe = user.name === myName;
            return (
              <div
                key={user.id.toString()}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isMe
                    ? "border-primary/60 bg-primary/10 glow-card"
                    : idx < 3
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-border bg-card"
                }`}
                data-ocid={`leaderboard.item.${idx + 1}`}
              >
                <div className="w-10 text-center">
                  {idx < 3 ? (
                    <span className="text-2xl">{RANK_EMOJIS[idx]}</span>
                  ) : (
                    <span className="font-display font-bold text-muted-foreground text-lg">
                      #{idx + 1}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-display font-bold truncate ${isMe ? "text-primary" : ""}`}
                  >
                    {user.name} {isMe && <span className="text-xs">← you</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    XP: {user.xp.toString()}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-yellow-300">
                    🪙 {user.coins.toString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
