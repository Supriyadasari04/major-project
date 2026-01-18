import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getGoals, updateGoal } from "@/lib/storage";
import type { Goal } from "@/lib/storage";

import {
  Target,
  MessageCircle,
  Sparkles,
  Moon,
  User,
  ArrowLeft,
  Save,
  Loader2,
} from "lucide-react";

import { Slider } from "@/components/ui/slider";


const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const Goals = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
const [draftProgress, setDraftProgress] = useState<Record<string, number>>({});
const [saveStatus, setSaveStatus] = useState<Record<string, "idle" | "saving" | "saved" | "error">>({});

useEffect(() => {
  const timers: Record<string, any> = {};

  Object.entries(draftProgress).forEach(([goalId, value]) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    if (goal.progress === value) return;
    if (timers[goalId]) clearTimeout(timers[goalId]);

    timers[goalId] = setTimeout(async () => {
      try {
        setSaveStatus((prev) => ({ ...prev, [goalId]: "saving" }));

        const updated = await updateGoal(goalId, { progress: value });

        setGoals((prev) =>
          prev.map((g) => (g.id === goalId ? { ...g, progress: updated.progress } : g))
        );

        setSaveStatus((prev) => ({ ...prev, [goalId]: "saved" }));

        setTimeout(() => {
          setSaveStatus((prev) => ({ ...prev, [goalId]: "idle" }));
        }, 1200);
      } catch (err) {
        console.error(err);
        setSaveStatus((prev) => ({ ...prev, [goalId]: "error" }));
      }
    }, 700);
  });

  return () => {
    Object.values(timers).forEach(clearTimeout);
  };
}, [draftProgress, goals]);


  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const dbGoals = await getGoals();
        setGoals(dbGoals);

        const initialDraft: Record<string, number> = {};
        for (const g of dbGoals) {
          initialDraft[g.id] = typeof g.progress === "number" ? g.progress : 0;
        }
        setDraftProgress(initialDraft);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error",
          description: "Failed to load goals",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const sortedGoals = useMemo(() => {
    return [...goals].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
  }, [goals]);

  const saveProgress = async (goalId: string) => {
    try {
      setSavingId(goalId);

      const value = clampPercent(Number(draftProgress[goalId] ?? 0));

      const updated = await updateGoal(goalId, { progress: value });

      setGoals((prev) =>
        prev.map((g) => (g.id === goalId ? { ...g, progress: updated.progress } : g))
      );

      toast({
        title: "Updated",
        description: "Goal progress saved",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to update goal progress",
        variant: "destructive",
      });
    } finally {
      setSavingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-calm pb-24">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="Back">
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-foreground truncate">
                Your Goals
              </h1>
              <p className="text-sm text-muted-foreground">
                Track progress and stay focused 🎯
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" asChild aria-label="Profile">
            <Link to="/profile">
              <User className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-4">
        {sortedGoals.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No goals found yet.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Complete onboarding to create your first goals.
              </p>
            </CardContent>
          </Card>
        ) : (
          sortedGoals.map((g) => {
            const progress = clampPercent(Number(draftProgress[g.id] ?? g.progress ?? 0));

            return (
              <Card key={g.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <CardTitle className="text-lg truncate">{g.title}</CardTitle>

                      {g.description ? (
                        <p className="text-sm text-muted-foreground mt-1">
                          {g.description}
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          No description added.
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground mt-2 capitalize">
                        Category: {g.category}
                      </p>
                    </div>

                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {progress}%
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">

                  <div className="space-y-2">
  <div className="flex items-center justify-between">
    <p className="text-xs text-muted-foreground">
      Progress:{" "}
      <span className="text-foreground font-medium">
        {draftProgress[g.id] ?? g.progress ?? 0}%
      </span>
    </p>

    <p className="text-xs text-muted-foreground">
      {saveStatus[g.id] === "saving" && "Saving..."}
      {saveStatus[g.id] === "saved" && "Saved ✓"}
      {saveStatus[g.id] === "error" && "Failed ❌"}
      {saveStatus[g.id] === "idle" && "10% steps"}
    </p>
  </div>

  <Slider
    value={[draftProgress[g.id] ?? g.progress ?? 0]}
    min={0}
    max={100}
    step={10}
    onValueChange={(v) => {
      const val = v?.[0] ?? 0;
      setDraftProgress((prev) => ({ ...prev, [g.id]: val }));
    }}
  />
</div>


                </CardContent>
              </Card>
            );
          })
        )}
      </main>

      {/* Bottom Navigation */}
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

            <Link
              to="/reflect"
              className="flex flex-col items-center text-muted-foreground hover:text-primary"
            >
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

export default Goals;
