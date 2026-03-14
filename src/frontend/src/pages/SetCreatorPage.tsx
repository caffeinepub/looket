import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import type { Question, backendInterface } from "../backend.d";

interface LocalQuestion {
  prompt: string;
  choices: [string, string, string, string];
  correctIndex: number;
}

export function SetCreatorPage({
  actor,
  onDone,
}: {
  actor: backendInterface | null;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [questions, setQuestions] = useState<LocalQuestion[]>([
    { prompt: "", choices: ["", "", "", ""], correctIndex: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      { prompt: "", choices: ["", "", "", ""], correctIndex: 0 },
    ]);
  };

  const removeQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, updates: Partial<LocalQuestion>) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)),
    );
  };

  const updateChoice = (qIdx: number, cIdx: number, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const choices = [...q.choices] as [string, string, string, string];
        choices[cIdx] = value;
        return { ...q, choices };
      }),
    );
  };

  const handleSubmit = async () => {
    if (!actor) return;
    if (!title.trim()) {
      toast.error("Please enter a title.");
      return;
    }
    if (questions.some((q) => !q.prompt.trim())) {
      toast.error("All questions need a prompt.");
      return;
    }
    if (questions.some((q) => q.choices.some((c) => !c.trim()))) {
      toast.error("All choices must be filled in.");
      return;
    }

    setSubmitting(true);
    try {
      const formatted: Question[] = questions.map((q, idx) => ({
        id: BigInt(idx),
        prompt: q.prompt,
        choices: q.choices,
        correctIndex: BigInt(q.correctIndex),
      }));
      await actor.submitQuestionSet(title.trim(), formatted);
      toast.success("Question set created! 🎉");
      onDone();
    } catch {
      toast.error("Failed to create set. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onDone}
          data-ocid="creator.cancel_button"
        >
          ← Back
        </Button>
        <h1 className="font-display text-3xl font-bold">✏️ Create Set</h1>
      </div>

      <div className="space-y-2">
        <label htmlFor="set-title" className="text-sm font-medium">
          Set Title
        </label>
        <Input
          placeholder="e.g. World History Chapter 5"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          id="set-title"
          className="h-12 text-lg bg-card border-border rounded-xl"
          data-ocid="creator.input"
        />
      </div>

      <div className="space-y-4">
        {questions.map((q, qIdx) => (
          <Card
            key={`q-${qIdx}-${q.prompt.slice(0, 10)}`}
            className="bg-card border-border rounded-2xl"
            data-ocid={`creator.item.${qIdx + 1}`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-base">
                  Question {qIdx + 1}
                </CardTitle>
                {questions.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeQuestion(qIdx)}
                    className="text-destructive hover:text-destructive"
                    data-ocid={`creator.item.${qIdx + 1}.delete_button`}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                placeholder="Question prompt..."
                value={q.prompt}
                onChange={(e) =>
                  updateQuestion(qIdx, { prompt: e.target.value })
                }
                className="bg-input border-border rounded-xl"
                data-ocid={`creator.item.${qIdx + 1}.input`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {([0, 1, 2, 3] as const).map((ci) => (
                  <div
                    key={`choice-${qIdx}-${ci}`}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={q.correctIndex === ci}
                      onChange={() =>
                        updateQuestion(qIdx, { correctIndex: ci })
                      }
                      className="accent-primary"
                      data-ocid={`creator.item.${qIdx + 1}.radio`}
                    />
                    <Input
                      placeholder={`Choice ${ci + 1}${q.correctIndex === ci ? " ✓" : ""}`}
                      value={q.choices[ci]}
                      onChange={(e) => updateChoice(qIdx, ci, e.target.value)}
                      className={`bg-input rounded-xl ${
                        q.correctIndex === ci
                          ? "border-primary/60"
                          : "border-border"
                      }`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Select the radio button next to the correct answer.
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={addQuestion}
          className="flex-1 border-border rounded-xl"
          data-ocid="creator.secondary_button"
        >
          + Add Question
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 bg-primary text-primary-foreground rounded-xl font-display font-bold"
          data-ocid="creator.submit_button"
        >
          {submitting ? "Saving..." : "🚀 Publish Set"}
        </Button>
      </div>
    </div>
  );
}
