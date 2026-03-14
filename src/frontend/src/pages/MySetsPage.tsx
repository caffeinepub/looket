import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Identity } from "@dfinity/agent";
import { useEffect, useState } from "react";
import type { QuestionSet } from "../backend.d";
import { useActor } from "../hooks/useActor";

type GameType = "study" | "fishing" | "crypto";

export function MySetsPage({
  identity,
  onCreateNew,
  onPlayGame,
}: {
  identity: Identity | null;
  onCreateNew: () => void;
  onPlayGame: (type: GameType, qs: QuestionSet) => void;
}) {
  const { actor } = useActor();
  const [sets, setSets] = useState<QuestionSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!actor || !identity) return;
      setLoading(true);
      try {
        const myPrincipal = identity.getPrincipal().toString();
        const all = await actor.searchQuestionSets("");
        setSets(all.filter((qs) => qs.creator.toString() === myPrincipal));
      } catch {
        setSets([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [actor, identity]);

  const gameOptions: { type: GameType; label: string; emoji: string }[] = [
    { type: "study", label: "Study Mode", emoji: "📚" },
    { type: "fishing", label: "Fishing Frenzy", emoji: "🎣" },
    { type: "crypto", label: "Crypto Hack", emoji: "💻" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">📚 My Sets</h1>
        <Button
          onClick={onCreateNew}
          className="bg-primary text-primary-foreground rounded-xl font-display font-bold"
          data-ocid="mysets.primary_button"
        >
          + Create New Set
        </Button>
      </div>

      {loading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="mysets.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : sets.length === 0 ? (
        <div
          className="text-center py-16 space-y-4"
          data-ocid="mysets.empty_state"
        >
          <div className="text-6xl">📭</div>
          <p className="font-display text-xl text-muted-foreground">
            No sets yet
          </p>
          <p className="text-muted-foreground">
            Create your first question set to get started!
          </p>
          <Button
            onClick={onCreateNew}
            className="bg-primary text-primary-foreground rounded-xl"
            data-ocid="mysets.empty_state.button"
          >
            Create a Set
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((qs, idx) => (
            <Card
              key={qs.id.toString()}
              className="bg-card border-border rounded-2xl glow-card hover:border-primary/40 transition-all"
              data-ocid={`mysets.item.${idx + 1}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-lg">
                    {qs.title}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0">
                    {qs.questions.length}Q
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    setSelectedSet(qs);
                    setModalOpen(true);
                  }}
                  className="w-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl border border-primary/30"
                  data-ocid={`mysets.item.${idx + 1}.button`}
                >
                  🎮 Play
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="bg-card border-border rounded-2xl max-w-md"
          data-ocid="mysets.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              🎮 Choose Game Mode
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 pt-2">
            {gameOptions.map((opt) => (
              <button
                type="button"
                key={opt.type}
                onClick={() => {
                  if (selectedSet) {
                    setModalOpen(false);
                    onPlayGame(opt.type, selectedSet);
                  }
                }}
                className="w-full text-left p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-all"
                data-ocid={`mysets.${opt.type}.button`}
              >
                <span className="text-2xl mr-3">{opt.emoji}</span>
                <span className="font-display font-bold">{opt.label}</span>
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={() => setModalOpen(false)}
            data-ocid="mysets.dialog.close_button"
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
