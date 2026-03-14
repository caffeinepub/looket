import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Coins, LogOut, Menu, Shield, X, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { QuestionSet, UserProfile } from "./backend.d";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { AdminPage } from "./pages/AdminPage";
import { CryptoHack } from "./pages/CryptoHack";
import { FishingFrenzy } from "./pages/FishingFrenzy";
import { HomePage } from "./pages/HomePage";
import { LeaderboardPage } from "./pages/LeaderboardPage";
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
  | "hacks";

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
    if (gamePage.type === "study") {
      return <StudyMode questionSet={gamePage.questionSet} onBack={onBack} />;
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
          actor={actor}
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
          actor={actor}
        />
      );
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Toaster />

      {/* Navbar */}
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

          {/* Desktop nav */}
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

        {/* Mobile menu */}
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
          <SetCreatorPage actor={actor} onDone={() => setPage("my-sets")} />
        )}
        {page === "shop" && (
          <ShopPage
            actor={actor}
            profile={profile}
            onProfileUpdate={(p) => {
              setProfile(p);
              loadProfile();
            }}
          />
        )}
        {page === "packs" && (
          <PacksPage
            actor={actor}
            profile={profile}
            onProfileUpdate={(p) => {
              setProfile(p);
              loadProfile();
            }}
          />
        )}
        {page === "leaderboard" && (
          <LeaderboardPage
            actor={actor}
            _myPrincipal={identity?.getPrincipal().toString() ?? ""}
            myName={profile.name}
          />
        )}
        {page === "admin" && isAdmin && <AdminPage actor={actor} />}
        {page === "hacks" && isLoyak && (
          <HacksPage
            actor={actor}
            profile={profile}
            onProfileUpdate={(p) => {
              setProfile(p);
              loadProfile();
            }}
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
}: {
  actor: import("./backend.d").backendInterface | null;
  profile: UserProfile;
  onProfileUpdate: (p: UserProfile) => void;
}) {
  const [coinAmount, setCoinAmount] = useState("9999");
  const [loading, setLoading] = useState(false);

  const setCoins = async () => {
    if (!actor) return;
    setLoading(true);
    try {
      const newProfile = { ...profile, coins: BigInt(coinAmount) };
      await actor.saveCallerUserProfile(newProfile);
      onProfileUpdate(newProfile);
      toast.success(`💀 Hacked! Coins set to ${coinAmount}`);
    } catch {
      toast.error("Hack failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="text-center space-y-2">
        <div className="text-6xl">💀</div>
        <h1 className="font-display text-3xl font-bold text-accent neon-pink">
          LOYAK HACKS
        </h1>
        <p className="text-muted-foreground">Only for the chosen one.</p>
      </div>
      <div className="bg-card border border-accent/30 rounded-2xl p-6 space-y-4 glow-card-pink">
        <h2 className="font-display text-xl text-accent">
          💰 Set Coin Balance
        </h2>
        <Input
          type="number"
          value={coinAmount}
          onChange={(e) => setCoinAmount(e.target.value)}
          className="h-12 text-lg bg-input rounded-xl"
          data-ocid="hacks.input"
        />
        <Button
          onClick={setCoins}
          disabled={loading}
          className="w-full h-12 bg-accent text-accent-foreground font-bold rounded-xl"
          data-ocid="hacks.primary_button"
        >
          {loading ? "Hacking..." : "💀 EXECUTE HACK"}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Current balance: {profile.coins.toString()} coins
        </p>
      </div>
    </div>
  );
}
