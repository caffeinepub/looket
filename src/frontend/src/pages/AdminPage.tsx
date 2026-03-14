import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Principal } from "@dfinity/principal";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { User, backendInterface } from "../backend.d";

export function AdminPage({ actor }: { actor: backendInterface | null }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [coinAmounts, setCoinAmounts] = useState<Record<string, string>>({});

  // Add blook form
  const [blookName, setBlookName] = useState("");
  const [blookCost, setBlookCost] = useState("100");
  const [blookRarity, setBlookRarity] = useState("common");
  const [addingBlook, setAddingBlook] = useState(false);

  // Give coins by principal
  const [targetPrincipal, setTargetPrincipal] = useState("");
  const [giveAmount, setGiveAmount] = useState("100");
  const [givingDirect, setGivingDirect] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!actor) return;
      setLoading(true);
      try {
        const u = await actor.getAllUsers();
        setUsers(u);
      } catch {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [actor]);

  const handleGiveDirect = async () => {
    if (!actor || !targetPrincipal.trim()) return;
    setGivingDirect(true);
    try {
      const principal = Principal.fromText(targetPrincipal.trim());
      await actor.giveCoins(principal, BigInt(giveAmount));
      toast.success(`✅ Gave ${giveAmount} coins!`);
      setTargetPrincipal("");
    } catch {
      toast.error("Failed. Check principal format.");
    } finally {
      setGivingDirect(false);
    }
  };

  const handleAddBlook = async () => {
    if (!actor || !blookName.trim()) return;
    setAddingBlook(true);
    try {
      await actor.addShopBlook(
        blookName.trim(),
        BigInt(blookCost),
        blookRarity,
      );
      toast.success(`🎉 Added ${blookName} to shop!`);
      setBlookName("");
    } catch {
      toast.error("Failed to add blook.");
    } finally {
      setAddingBlook(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="text-4xl">⚙️</div>
        <h1 className="font-display text-3xl font-bold">Admin Panel</h1>
        <Badge className="bg-accent/20 text-accent border-accent/30">
          Admin Only
        </Badge>
      </div>

      {/* Give coins by principal */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-xl font-bold">💰 Give Coins</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="User Principal (e.g. aaaaa-aa...)"
            value={targetPrincipal}
            onChange={(e) => setTargetPrincipal(e.target.value)}
            className="flex-1 bg-input rounded-xl"
            data-ocid="admin.input"
          />
          <Input
            type="number"
            placeholder="Amount"
            value={giveAmount}
            onChange={(e) => setGiveAmount(e.target.value)}
            className="w-28 bg-input rounded-xl"
            data-ocid="admin.secondary_button"
          />
          <Button
            onClick={handleGiveDirect}
            disabled={givingDirect || !targetPrincipal.trim()}
            className="bg-primary text-primary-foreground rounded-xl"
            data-ocid="admin.primary_button"
          >
            {givingDirect ? "Giving..." : "Give Coins"}
          </Button>
        </div>
      </div>

      {/* Add Blook */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-xl font-bold">➕ Add Blook to Shop</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            placeholder="Blook name"
            value={blookName}
            onChange={(e) => setBlookName(e.target.value)}
            className="bg-input rounded-xl sm:col-span-1"
            data-ocid="admin.blook.input"
          />
          <Input
            type="number"
            placeholder="Cost"
            value={blookCost}
            onChange={(e) => setBlookCost(e.target.value)}
            className="bg-input rounded-xl"
          />
          <select
            value={blookRarity}
            onChange={(e) => setBlookRarity(e.target.value)}
            className="bg-input border border-border rounded-xl px-3 py-2 text-foreground"
            data-ocid="admin.blook.select"
          >
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>
          <Button
            onClick={handleAddBlook}
            disabled={addingBlook || !blookName.trim()}
            className="bg-accent text-accent-foreground rounded-xl"
            data-ocid="admin.blook.submit_button"
          >
            {addingBlook ? "Adding..." : "Add Blook"}
          </Button>
        </div>
      </div>

      {/* Users table */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-xl font-bold">👥 All Users</h2>
        {loading ? (
          <div className="space-y-2" data-ocid="admin.loading_state">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p
            className="text-muted-foreground text-center py-8"
            data-ocid="admin.empty_state"
          >
            No users found.
          </p>
        ) : (
          <div className="space-y-2" data-ocid="admin.table">
            {users.map((user, idx) => (
              <div
                key={user.id.toString()}
                className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/20"
                data-ocid={`admin.item.${idx + 1}`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    🪙 {user.coins.toString()} · XP {user.xp.toString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    type="number"
                    placeholder="Coins"
                    value={coinAmounts[user.id.toString()] ?? ""}
                    onChange={(e) =>
                      setCoinAmounts((prev) => ({
                        ...prev,
                        [user.id.toString()]: e.target.value,
                      }))
                    }
                    className="w-20 h-8 text-xs bg-input rounded-lg"
                  />
                  <Button
                    size="sm"
                    onClick={async () => {
                      toast.info(
                        "To give coins, use the Give Coins section above with the user's principal.",
                      );
                    }}
                    className="h-8 text-xs bg-primary/20 text-primary border border-primary/30 rounded-lg"
                    data-ocid={`admin.item.${idx + 1}.button`}
                  >
                    Give
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
