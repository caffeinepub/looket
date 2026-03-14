import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useState } from "react";
import type { QuestionSet } from "../backend.d";
import { useActor } from "../hooks/useActor";

type GameType = "study" | "fishing" | "crypto";

const DEMO_SETS: QuestionSet[] = [
  {
    id: BigInt(0),
    title: "World Capitals Quiz",
    creator: { toString: () => "aaaaa-aa" } as never,
    isPublic: true,
    questions: [
      {
        id: BigInt(0),
        prompt: "What is the capital of France?",
        choices: ["Berlin", "Paris", "Madrid", "Rome"],
        correctIndex: BigInt(1),
      },
      {
        id: BigInt(1),
        prompt: "What is the capital of Japan?",
        choices: ["Beijing", "Seoul", "Tokyo", "Bangkok"],
        correctIndex: BigInt(2),
      },
      {
        id: BigInt(2),
        prompt: "What is the capital of Australia?",
        choices: ["Sydney", "Melbourne", "Brisbane", "Canberra"],
        correctIndex: BigInt(3),
      },
      {
        id: BigInt(3),
        prompt: "What is the capital of Brazil?",
        choices: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador"],
        correctIndex: BigInt(2),
      },
    ],
  },
  {
    id: BigInt(1),
    title: "Math Fundamentals",
    creator: { toString: () => "bbbbb-bb" } as never,
    isPublic: true,
    questions: [
      {
        id: BigInt(0),
        prompt: "What is 7 × 8?",
        choices: ["54", "56", "58", "64"],
        correctIndex: BigInt(1),
      },
      {
        id: BigInt(1),
        prompt: "What is the square root of 144?",
        choices: ["10", "11", "12", "13"],
        correctIndex: BigInt(2),
      },
      {
        id: BigInt(2),
        prompt: "What is 25% of 80?",
        choices: ["15", "20", "25", "30"],
        correctIndex: BigInt(1),
      },
      {
        id: BigInt(3),
        prompt: "Solve: 3x + 6 = 21. What is x?",
        choices: ["3", "4", "5", "6"],
        correctIndex: BigInt(2),
      },
    ],
  },
  {
    id: BigInt(2),
    title: "Science Basics",
    creator: { toString: () => "ccccc-cc" } as never,
    isPublic: true,
    questions: [
      {
        id: BigInt(0),
        prompt: "What is the chemical symbol for water?",
        choices: ["WA", "H2O", "HO2", "W2O"],
        correctIndex: BigInt(1),
      },
      {
        id: BigInt(1),
        prompt: "How many planets are in our solar system?",
        choices: ["7", "8", "9", "10"],
        correctIndex: BigInt(1),
      },
      {
        id: BigInt(2),
        prompt: "What is the speed of light (approx)?",
        choices: [
          "100,000 km/s",
          "300,000 km/s",
          "500,000 km/s",
          "700,000 km/s",
        ],
        correctIndex: BigInt(1),
      },
    ],
  },
];

export function HomePage({
  onPlayGame,
}: { onPlayGame: (type: GameType, qs: QuestionSet) => void }) {
  const { actor } = useActor();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<QuestionSet[]>(DEMO_SETS);
  const [searching, setSearching] = useState(false);
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const handleSearch = async () => {
    if (!actor) return;
    setSearching(true);
    try {
      const r = await actor.searchQuestionSets(query);
      setResults(r.length > 0 ? r : query === "" ? DEMO_SETS : []);
    } catch {
      setResults(DEMO_SETS);
    } finally {
      setSearching(false);
    }
  };

  const openGameModal = (qs: QuestionSet) => {
    setSelectedSet(qs);
    setModalOpen(true);
  };

  const gameOptions: {
    type: GameType;
    label: string;
    emoji: string;
    desc: string;
    color: string;
  }[] = [
    {
      type: "study",
      label: "Study Mode",
      emoji: "📚",
      desc: "Flip through flashcards at your own pace",
      color: "bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30",
    },
    {
      type: "fishing",
      label: "Fishing Frenzy",
      emoji: "🎣",
      desc: "Catch fish by answering correctly! +10 coins per catch",
      color: "bg-cyan-500/20 border-cyan-500/30 hover:bg-cyan-500/30",
    },
    {
      type: "crypto",
      label: "Crypto Hack",
      emoji: "💻",
      desc: "Hack the system with correct answers! +15 coins",
      color: "bg-green-500/20 border-green-500/30 hover:bg-green-500/30",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h1 className="font-display text-4xl md:text-5xl font-bold">
          <span className="text-primary neon-cyan">Discover</span>{" "}
          <span className="text-foreground">Sets</span>
        </h1>
        <p className="text-muted-foreground text-lg">
          Find question sets created by the community
        </p>
      </div>

      <div className="flex gap-3 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search question sets..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 h-12 bg-card border-border rounded-xl"
            data-ocid="home.search_input"
          />
        </div>
        <Button
          onClick={handleSearch}
          disabled={searching}
          className="h-12 px-6 bg-primary text-primary-foreground rounded-xl font-display font-bold"
          data-ocid="home.primary_button"
        >
          {searching ? "..." : "Search"}
        </Button>
      </div>

      {searching ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="home.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : results.length === 0 ? (
        <div
          className="text-center py-16 space-y-3"
          data-ocid="home.empty_state"
        >
          <div className="text-6xl">🔍</div>
          <p className="font-display text-xl text-muted-foreground">
            No sets found
          </p>
          <p className="text-muted-foreground">Try a different search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((qs, idx) => (
            <Card
              key={qs.id.toString()}
              className="bg-card border-border rounded-2xl glow-card hover:border-primary/40 transition-all cursor-pointer group"
              data-ocid={`home.item.${idx + 1}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="font-display text-lg leading-tight group-hover:text-primary transition-colors">
                    {qs.title}
                  </CardTitle>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {qs.questions.length}Q
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground font-mono-code truncate">
                  {qs.creator.toString().slice(0, 20)}...
                </p>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => openGameModal(qs)}
                  className="w-full bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground rounded-xl border border-primary/30 transition-all"
                  data-ocid={`home.item.${idx + 1}.button`}
                >
                  🎮 Play
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Game selection modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="bg-card border-border rounded-2xl max-w-md"
          data-ocid="home.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">
              🎮 Choose Game Mode
            </DialogTitle>
            {selectedSet && (
              <p className="text-muted-foreground">{selectedSet.title}</p>
            )}
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
                className={`w-full text-left p-4 rounded-xl border transition-all ${opt.color}`}
                data-ocid={`home.${opt.type}.button`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{opt.emoji}</span>
                  <div>
                    <p className="font-display font-bold">{opt.label}</p>
                    <p className="text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={() => setModalOpen(false)}
            className="w-full mt-1"
            data-ocid="home.dialog.close_button"
          >
            Cancel
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
