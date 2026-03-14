import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Switch } from "@/components/ui/switch";
import { Coins, LogOut, Menu, Shield, X, Zap } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  backendInterface as FullBackendInterface,
  QuestionSet,
  UserProfile,
} from "./backend.d";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AdminPage } from "./pages/AdminPage";
import { CryptoHack } from "./pages/CryptoHack";
import { FishingFrenzy } from "./pages/FishingFrenzy";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
import { MultiplayerPage } from "./pages/MultiplayerPage";
import { MySetsPage } from "./pages/MySetsPage";
import { PacksPage } from "./pages/PacksPage";
import { SetCreatorPage } from "./pages/SetCreatorPage";
import { ShopPage } from "./pages/ShopPage";
import { StudyMode } from "./pages/StudyMode";

type GamePage =
  | { type: "study"; questionSet: QuestionSet }
  | { type: "fishing"; questionSet: QuestionSet }
  | { type: "crypto"; questionSet: QuestionSet };

type Page =
  | "home"
  | "my-sets"
  | "create-set"
  | "shop"
  | "packs"
  | "leaderboard"
  | "admin"
  | "hacks"
  | "multiplayer";

export default function App() {
  const { identity, login, clear, isInitializing, isLoggingIn } =
    useInternetIdentity();
  const { actor, isFetching } = useActor();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [page, setPage] = useState<Page>("home");
  const [gamePage, setGamePage] = useState<GamePage | null>(null);
  const [username, setUsername] = useState("");
  const [creating, setCreating] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAnswers, setShowAnswers] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!actor || isFetching) return;
    setLoadingProfile(true);
    try {
      const [p, admin] = await Promise.all([
        actor.getCallerUserProfile(),
        identity ? actor.isCallerAdmin() : Promise.resolve(false),
      ]);
      setProfile(p);
      setIsAdmin(admin);
    } catch (_e) {
    } finally {
      setLoadingProfile(false);
    }
  }, [actor, isFetching, identity]);

  useEffect(() => {
    if (identity && actor && !isFetching) {
      loadProfile();
    } else if (!identity) {
      setProfile(null);
      setIsAdmin(false);
    }
  }, [identity, actor, isFetching, loadProfile]);

  const handleCreateUser = async () => {
    if (!actor || !username.trim()) return;
    setCreating(true);
    try {
      await actor.createUser(username.trim());
      await loadProfile();
      toast.success("Welcome to Looket! 🎉");
    } catch (_e) {
      toast.error("Failed to create user. Try again.");
    } finally {
      setCreating(false);
    }
  };

  const isLoyak = profile?.name?.toLowerCase() === "loyak";

  const navLinks: { label: string; page: Page; icon: string }[] = [
    { label: "Discover", page: "home", icon: "🔍" },
    { label: "My Sets", page: "my-sets", icon: "📚" },
    { label: "Multiplayer", page: "multiplayer", icon: "🎮" },
    { label: "Shop", page: "shop", icon: "🛍️" },
    { label: "Packs", page: "packs", icon: "🎁" },
    { label: "Leaderboard", page: "leaderboard", icon: "🏆" },
    ...(isAdmin ? [{ label: "Admin", page: "admin" as Page, icon: "⚙️" }] : []),
    ...(isLoyak ? [{ label: "Hacks", page: "hacks" as Page, icon: "💀" }] : []),
  ];

  if (isInitializing || (identity && isFetching)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-float">🎮</div>
          <p className="font-display text-2xl text-primary neon-cyan">
            Loading Looket...
          </p>
          <div className="flex gap-2 justify-center">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!identity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute top-20 left-10 text-6xl opacity-20 animate-float"
            style={{ animationDelay: "0s" }}
          >
            🐟
          </div>
          <div
            className="absolute top-40 right-20 text-4xl opacity-20 animate-float"
            style={{ animationDelay: "1s" }}
          >
            💻
          </div>
          <div
            className="absolute bottom-32 left-32 text-5xl opacity-20 animate-float"
            style={{ animationDelay: "2s" }}
          >
            📚
          </div>
          <div
            className="absolute bottom-20 right-10 text-4xl opacity-20 animate-float"
            style={{ animationDelay: "0.5s" }}
          >
            ⭐
          </div>
          <div
            className="absolute top-1/2 left-5 text-3xl opacity-15 animate-float"
            style={{ animationDelay: "1.5s" }}
          >
            🎯
          </div>
        </div>
        <div className="text-center space-y-8 animate-reveal-up px-6 max-w-md w-full">
          <div className="space-y-4">
            <img
              src="/assets/generated/looket-logo.dim_400x120.png"
              alt="Looket"
              className="mx-auto h-20 object-contain"
            />
            <h1 className="font-display text-5xl font-bold">
              <span className="text-primary neon-cyan">LOOK</span>
              <span className="text-accent neon-pink">ET</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Learn. Play. Dominate. 🎮
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 glow-card space-y-6">
            <p className="text-foreground text-center">
              Sign in to play games, collect blooks, and climb the leaderboard!
            </p>
            <Button
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-lg font-display font-bold bg-primary text-primary-foreground hover:opacity-90 rounded-xl animate-pulse-glow"
              data-ocid="signin.primary_button"
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⚡</span> Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="w-5 h-5" /> Sign In to Play
                </span>
              )}
            </Button>
            <div className="flex gap-3 text-sm text-muted-foreground justify-center">
              <span>🔒 Secure</span>
              <span>•</span>
              <span>🆓 Free</span>
              <span>•</span>
              <span>🎮 Fun</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loadingProfile && !profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-6xl animate-float">🎮</div>
          <p className="font-display text-xl text-primary">
            Loading your profile...
          </p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="bg-card border border-border rounded-2xl p-8 glow-card max-w-md w-full space-y-6 animate-reveal-up">
          <div className="text-center space-y-2">
            <div className="text-5xl">🎮</div>
            <h2 className="font-display text-3xl font-bold text-primary neon-cyan">
              Create Your Account
            </h2>
            <p className="text-muted-foreground">
              Pick a username to get started!
            </p>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="Enter your username..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateUser()}
              className="h-12 text-lg bg-input border-border rounded-xl"
              data-ocid="onboarding.input"
            />
            <Button
              onClick={handleCreateUser}
              disabled={creating || !username.trim()}
              className="w-full h-12 text-lg font-display font-bold bg-primary text-primary-foreground rounded-xl"
              data-ocid="onboarding.submit_button"
            >
              {creating ? "Creating..." : "🚀 Let's Go!"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (gamePage) {
    const onBack = () => setGamePage(null);
    const refreshProfile = loadProfile;
    const fullActor = actor as FullBackendInterface | null;
    if (gamePage.type === "study") {
      return (
        <StudyMode
          questionSet={gamePage.questionSet}
          onBack={onBack}
          showAnswers={showAnswers}
        />
      );
    }
    if (gamePage.type === "fishing") {
      return (
        <FishingFrenzy
          questionSet={gamePage.questionSet}
          onBack={onBack}
          profile={profile}
          onProfileUpdate={(p) => {
            setProfile(p);
            refreshProfile();
          }}
          actor={fullActor}
          showAnswers={showAnswers}
        />
      );
    }
    if (gamePage.type === "crypto") {
      return (
        <CryptoHack
          questionSet={gamePage.questionSet}
          onBack={onBack}
          profile={profile}
          onProfileUpdate={(p) => {
            setProfile(p);
            refreshProfile();
          }}
          actor={fullActor}
          showAnswers={showAnswers}
        />
      );
    }
  }

  const fullActor = actor as FullBackendInterface | null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />

      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage("home")}
            className="flex items-center gap-2 font-display font-bold text-xl"
            data-ocid="nav.link"
          >
            <span className="text-primary neon-cyan">LOOK</span>
            <span className="text-accent neon-pink">ET</span>
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <button
                type="button"
                key={link.page}
                onClick={() => setPage(link.page)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === link.page
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-ocid={`nav.${link.page}.link`}
              >
                {link.icon} {link.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1 bg-muted/60 rounded-full px-3 py-1.5 text-sm">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-yellow-300">
                {profile.coins.toString()}
              </span>
            </div>
            {isAdmin && (
              <Shield className="w-4 h-4 text-accent hidden sm:block" />
            )}
            <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <span>{profile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
              className="text-muted-foreground hover:text-foreground"
              data-ocid="nav.logout.button"
            >
              <LogOut className="w-4 h-4" />
            </Button>
            <button
              type="button"
              className="md:hidden p-1 rounded-lg hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-ocid="nav.menu.toggle"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card px-4 py-3 space-y-1">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
              <span className="font-medium">{profile.name}</span>
              <div className="ml-auto flex items-center gap-1 text-sm">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="font-bold text-yellow-300">
                  {profile.coins.toString()}
                </span>
              </div>
            </div>
            {navLinks.map((link) => (
              <button
                type="button"
                key={link.page}
                onClick={() => {
                  setPage(link.page);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  page === link.page
                    ? "bg-primary/20 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                data-ocid={`nav.mobile.${link.page}.link`}
              >
                {link.icon} {link.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {page === "home" && (
          <HomePage
            onPlayGame={(type, qs) => setGamePage({ type, questionSet: qs })}
          />
        )}
        {page === "my-sets" && (
          <MySetsPage
            identity={identity}
            onCreateNew={() => setPage("create-set")}
            onPlayGame={(type, qs) => setGamePage({ type, questionSet: qs })}
          />
        )}
        {page === "create-set" && (
          <SetCreatorPage actor={fullActor} onDone={() => setPage("my-sets")} />
        )}
        {page === "shop" && (
          <ShopPage
            actor={fullActor}
            profile={profile}
            onProfileUpdate={(p) => {
              setProfile(p);
              loadProfile();
            }}
          />
        )}
        {page === "packs" && (
          <PacksPage
            actor={fullActor}
            profile={profile}
            onProfileUpdate={(p) => {
              setProfile(p);
              loadProfile();
            }}
          />
        )}
        {page === "leaderboard" && (
          <LeaderboardPage
            actor={fullActor}
            _myPrincipal={identity?.getPrincipal().toString() ?? ""}
            myName={profile.name}
          />
        )}
        {page === "multiplayer" && (
          <MultiplayerPage actor={fullActor} profile={profile} />
        )}
        {page === "admin" && isAdmin && <AdminPage actor={fullActor} />}
        {page === "hacks" && isLoyak && (
          <HacksPage
            actor={fullActor}
            profile={profile}
            onProfileUpdate={(p) => {
              setProfile(p);
              loadProfile();
            }}
            showAnswers={showAnswers}
            onToggleShowAnswers={setShowAnswers}
          />
        )}
      </main>

      <footer className="border-t border-border py-4 px-4 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Looket. Built with ❤️ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

function HacksPage({
  actor,
  profile,
  onProfileUpdate,
  showAnswers,
  onToggleShowAnswers,
}: {
  actor: import("./backend.d").backendInterface | null;
  profile: UserProfile;
  onProfileUpdate: (p: UserProfile) => void;
  showAnswers: boolean;
  onToggleShowAnswers: (v: boolean) => void;
}) {
  const [coinAmount, setCoinAmount] = useState("9999");
  const [xpAmount, setXpAmount] = useState("9999");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [autoAnswer, setAutoAnswer] = useState(false);
  const [infiniteCoins, setInfiniteCoins] = useState(false);
  const infiniteRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Infinite coins interval
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional
  useEffect(() => {
    if (infiniteCoins && actor) {
      infiniteRef.current = setInterval(async () => {
        try {
          const newProfile = { ...profile, coins: BigInt(999999) };
          await actor.saveCallerUserProfile(newProfile);
          onProfileUpdate(newProfile);
        } catch {}
      }, 5000);
    } else {
      if (infiniteRef.current) clearInterval(infiniteRef.current);
    }
    return () => {
      if (infiniteRef.current) clearInterval(infiniteRef.current);
    };
  }, [infiniteCoins, actor]);

  const setCoins = async () => {
    if (!actor) return;
    setLoading("coins");
    try {
      const newProfile = { ...profile, coins: BigInt(coinAmount) };
      await actor.saveCallerUserProfile(newProfile);
      onProfileUpdate(newProfile);
      toast.success(`💀 Coins set to ${coinAmount}`);
    } catch {
      toast.error("Hack failed.");
    } finally {
      setLoading(null);
    }
  };

  const setXp = async () => {
    if (!actor) return;
    setLoading("xp");
    try {
      const newProfile = { ...profile, xp: BigInt(xpAmount) };
      await actor.saveCallerUserProfile(newProfile);
      onProfileUpdate(newProfile);
      toast.success(`💀 XP set to ${xpAmount}`);
    } catch {
      toast.error("Hack failed.");
    } finally {
      setLoading(null);
    }
  };

  const setUsername = async () => {
    if (!actor || !newName.trim()) return;
    setLoading("name");
    try {
      const newProfile = { ...profile, name: newName.trim() };
      await actor.saveCallerUserProfile(newProfile);
      onProfileUpdate(newProfile);
      toast.success(`💀 Username changed to ${newName}`);
      setNewName("");
    } catch {
      toast.error("Hack failed.");
    } finally {
      setLoading(null);
    }
  };

  const hackCards = [
    {
      icon: "💰",
      title: "Set Coin Balance",
      content: (
        <div className="space-y-3">
          <Input
            type="number"
            value={coinAmount}
            onChange={(e) => setCoinAmount(e.target.value)}
            className="h-10 bg-input rounded-xl"
            data-ocid="hacks.input"
          />
          <Button
            onClick={setCoins}
            disabled={loading === "coins"}
            className="w-full bg-accent text-accent-foreground font-bold rounded-xl"
            data-ocid="hacks.primary_button"
          >
            {loading === "coins" ? "Hacking..." : "💀 Set Coins"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Current: {profile.coins.toString()} 🪙
          </p>
        </div>
      ),
    },
    {
      icon: "⚡",
      title: "Set XP",
      content: (
        <div className="space-y-3">
          <Input
            type="number"
            value={xpAmount}
            onChange={(e) => setXpAmount(e.target.value)}
            className="h-10 bg-input rounded-xl"
          />
          <Button
            onClick={setXp}
            disabled={loading === "xp"}
            className="w-full bg-accent text-accent-foreground font-bold rounded-xl"
          >
            {loading === "xp" ? "Hacking..." : "💀 Set XP"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Current XP: {profile.xp.toString()}
          </p>
        </div>
      ),
    },
    {
      icon: "✏️",
      title: "Set Username",
      content: (
        <div className="space-y-3">
          <Input
            placeholder="New username..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="h-10 bg-input rounded-xl"
          />
          <Button
            onClick={setUsername}
            disabled={loading === "name" || !newName.trim()}
            className="w-full bg-accent text-accent-foreground font-bold rounded-xl"
          >
            {loading === "name" ? "Hacking..." : "💀 Change Name"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Current: {profile.name}
          </p>
        </div>
      ),
    },
    {
      icon: "👁️",
      title: "View All Answers",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Highlights the correct answer in green before you click in all game
            modes.
          </p>
          <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
            <Switch
              checked={showAnswers}
              onCheckedChange={onToggleShowAnswers}
              data-ocid="hacks.switch"
            />
            <span
              className={`font-bold ${showAnswers ? "text-green-400" : "text-muted-foreground"}`}
            >
              {showAnswers ? "✅ ACTIVE" : "❌ OFF"}
            </span>
          </div>
        </div>
      ),
    },
    {
      icon: "🤖",
      title: "Auto Answer Correct",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Requires View All Answers to be on. Auto-selects the correct answer
            after 500ms.
          </p>
          <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
            <Switch
              checked={autoAnswer}
              onCheckedChange={(v) => {
                setAutoAnswer(v);
                if (v && !showAnswers) onToggleShowAnswers(true);
                toast.info(v ? "🤖 Auto Answer ON" : "🤖 Auto Answer OFF");
              }}
            />
            <span
              className={`font-bold ${autoAnswer ? "text-green-400" : "text-muted-foreground"}`}
            >
              {autoAnswer ? "✅ ACTIVE" : "❌ OFF"}
            </span>
          </div>
          {autoAnswer && (
            <p className="text-xs text-yellow-400">
              ⚠️ Will auto-click correct answer during games via View Answers
              highlight
            </p>
          )}
        </div>
      ),
    },
    {
      icon: "♾️",
      title: "Infinite Coins",
      content: (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Sets your coins to 999,999 every 5 seconds while active.
          </p>
          <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-xl">
            <Switch
              checked={infiniteCoins}
              onCheckedChange={(v) => {
                setInfiniteCoins(v);
                toast.info(v ? "♾️ Infinite Coins ON" : "♾️ Infinite Coins OFF");
              }}
            />
            <span
              className={`font-bold ${infiniteCoins ? "text-green-400" : "text-muted-foreground"}`}
            >
              {infiniteCoins ? "✅ ACTIVE" : "❌ OFF"}
            </span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-6xl">💀</div>
        <h1 className="font-display text-3xl font-bold text-accent neon-pink">
          LOYAK HACKS
        </h1>
        <p className="text-muted-foreground">
          Only for the chosen one. Use responsibly (or don't).
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {hackCards.map((card) => (
          <div
            key={card.title}
            className="bg-card border border-accent/30 rounded-2xl p-5 space-y-3 glow-card-pink"
          >
            <h2 className="font-display text-lg text-accent flex items-center gap-2">
              {card.icon} {card.title}
            </h2>
            {card.content}
          </div>
        ))}
      </div>
    </div>
  );
}
