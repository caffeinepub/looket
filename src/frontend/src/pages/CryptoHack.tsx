import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { QuestionSet, UserProfile, backendInterface } from "../backend.d";

export function CryptoHack({
  questionSet,
  onBack,
  profile,
  onProfileUpdate,
  actor,
}: {
  questionSet: QuestionSet;
  onBack: () => void;
  profile: UserProfile;
  onProfileUpdate: (p: UserProfile) => void;
  actor: backendInterface | null;
}) {
  const questions = questionSet.questions.slice(0, 10);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);
  const [typedText, setTypedText] = useState("");
  const PROMPT_TEXT = "> INITIALIZING CRYPTO_HACK_v2.0...";

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= PROMPT_TEXT.length) {
        setTypedText(PROMPT_TEXT.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  const current = questions[currentIdx];

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    const correct = idx === Number(current.correctIndex);
    if (correct) {
      setScore((s) => s + 1);
      setCoinsEarned((c) => c + 15);
      setFeedback("ACCESS GRANTED");
      toast.success("✅ ACCESS GRANTED +15 coins");
    } else {
      setCoinsEarned((c) => Math.max(0, c - 5));
      setFeedback("FIREWALL BLOCKED");
      toast.error("🚫 FIREWALL BLOCKED -5 coins");
    }
    setTimeout(() => {
      setFeedback("");
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
      const newCoins = profile.coins + BigInt(Math.max(0, coinsEarned));
      const newProfile = { ...profile, coins: newCoins };
      await actor.saveCallerUserProfile(newProfile);
      onProfileUpdate(newProfile);
      toast.success(`🎉 +${coinsEarned} coins added!`);
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
        className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 font-mono"
        style={{
          background: "oklch(0.05 0.005 150)",
          color: "oklch(0.75 0.18 145)",
        }}
      >
        <pre className="text-center text-sm opacity-60">{`
 ██████╗ ██████╗ ███╗   ██╗ ██████╗ 
██╔══██╗██╔═══██╗████╗  ██║██╔════╝ 
██║  ██║██║   ██║██╔██╗ ██║██║  ███╗
██║  ██║██║   ██║██║╚██╗██║██║   ██║
██████╔╝╚██████╔╝██║ ╚████║╚██████╔╝
╚═════╝  ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝ `}</pre>
        <div
          className="border p-6 rounded-xl text-center space-y-2 min-w-64"
          style={{
            borderColor: "oklch(0.75 0.18 145)",
            background: "oklch(0.08 0.01 150)",
          }}
        >
          <p style={{ color: "oklch(0.6 0.1 145)" }}>SYSTEM BREACHED</p>
          <p className="text-4xl font-bold">
            {score}/{questions.length} nodes
          </p>
          <p className="text-2xl" style={{ color: "oklch(0.9 0.15 100)" }}>
            {coinsEarned >= 0 ? `+${coinsEarned}` : coinsEarned} 🪙
          </p>
        </div>
        <Button
          onClick={handleFinish}
          disabled={saving}
          className="font-mono font-bold px-8 h-12"
          style={{
            background: "oklch(0.75 0.18 145)",
            color: "oklch(0.05 0.005 150)",
          }}
          data-ocid="crypto.primary_button"
        >
          {saving ? "SAVING..." : "EXTRACT DATA"}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="min-h-[80vh] rounded-2xl overflow-hidden"
      style={{
        background: "oklch(0.06 0.008 150)",
        color: "oklch(0.75 0.18 145)",
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {/* Scanline effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, oklch(0.75 0.18 145) 0px, transparent 1px, transparent 3px)",
        }}
      />

      <div className="relative z-10 p-6 space-y-4">
        <div
          className="flex items-center justify-between border-b pb-3"
          style={{ borderColor: "oklch(0.2 0.03 150)" }}
        >
          <button
            type="button"
            onClick={onBack}
            className="opacity-60 hover:opacity-100 transition-opacity"
            data-ocid="crypto.cancel_button"
          >
            [EXIT]
          </button>
          <span className="text-sm opacity-60">
            NODE {currentIdx + 1}/{questions.length}
          </span>
          <span style={{ color: "oklch(0.9 0.15 100)" }}>
            💰 {coinsEarned}c
          </span>
        </div>

        <div className="text-xs opacity-50 h-5">
          {typedText}
          <span className="animate-pulse">_</span>
        </div>

        <Progress
          value={(currentIdx / questions.length) * 100}
          className="h-1"
          style={{ background: "oklch(0.12 0.01 150)" }}
        />

        {feedback && (
          <div
            className={`text-2xl font-bold text-center py-3 rounded-lg animate-reveal-up ${
              feedback === "ACCESS GRANTED" ? "" : ""
            }`}
            style={{
              color:
                feedback === "ACCESS GRANTED"
                  ? "oklch(0.75 0.18 145)"
                  : "oklch(0.65 0.22 25)",
              background:
                feedback === "ACCESS GRANTED"
                  ? "oklch(0.1 0.03 145)"
                  : "oklch(0.1 0.03 25)",
            }}
          >
            {feedback === "ACCESS GRANTED" ? "✓ " : "✗ "}
            {feedback}
          </div>
        )}

        {/* Question */}
        <div
          className="border rounded-xl p-5 space-y-4"
          style={{
            borderColor: "oklch(0.2 0.03 150)",
            background: "oklch(0.08 0.01 150)",
          }}
        >
          <p className="text-xs opacity-50">
            {"// SECURITY QUESTION DETECTED"}
          </p>
          <p className="text-lg font-bold leading-snug">{current.prompt}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {current.choices.map((choice, idx) => {
              let style: React.CSSProperties = {
                background: "oklch(0.1 0.01 150)",
                borderColor: "oklch(0.2 0.03 150)",
                color: "oklch(0.75 0.18 145)",
              };
              if (selected !== null) {
                if (idx === Number(current.correctIndex)) {
                  style = {
                    background: "oklch(0.12 0.06 145)",
                    borderColor: "oklch(0.5 0.18 145)",
                    color: "oklch(0.75 0.18 145)",
                  };
                } else if (idx === selected) {
                  style = {
                    background: "oklch(0.1 0.05 25)",
                    borderColor: "oklch(0.5 0.18 25)",
                    color: "oklch(0.65 0.22 25)",
                  };
                } else {
                  style = {
                    background: "oklch(0.08 0.005 150)",
                    borderColor: "oklch(0.12 0.01 150)",
                    color: "oklch(0.4 0.05 150)",
                    opacity: 0.5,
                  };
                }
              }
              return (
                <button
                  type="button"
                  key={choice}
                  onClick={() => handleAnswer(idx)}
                  disabled={selected !== null}
                  className="p-3 rounded-lg border text-left text-sm font-mono transition-all hover:brightness-125"
                  style={style}
                  data-ocid={`crypto.item.${idx + 1}.button`}
                >
                  [{String.fromCharCode(65 + idx)}] {choice}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
