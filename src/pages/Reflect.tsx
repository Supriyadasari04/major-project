import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  addReflection,
  addJournalEntry,
  getReflections,
  getJournalEntries,
  getTodayString,
  getHabits,
  getTasks,
  getChatHistory,
  updateJournalEntry,
  deleteJournalEntry,
  getMoodLogsByMonth,
} from "@/lib/storage";

import type { MoodLog } from "@/lib/storage";

import { generateJournalEntry, generateReflectionPrompts } from "@/lib/gemini";
import { toast } from "@/hooks/use-toast";

import {
  Target,
  MessageCircle,
  Sparkles,
  Moon,
  User,
  BookOpen,
  Loader2,
} from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const moods = [
  { value: "great", emoji: "😄", label: "Great" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "okay", emoji: "😐", label: "Okay" },
  { value: "low", emoji: "😔", label: "Low" },
  { value: "difficult", emoji: "😢", label: "Difficult" },
] as const;

const EMOTIONS = [
  "Joy",
  "Sadness",
  "Anger",
  "Fear",
  "Disgust",
  "Surprise",
  "Neutral",
] as const;

const emotionToNumber: Record<string, number> = {
  Disgust: 1,
  Anger: 2,
  Sadness: 3,
  Fear: 4,
  Neutral: 5,
  Surprise: 6,
  Joy: 7,
};

const numberToEmotion: Record<number, string> = {
  1: "Disgust",
  2: "Anger",
  3: "Sadness",
  4: "Fear",
  5: "Neutral",
  6: "Surprise",
  7: "Joy",
};

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const formatMonthYear = (year: number, month: number) => {
  return `${monthNames[month - 1]} ${year}`;
};

