import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Principal } from "@dfinity/principal";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { AdminUser, backendInterface } from "../backend.d";

export function AdminPage({ actor }: { actor: backendInterface | null }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [coinAmounts, setCoinAmounts] = useState<Record<string, string>>({});
  const [suspendHours, setSuspendHours] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {},
  );

  // Add blook form
  const [blookName, setBlookName] = useState("");
  const [blookCost, setBlookCost] = useState("100");
  const [blookRarity, setBlookRarity] = useState("common");
  const [addingBlook, setAddingBlook] = useState(false);

  // Give coins by username
  const [targetName, setTargetName] = useState("");
  const [giveAmount, setGiveAmount] = useState("100");
  const [givingDirect, setGivingDirect] = useState(false);

  useEffect(() => {
    const loadUsers = async () => {
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
    loadUsers();
  }, [actor]);

  const loadUsers = async () => {
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

  const setAction = (key: string, val: boolean) =>
    setActionLoading((prev) => ({ ...prev, [key]: val }));

  const handleGiveDirect = async () => {
    if (!actor || !targetName.trim()) return;
    setGivingDirect(true);
    try {
      await actor.giveCoinsToName(targetName.trim(), BigInt(giveAmount));
      toast.success(`✅ Gave ${giveAmount} coins to ${targetName}!`);
      setTargetName("");
      await loadUsers();
    } catch {
      toast.error("Failed. Check username.");
    } finally {
      setGivingDirect(false);
    }
  };

  const handleGiveToUser = async (user: AdminUser) => {
    if (!actor) return;
    const amount = coinAmounts[user.id.toString()] || "0";
    const key = `give-${user.id}`;
    setAction(key, true);
    try {
      await actor.giveCoinsToName(user.name, BigInt(amount));
      toast.success(`✅ Gave ${amount} coins to ${user.name}!`);
      setCoinAmounts((prev) => ({ ...prev, [user.id.toString()]: "" }));
      await loadUsers();
    } catch {
      toast.error("Failed to give coins.");
    } finally {
      setAction(key, false);
    }
  };

  const handleBan = async (user: AdminUser) => {
    if (!actor) return;
    if (!window.confirm(`Ban ${user.name}? This is permanent.`)) return;
    const key = `ban-${user.id}`;
    setAction(key, true);
    try {
      await actor.banUser(Principal.fromText(user.principalText));
      toast.success(`🚫 ${user.name} has been banned.`);
      await loadUsers();
    } catch {
      toast.error("Failed to ban user.");
    } finally {
      setAction(key, false);
    }
  };

  const handleSuspend = async (user: AdminUser) => {
    if (!actor) return;
    const hours = suspendHours[user.id.toString()] || "24";
    const key = `suspend-${user.id}`;
    setAction(key, true);
    try {
      await actor.suspendUser(
        Principal.fromText(user.principalText),
        BigInt(hours),
      );
      toast.success(`⏸️ ${user.name} suspended for ${hours}h.`);
      await loadUsers();
    } catch {
      toast.error("Failed to suspend user.");
    } finally {
      setAction(key, false);
    }
  };

  const handleUnsuspend = async (user: AdminUser) => {
    if (!actor) return;
    const key = `unsuspend-${user.id}`;
    setAction(key, true);
    try {
      await actor.unsuspendUser(Principal.fromText(user.principalText));
      toast.success(`✅ ${user.name} unsuspended.`);
      await loadUsers();
    } catch {
      toast.error("Failed to unsuspend.");
    } finally {
      setAction(key, false);
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

      {/* Give coins by username */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-xl font-bold">
          💰 Give Coins by Username
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Username (e.g. loyak)"
            value={targetName}
            onChange={(e) => setTargetName(e.target.value)}
            className="flex-1 bg-input rounded-xl"
            data-ocid="admin.input"
          />
          <Input
            type="number"
            placeholder="Amount"
            value={giveAmount}
            onChange={(e) => setGiveAmount(e.target.value)}
            className="w-28 bg-input rounded-xl"
          />
          <Button
            onClick={handleGiveDirect}
            disabled={givingDirect || !targetName.trim()}
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
              <Skeleton key={i} className="h-20 rounded-xl" />
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
          <div className="space-y-3" data-ocid="admin.table">
            {users.map((user, idx) => (
              <div
                key={user.id.toString()}
                className={`p-4 rounded-xl border ${
                  user.suspended
                    ? "border-destructive/50 bg-destructive/5"
                    : "border-border bg-muted/20"
                }`}
                data-ocid={`admin.item.${idx + 1}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{user.name}</p>
                      {user.suspended && (
                        <Badge className="bg-destructive/20 text-destructive border-destructive/30 text-xs">
                          SUSPENDED
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      🪙 {user.coins.toString()} · XP {user.xp.toString()}
                    </p>
                  </div>
                </div>

                {/* Give coins row */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Input
                    type="number"
                    placeholder="Coins to give"
                    value={coinAmounts[user.id.toString()] ?? ""}
                    onChange={(e) =>
                      setCoinAmounts((prev) => ({
                        ...prev,
                        [user.id.toString()]: e.target.value,
                      }))
                    }
                    className="w-32 h-8 text-xs bg-input rounded-lg"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleGiveToUser(user)}
                    disabled={actionLoading[`give-${user.id}`]}
                    className="h-8 text-xs bg-primary/20 text-primary border border-primary/30 rounded-lg"
                    data-ocid={`admin.item.${idx + 1}.button`}
                  >
                    {actionLoading[`give-${user.id}`] ? "..." : "💰 Give"}
                  </Button>
                </div>

                {/* Suspend / Ban row */}
                <div className="flex flex-wrap items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Hours"
                    value={suspendHours[user.id.toString()] ?? "24"}
                    onChange={(e) =>
                      setSuspendHours((prev) => ({
                        ...prev,
                        [user.id.toString()]: e.target.value,
                      }))
                    }
                    className="w-24 h-8 text-xs bg-input rounded-lg"
                  />
                  {user.suspended ? (
                    <Button
                      size="sm"
                      onClick={() => handleUnsuspend(user)}
                      disabled={actionLoading[`unsuspend-${user.id}`]}
                      className="h-8 text-xs bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg"
                    >
                      {actionLoading[`unsuspend-${user.id}`]
                        ? "..."
                        : "✅ Unsuspend"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleSuspend(user)}
                      disabled={actionLoading[`suspend-${user.id}`]}
                      className="h-8 text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-lg"
                    >
                      {actionLoading[`suspend-${user.id}`]
                        ? "..."
                        : "⏸️ Suspend"}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => handleBan(user)}
                    disabled={actionLoading[`ban-${user.id}`]}
                    className="h-8 text-xs bg-destructive/20 text-destructive border border-destructive/30 rounded-lg"
                    data-ocid={`admin.item.${idx + 1}.delete_button`}
                  >
                    {actionLoading[`ban-${user.id}`] ? "..." : "🚫 Ban"}
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
