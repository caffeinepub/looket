import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import type { QuestionSet } from "../backend.d";

export function StudyMode({
  questionSet,
  onBack,
  showAnswers,
}: {
  questionSet: QuestionSet;
  onBack: () => void;
  showAnswers?: boolean;
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);

  const questions = questionSet.questions;
  const current = questions[currentIdx];

  // Auto-flip if showAnswers is on
  const displayFlipped = showAnswers ? true : flipped;

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((i) => i + 1);
      setFlipped(false);
    } else {
      setDone(true);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx((i) => i - 1);
      setFlipped(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6">
        <div className="text-7xl animate-float">🎓</div>
        <h2 className="font-display text-4xl font-bold text-primary neon-cyan">
          Study Complete!
        </h2>
        <p className="text-muted-foreground text-lg">
          You reviewed all {questions.length} cards
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              setCurrentIdx(0);
              setFlipped(false);
              setDone(false);
            }}
            className="bg-primary/20 text-primary border border-primary/30 rounded-xl"
            data-ocid="study.secondary_button"
          >
            🔄 Study Again
          </Button>
          <Button
            onClick={onBack}
            className="bg-primary text-primary-foreground rounded-xl font-display font-bold"
            data-ocid="study.primary_button"
          >
            ✓ Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          data-ocid="study.cancel_button"
        >
          ← Exit
        </Button>
        <div className="text-center">
          <h1 className="font-display text-xl font-bold">
            📚 {questionSet.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {currentIdx + 1} / {questions.length}
          </p>
        </div>
        <div className="w-16" />
      </div>

      <Progress
        value={((currentIdx + 1) / questions.length) * 100}
        className="h-2"
      />

      <button
        type="button"
        className="relative h-64 cursor-pointer group w-full text-left"
        onClick={() => !showAnswers && setFlipped(!flipped)}
        style={{ perspective: "1000px" }}
        data-ocid="study.canvas_target"
        onKeyDown={(e) =>
          e.key === "Enter" && !showAnswers && setFlipped(!flipped)
        }
        tabIndex={0}
      >
        <div
          className="absolute inset-0 transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: displayFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          <div
            className="absolute inset-0 bg-card border border-border rounded-2xl glow-card flex flex-col items-center justify-center p-8"
            style={{ backfaceVisibility: "hidden" }}
          >
            <p className="text-2xl font-display font-bold text-center">
              {current.prompt}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Click to reveal answer
            </p>
          </div>
          <div
            className="absolute inset-0 bg-primary/10 border border-primary/40 rounded-2xl flex flex-col items-center justify-center p-8"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <p className="text-sm text-muted-foreground mb-3">Answer:</p>
            <p className="text-2xl font-display font-bold text-primary text-center">
              {current.choices[Number(current.correctIndex)]}
            </p>
            <div className="mt-4 space-y-1 w-full">
              {current.choices.map((c, i) => (
                <div
                  key={c}
                  className={`text-sm px-3 py-1 rounded-lg ${
                    i === Number(current.correctIndex)
                      ? "bg-primary/20 text-primary font-bold"
                      : "text-muted-foreground"
                  }`}
                >
                  {i === Number(current.correctIndex) ? "✓" : "○"} {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      </button>

      <div className="flex justify-between gap-3">
        <Button
          onClick={handlePrev}
          disabled={currentIdx === 0}
          variant="outline"
          className="flex-1 border-border rounded-xl"
          data-ocid="study.pagination_prev"
        >
          ← Previous
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1 bg-primary text-primary-foreground rounded-xl font-display font-bold"
          data-ocid="study.pagination_next"
        >
          {currentIdx === questions.length - 1 ? "Finish ✓" : "Next →"}
        </Button>
      </div>
    </div>
  );
}