const Reflect = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [mood, setMood] = useState<typeof moods[number]["value"]>("good");
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [lessons, setLessons] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);

  const today = getTodayString();

  const [journals, setJournals] = useState<any[]>([]);
  const [reflections, setReflections] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);

  const [activeJournal, setActiveJournal] = useState<any | null>(null);
  const [isJournalOpen, setIsJournalOpen] = useState(false);
  const [isEditingJournal, setIsEditingJournal] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);

  const [journalSort, setJournalSort] = useState<"latest" | "oldest">("latest");

  const [moodLogs, setMoodLogs] = useState<MoodLog[]>([]);
  const [activeMoodLog, setActiveMoodLog] = useState<MoodLog | null>(null);
  const [isMoodDetailOpen, setIsMoodDetailOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setIsPageLoading(true);

        const [dbJournals, dbReflections] = await Promise.all([
          getJournalEntries(),
          getReflections(),
        ]);

        setJournals(dbJournals);
        setReflections(dbReflections);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to load journal/reflections",
          variant: "destructive",
        });
      } finally {
        setIsPageLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const loadMood = async () => {
      try {
        const logs = await getMoodLogsByMonth(selectedYear, selectedMonth);
        setMoodLogs(logs);
      } catch (e) {
        console.error(e);
        setMoodLogs([]);
      }
    };

    loadMood();
  }, [selectedYear, selectedMonth]);

  const loadPrompts = async () => {
    try {
      const [tasks, habits] = await Promise.all([getTasks(today), getHabits()]);

      const generated = await generateReflectionPrompts(
        mood,
        tasks.filter((t) => t.completed).length,
        habits.map((h) => h.title)
      );

      setPrompts(generated);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to generate prompts",
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    setIsLoading(true);

    try {
      const reflection = await addReflection({
        date: today,
        wins: wins.split("\n").filter(Boolean),
        challenges: challenges.split("\n").filter(Boolean),
        gratitude: [],
        lessonsLearned: lessons,
        mood,
        energyLevel: 5,
      });

      const tasks = await getTasks(today);
      const chatHistory = await getChatHistory();

      const journalContent = await generateJournalEntry(
        (chatHistory ?? [])
          .slice(-10)
          .map((m) => ({ role: m.role, content: m.content })),
        {
          wins: reflection.wins,
          challenges: reflection.challenges,
          mood,
          lessonsLearned: lessons,
        },
        tasks.filter((t) => t.completed).length,
        tasks.length
      );

      await addJournalEntry({
        date: today,
        content: journalContent,
        mood,
        tags: [],
        autoGenerated: true,
        reflectionSummary: lessons,
      });

      setJournals(await getJournalEntries());

      toast({
        title: "Reflection saved!",
        description: "Your journal entry has been created.",
      });

      setIsOpen(false);
      setWins("");
      setChallenges("");
      setLessons("");
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to save reflection.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedJournals = useMemo(() => {
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const monthEnd = new Date(selectedYear, selectedMonth, 1);

    const filtered = journals.filter((j) => {
      const d = new Date(j.date);
      return d >= monthStart && d < monthEnd;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aa = new Date(a.created_at ?? a.createdAt ?? a.date).getTime();
      const bb = new Date(b.created_at ?? b.createdAt ?? b.date).getTime();
      return journalSort === "latest" ? bb - aa : aa - bb;
    });

    return sorted.slice(0, 7);
  }, [journals, selectedYear, selectedMonth, journalSort]);

  const chartData = useMemo(() => {
    return moodLogs.map((m) => {
      const label = m.emotionLabel ?? "Neutral";

      return {
        id: m.id,
        emotionValue: emotionToNumber[label] ?? 5,
        raw: m,
      };
    });
  }, [moodLogs]);

  if (isPageLoading) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-calm pb-24">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-foreground">Reflect</h1>

          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">Start Reflection</Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Evening Reflection</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div>
                  <p className="text-sm font-medium mb-2">How are you feeling?</p>

                  <div className="flex gap-2">
                    {moods.map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setMood(m.value)}
                        className={`flex-1 p-2 rounded-lg border-2 transition-all ${
                          mood === m.value
                            ? "border-primary bg-primary/10"
                            : "border-border"
                        }`}
                      >
                        <span className="text-2xl">{m.emoji}</span>
                        <p className="text-xs mt-1">{m.label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">What went well today?</p>
                  <Textarea
                    value={wins}
                    onChange={(e) => setWins(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">What challenges did you face?</p>
                  <Textarea
                    value={challenges}
                    onChange={(e) => setChallenges(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">What did you learn?</p>
                  <Textarea
                    value={lessons}
                    onChange={(e) => setLessons(e.target.value)}
                    rows={3}
                  />
                </div>

                {prompts.length > 0 && (
                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      💡 Reflection prompts:
                    </p>
                    {prompts.map((p, i) => (
                      <p key={i} className="text-sm text-foreground">
                        • {p}
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={loadPrompts}
                  >
                    Get Prompts
                  </Button>

                  <Button
                    variant="hero"
                    className="flex-1"
                    onClick={handleSave}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Save Reflection"
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-6">
        {/* ✅ Month / Year Filter */}
        <Card variant="soft">
          <CardContent className="py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">Month</span>

              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => setSelectedMonth(Number(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((m, idx) => (
                    <SelectItem key={m} value={String(idx + 1)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const y = now.getFullYear() - i;
                    return (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              {formatMonthYear(selectedYear, selectedMonth)}
            </p>
          </CardContent>
        </Card>

        {/* ✅ Mood Graph */}
        <Card variant="soft">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4" /> Mood Graph
            </CardTitle>
          </CardHeader>

          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No mood logs found for this month yet.
              </p>
            ) : (
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis hide dataKey="id" />
                    <YAxis hide domain={[1, 7]} />
                    <Tooltip
                      formatter={(_: any, __: any, props: any) => {
                        const value = props?.payload?.emotionValue ?? 5;
                        return [numberToEmotion[value] ?? "Neutral", "Emotion"];
                      }}
                      labelFormatter={() => ""}
                    />
                    <Line
                      type="monotone"
                      dataKey="emotionValue"
                      dot={{ r: 4 }}
                      activeDot={{
                        r: 6,
                        onClick: (_: any, payload: any) => {
                          const p = payload?.payload;
                          if (!p?.raw) return;
                          setActiveMoodLog(p.raw);
                          setIsMoodDetailOpen(true);
                        },
                      }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ✅ Mood Detail Dialog */}
        <Dialog open={isMoodDetailOpen} onOpenChange={setIsMoodDetailOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Mood Detail</DialogTitle>
            </DialogHeader>

            {!activeMoodLog ? (
              <p className="text-sm text-muted-foreground">No mood selected.</p>
            ) : (
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="text-muted-foreground">Detected emotion</p>
                  <p className="font-medium text-foreground">
                    {activeMoodLog.emotionLabel ?? "Neutral"}
                  </p>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground">Your message</p>
                  <div className="rounded-lg border border-border p-3 bg-background">
                    <p className="text-foreground whitespace-pre-wrap">
                      {activeMoodLog.inputText ?? "(No input text stored)"}
                    </p>
                  </div>
                </div>

                <div className="text-sm">
                  <p className="text-muted-foreground mb-2">
                    Emotion probabilities
                  </p>
                  <div className="space-y-2">
                    {EMOTIONS.map((e) => {
                      const v = Number(activeMoodLog.emotionScores?.[e] ?? 0);
                      const percent = Math.round(v * 100);
                      return (
                        <div
                          key={e}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">{e}</span>
                          <span className="text-muted-foreground">
                            {percent}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ✅ Journal Header + Sort */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BookOpen className="h-5 w-5" /> Journal
          </h2>

          <Select
            value={journalSort}
            onValueChange={(v: any) => setJournalSort(v)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAndSortedJournals.length === 0 ? (
          <Card variant="soft">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">
                No journals for this month yet. Save a reflection to create one.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedJournals.map((j) => (
              <button
                key={j.id}
                onClick={() => {
                  setActiveJournal(j);
                  setEditedContent(j.content);
                  setIsEditingJournal(false);
                  setIsJournalOpen(true);
                }}
                className="w-full text-left"
              >
                <Card className="hover:bg-secondary/30 transition-colors">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span>{new Date(j.date).toLocaleDateString()}</span>
                      <span>{moods.find((m) => m.value === j.mood)?.emoji}</span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {j.content}
                    </p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        )}

        {/* ✅ Journal Dialog */}
        <Dialog open={isJournalOpen} onOpenChange={setIsJournalOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {activeJournal?.date
                  ? new Date(activeJournal.date).toLocaleDateString()
                  : "Journal Entry"}
              </DialogTitle>
            </DialogHeader>

            {!activeJournal ? (
              <p className="text-sm text-muted-foreground">No entry selected.</p>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-muted-foreground">
                    Mood: {moods.find((m) => m.value === activeJournal.mood)?.emoji}
                  </p>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingJournal((p) => !p)}
                    >
                      {isEditingJournal ? "Cancel" : "Edit"}
                    </Button>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        try {
                          await deleteJournalEntry(activeJournal.id);
                          setJournals(await getJournalEntries());
                          setIsJournalOpen(false);
                          toast({
                            title: "Deleted",
                            description: "Journal entry removed successfully.",
                          });
                        } catch (err) {
                          console.error(err);
                          toast({
                            title: "Error",
                            description: "Failed to delete journal entry.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                {isEditingJournal ? (
                  <>
                    <Textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={10}
                    />

                    <Button
                      variant="hero"
                      onClick={async () => {
                        try {
                          const updated = await updateJournalEntry(
                            activeJournal.id,
                            { content: editedContent }
                          );
                          setActiveJournal(updated);
                          setJournals(await getJournalEntries());
                          setIsEditingJournal(false);
                          toast({
                            title: "Saved",
                            description: "Journal entry updated.",
                          });
                        } catch (err) {
                          console.error(err);
                          toast({
                            title: "Error",
                            description: "Failed to update journal entry.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
                    {activeJournal.content}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-3">
            <Link
              to="/home"
              className="flex flex-col items-center text-muted-foreground hover:text-primary"
            >
              <Target className="h-5 w-5" />
              <span className="text-xs mt-1">Home</span>
            </Link>

            <Link
              to="/coach"
              className="flex flex-col items-center text-muted-foreground hover:text-primary"
            >
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs mt-1">Coach</span>
            </Link>

            <Link
              to="/habits"
              className="flex flex-col items-center text-muted-foreground hover:text-primary"
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs mt-1">Habits</span>
            </Link>

            <Link to="/reflect" className="flex flex-col items-center text-primary">
              <Moon className="h-5 w-5" />
              <span className="text-xs mt-1">Reflect</span>
            </Link>

            <Link
              to="/profile"
              className="flex flex-col items-center text-muted-foreground hover:text-primary"
            >
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Reflect;
