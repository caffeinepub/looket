import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { toast } from "sonner";
import type { QuestionSet, UserProfile, backendInterface } from "../backend.d";

export function FishingFrenzy({
  questionSet,
  onBack,
  profile,
  onProfileUpdate,
  actor,
  showAnswers,
}: {
  questionSet: QuestionSet;
  onBack: () => void;
  profile: UserProfile;
  onProfileUpdate: (p: UserProfile) => void;
  actor: backendInterface | null;
  showAnswers?: boolean;
}) {
  const questions = questionSet.questions.slice(0, 10);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [fishState, setFishState] = useState<"idle" | "caught" | "escaped">(
    "idle",
  );
  const [saving, setSaving] = useState(false);

  const current = questions[currentIdx];

  const handleAnswer = async (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === Number(current.correctIndex);
    if (correct) {
      setScore((s) => s + 1);
      setCoinsEarned((c) => c + 10);
      setFishState("caught");
      toast.success("🐟 Fish caught! +10 coins");
    } else {
      setFishState("escaped");
      toast.error("🌊 Fish escaped!");
    }
    setTimeout(() => {
      setFishState("idle");
      if (currentIdx < questions.length - 1) {
        setCurrentIdx((i) => i + 1);
        setSelected(null);
      } else {
        setDone(true);
      }
    }, 1200);
  };

  const handleFinish = async () => {
    if (!actor) {
      onBack();
      return;
    }
    setSaving(true);
    try {
      const newCoins = profile.coins + BigInt(coinsEarned);
      const newProfile = { ...profile, coins: newCoins };
      await actor.saveCallerUserProfile(newProfile);
      onProfileUpdate(newProfile);
      toast.success(`🎉 +${coinsEarned} coins added to your wallet!`);
    } catch {
      toast.error("Failed to save coins.");
    } finally {
      setSaving(false);
      onBack();
    }
  };

  if (done) {
    return (
      <div
        className="min-h-[60vh] flex flex-col items-center justify-center space-y-6"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.18 0.05 220) 0%, oklch(0.09 0.01 260) 100%)",
        }}
      >
        <div className="text-7xl animate-float">🏆</div>
        <h2 className="font-display text-4xl font-bold text-primary neon-cyan">
          Game Over!
        </h2>
        <div className="bg-card/80 border border-border rounded-2xl p-6 text-center space-y-2 min-w-64">
          <p className="text-muted-foreground">Final Score</p>
          <p className="font-display text-5xl font-bold text-foreground">
            {score}/{questions.length}
          </p>
          <p className="text-yellow-300 font-bold text-2xl">
            +{coinsEarned} 🪙
          </p>
        </div>
        <Button
          onClick={handleFinish}
          disabled={saving}
          className="bg-primary text-primary-foreground rounded-xl font-display font-bold px-8 h-12"
          data-ocid="fishing.primary_button"
        >
          {saving ? "Saving..." : "Claim Coins & Exit"}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-[80vh] rounded-2xl overflow-hidden relative"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.25 0.08 220) 0%, oklch(0.15 0.05 220) 50%, oklch(0.1 0.03 230) 100%)",
      }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 h-32 opacity-20"
        style={{
          background:
            "repeating-linear-gradient(90deg, oklch(0.6 0.15 200) 0px, transparent 20px, oklch(0.6 0.15 200) 40px)",
        }}
      />

      <div className="relative z-10 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-foreground/70"
            data-ocid="fishing.cancel_button"
          >
            ← Exit
          </Button>
          <div className="text-center">
            <h1 className="font-display text-xl font-bold">
              🎣 Fishing Frenzy
            </h1>
            <p className="text-sm text-foreground/70">
              {currentIdx + 1} / {questions.length}
            </p>
          </div>
          <div className="text-right">
            <p className="text-yellow-300 font-bold">🪙 {coinsEarned}</p>
          </div>
        </div>

        <Progress
          value={(currentIdx / questions.length) * 100}
          className="h-2"
        />

        <div className="flex justify-center items-center h-24">
          {fishState === "idle" && (
            <div className="text-6xl animate-fish-swim">🐟</div>
          )}
          {fishState === "caught" && (
            <div className="text-6xl animate-bounce">🎣✨</div>
          )}
          {fishState === "escaped" && (
            <div
              className="text-6xl"
              style={{ animation: "glitch 0.3s ease-in-out 3" }}
            >
              💨
            </div>
          )}
        </div>

        <div className="bg-card/70 border border-border/50 rounded-2xl p-6 backdrop-blur-sm">
          <p className="font-display text-xl font-bold text-center mb-4">
            {current.prompt}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {current.choices.map((choice, idx) => {
              const isCorrect = idx === Number(current.correctIndex);
              let btnClass =
                "w-full p-4 rounded-xl border text-left font-medium transition-all ";
              if (selected === null) {
                if (showAnswers && isCorrect) {
                  btnClass +=
                    "border-green-400 bg-green-500/10 shadow-[0_0_12px_2px_oklch(0.65_0.2_145)]";
                } else {
                  btnClass +=
                    "border-border bg-card/60 hover:bg-primary/20 hover:border-primary/50";
                }
              } else if (isCorrect) {
                btnClass += "border-green-500 bg-green-500/20 text-green-300";
              } else if (idx === selected) {
                btnClass +=
                  "border-destructive bg-destructive/20 text-destructive";
              } else {
                btnClass += "border-border bg-card/30 opacity-50";
              }
              return (
                <button
                  type="button"
                  key={choice}
                  onClick={() => handleAnswer(idx)}
                  disabled={selected !== null}
                  className={btnClass}
                  data-ocid={`fishing.item.${idx + 1}.button`}
                >
                  {String.fromCharCode(65 + idx)}. {choice}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
