import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type {
  QuestionSet,
  RoomState,
  UserProfile,
  backendInterface,
} from "../backend.d";

type Stage =
  | "lobby-select"
  | "create-waiting"
  | "join-input"
  | "game-active"
  | "game-finished";

export function MultiplayerPage({
  actor,
  profile,
}: {
  actor: backendInterface | null;
  profile: UserProfile;
}) {
  const [stage, setStage] = useState<Stage>("lobby-select");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [questionSet, setQuestionSet] = useState<QuestionSet | null>(null);
  const [mySets, setMySets] = useState<QuestionSet[]>([]);
  const [loadingSets, setLoadingSets] = useState(false);
  const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [answering, setAnswering] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isHost = roomState?.hostName === profile.name;

  // Load user's question sets
  useEffect(() => {
    const load = async () => {
      if (!actor) return;
      setLoadingSets(true);
      try {
        const sets = await actor.searchQuestionSets("");
        setMySets(sets);
      } catch {
        setMySets([]);
      } finally {
        setLoadingSets(false);
      }
    };
    load();
  }, [actor]);

  // Poll room state
  const startPolling = (code: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      if (!actor) return;
      try {
        const state = await actor.getRoomState(code);
        if (state) {
          setRoomState(state);
          if (
            state.status === "active" &&
            (stage === "create-waiting" || stage === "join-input")
          ) {
            // fetch question set
            const qs = await actor.getQuestionSet(state.questionSetId);
            if (qs) setQuestionSet(qs);
            setStage("game-active");
            setSelectedAnswer(null);
          } else if (state.status === "finished") {
            setStage("game-finished");
            if (pollRef.current) clearInterval(pollRef.current);
          }
        }
      } catch {}
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleCreateRoom = async () => {
    if (!actor || !selectedSet) return;
    setCreating(true);
    try {
      const code = await actor.createRoom(selectedSet.id);
      setRoomCode(code);
      const state = await actor.getRoomState(code);
      if (state) setRoomState(state);
      setStage("create-waiting");
      startPolling(code);
      toast.success(`Room created! Code: ${code}`);
    } catch {
      toast.error("Failed to create room.");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!actor || !joinCode.trim()) return;
    setJoining(true);
    try {
      const code = joinCode.trim().toUpperCase();
      await actor.joinRoom(code);
      setRoomCode(code);
      const state = await actor.getRoomState(code);
      if (state) setRoomState(state);
      setStage("join-input");
      startPolling(code);
      toast.success("Joined room!");
    } catch {
      toast.error("Failed to join. Check the code.");
    } finally {
      setJoining(false);
    }
  };

  const handleStartGame = async () => {
    if (!actor || !roomCode) return;
    setStarting(true);
    try {
      await actor.startRoom(roomCode);
      const qs = roomState
        ? await actor.getQuestionSet(roomState.questionSetId)
        : null;
      if (qs) setQuestionSet(qs);
      toast.success("Game started!");
    } catch {
      toast.error("Failed to start game.");
    } finally {
      setStarting(false);
    }
  };

  const handleAnswer = async (answerIdx: number) => {
    if (!actor || !roomState || answering || selectedAnswer !== null) return;
    setSelectedAnswer(answerIdx);
    setAnswering(true);
    try {
      await actor.submitRoomAnswer(
        roomCode,
        roomState.currentQuestion,
        BigInt(answerIdx),
      );
      const q = questionSet?.questions[Number(roomState.currentQuestion)];
      const correct = q && answerIdx === Number(q.correctIndex);
      if (correct) toast.success("✅ Correct!");
      else toast.error("❌ Wrong!");
    } catch {
      toast.error("Failed to submit answer.");
    } finally {
      setAnswering(false);
    }
  };

  const handleNextQuestion = async () => {
    if (!actor || !roomCode) return;
    try {
      await actor.nextQuestion(roomCode);
      setSelectedAnswer(null);
    } catch {
      toast.error("Failed to advance.");
    }
  };

  const handleLeave = async () => {
    if (!actor || !roomCode) return;
    setLeaving(true);
    try {
      await actor.leaveRoom(roomCode);
    } catch {}
    if (pollRef.current) clearInterval(pollRef.current);
    setStage("lobby-select");
    setRoomCode("");
    setRoomState(null);
    setQuestionSet(null);
    setLeaving(false);
  };

  // ---- RENDER ----

  if (stage === "lobby-select") {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="text-6xl">🎮</div>
          <h1 className="font-display text-4xl font-bold text-primary neon-cyan">
            Multiplayer
          </h1>
          <p className="text-muted-foreground">
            Create a room or join one with a code
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Create Room */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 glow-card">
            <h2 className="font-display text-xl font-bold">🏠 Create Room</h2>
            <p className="text-sm text-muted-foreground">
              Pick a question set and get a room code to share
            </p>
            {loadingSets ? (
              <p className="text-muted-foreground text-sm">
                Loading your sets...
              </p>
            ) : mySets.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No question sets found. Create one first!
              </p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {mySets.map((qs) => (
                  <button
                    key={qs.id.toString()}
                    type="button"
                    onClick={() => setSelectedSet(qs)}
                    className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                      selectedSet?.id === qs.id
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-muted/20 hover:bg-muted/40"
                    }`}
                    data-ocid="multiplayer.secondary_button"
                  >
                    📚 {qs.title}
                  </button>
                ))}
              </div>
            )}
            <Button
              onClick={handleCreateRoom}
              disabled={creating || !selectedSet}
              className="w-full bg-primary text-primary-foreground rounded-xl font-bold"
              data-ocid="multiplayer.primary_button"
            >
              {creating ? "Creating..." : "🚀 Create Room"}
            </Button>
          </div>

          {/* Join Room */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-4 glow-card">
            <h2 className="font-display text-xl font-bold">🔑 Join Room</h2>
            <p className="text-sm text-muted-foreground">
              Enter the 6-character room code to join
            </p>
            <Input
              placeholder="Room code (e.g. ABC123)"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="bg-input rounded-xl text-center text-2xl font-mono tracking-widest uppercase h-14"
              data-ocid="multiplayer.input"
            />
            <Button
              onClick={handleJoinRoom}
              disabled={joining || joinCode.trim().length < 4}
              className="w-full bg-accent text-accent-foreground rounded-xl font-bold"
              data-ocid="multiplayer.submit_button"
            >
              {joining ? "Joining..." : "🎯 Join Room"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Waiting lobby (host)
  if (stage === "create-waiting") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-3">
          <h1 className="font-display text-3xl font-bold text-primary">
            Your Room
          </h1>
          <div className="bg-card border border-primary/40 rounded-2xl p-6">
            <p className="text-muted-foreground text-sm mb-2">
              Share this code with friends:
            </p>
            <div className="font-mono text-5xl font-bold tracking-widest text-primary neon-cyan mb-3">
              {roomCode}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(roomCode);
                toast.success("Code copied!");
              }}
              className="border-primary/30 text-primary"
              data-ocid="multiplayer.secondary_button"
            >
              📋 Copy Code
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-xl font-bold">
            👥 Players ({roomState?.players.length ?? 0})
          </h2>
          {roomState?.players.map((p, i) => (
            <div
              key={p.name}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/20"
              data-ocid={`multiplayer.item.${i + 1}`}
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{p.name}</span>
              {p.name === roomState.hostName && (
                <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                  Host
                </Badge>
              )}
            </div>
          ))}
          {!roomState?.players.length && (
            <p className="text-muted-foreground text-sm text-center py-4">
              Waiting for players to join...
            </p>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleStartGame}
            disabled={starting || (roomState?.players.length ?? 0) < 1}
            className="flex-1 bg-primary text-primary-foreground rounded-xl font-bold h-12"
            data-ocid="multiplayer.primary_button"
          >
            {starting ? "Starting..." : "▶️ Start Game"}
          </Button>
          <Button
            onClick={handleLeave}
            variant="outline"
            className="border-destructive/50 text-destructive"
            data-ocid="multiplayer.cancel_button"
          >
            Leave
          </Button>
        </div>
      </div>
    );
  }

  // Waiting lobby (joiner)
  if (stage === "join-input") {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl animate-pulse">⏳</div>
          <h1 className="font-display text-3xl font-bold">
            Waiting for Host...
          </h1>
          <p className="text-muted-foreground">
            Room:{" "}
            <span className="font-mono font-bold text-primary">{roomCode}</span>
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-display text-xl font-bold">
            👥 Players ({roomState?.players.length ?? 0})
          </h2>
          {roomState?.players.map((p, i) => (
            <div
              key={p.name}
              className="flex items-center gap-2 p-2 rounded-lg bg-muted/20"
              data-ocid={`multiplayer.item.${i + 1}`}
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {p.name.charAt(0).toUpperCase()}
              </div>
              <span className="font-medium">{p.name}</span>
              {p.name === roomState?.hostName && (
                <Badge className="bg-accent/20 text-accent border-accent/30 text-xs">
                  Host
                </Badge>
              )}
            </div>
          ))}
        </div>

        <Button
          onClick={handleLeave}
          variant="outline"
          className="w-full border-destructive/50 text-destructive"
          data-ocid="multiplayer.cancel_button"
        >
          Leave Room
        </Button>
      </div>
    );
  }

  // Active game
  if (stage === "game-active" && roomState && questionSet) {
    const qIdx = Number(roomState.currentQuestion);
    const question = questionSet.questions[qIdx];
    const sortedPlayers = [...roomState.players].sort((a, b) =>
      Number(b.score - a.score),
    );

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-primary">
              🎮 Live Game
            </h1>
            <p className="text-sm text-muted-foreground">
              Room: <span className="font-mono">{roomCode}</span>
            </p>
          </div>
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Q {qIdx + 1} / {questionSet.questions.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <p className="font-display text-xl font-bold mb-5">
                {question?.prompt}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question?.choices.map((choice, idx) => {
                  let cls =
                    "w-full p-4 rounded-xl border text-left font-medium transition-all ";
                  if (selectedAnswer === null) {
                    cls +=
                      "border-border bg-card/60 hover:bg-primary/20 hover:border-primary/50";
                  } else if (idx === Number(question.correctIndex)) {
                    cls += "border-green-500 bg-green-500/20 text-green-300";
                  } else if (idx === selectedAnswer) {
                    cls +=
                      "border-destructive bg-destructive/20 text-destructive";
                  } else {
                    cls += "border-border bg-card/30 opacity-50";
                  }
                  return (
                    <button
                      key={choice}
                      type="button"
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedAnswer !== null || answering}
                      className={cls}
                      data-ocid={`multiplayer.item.${idx + 1}.button`}
                    >
                      {String.fromCharCode(65 + idx)}. {choice}
                    </button>
                  );
                })}
              </div>
            </div>

            {isHost && (
              <Button
                onClick={handleNextQuestion}
                className="w-full bg-primary text-primary-foreground rounded-xl font-bold"
                data-ocid="multiplayer.primary_button"
              >
                ⏭️ Next Question
              </Button>
            )}
          </div>

          {/* Scoreboard */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h3 className="font-display text-lg font-bold">🏆 Scoreboard</h3>
            {sortedPlayers.map((p, i) => (
              <div
                key={p.name}
                className="flex items-center gap-2"
                data-ocid={`multiplayer.item.${i + 1}`}
              >
                <span className="text-lg">
                  {i === 0
                    ? "🥇"
                    : i === 1
                      ? "🥈"
                      : i === 2
                        ? "🥉"
                        : `${i + 1}.`}
                </span>
                <span className="flex-1 text-sm font-medium truncate">
                  {p.name}
                </span>
                <span className="text-sm font-bold text-primary">
                  {p.score.toString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Finished
  if (stage === "game-finished" && roomState) {
    const sortedPlayers = [...roomState.players].sort((a, b) =>
      Number(b.score - a.score),
    );
    return (
      <div className="max-w-xl mx-auto space-y-8 text-center">
        <div className="space-y-3">
          <div className="text-7xl animate-float">🏆</div>
          <h1 className="font-display text-4xl font-bold text-primary neon-cyan">
            Game Over!
          </h1>
          <p className="text-muted-foreground">Final Standings</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
          {sortedPlayers.map((p, i) => (
            <div
              key={p.name}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                i === 0
                  ? "bg-yellow-500/10 border border-yellow-500/30"
                  : "bg-muted/20"
              }`}
              data-ocid={`multiplayer.item.${i + 1}`}
            >
              <span className="text-2xl">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`}
              </span>
              <span className="flex-1 font-bold text-lg text-left">
                {p.name}
              </span>
              <span className="font-bold text-xl text-primary">
                {p.score.toString()} pts
              </span>
            </div>
          ))}
        </div>

        <Button
          onClick={handleLeave}
          disabled={leaving}
          className="bg-primary text-primary-foreground rounded-xl font-bold px-8 h-12"
          data-ocid="multiplayer.primary_button"
        >
          {leaving ? "Leaving..." : "🚪 Leave Room"}
        </Button>
      </div>
    );
  }

  return null;
}
