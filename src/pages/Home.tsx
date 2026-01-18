import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import {
  getHabits,
  getTasks,
  getGoals,
  completeHabit,
  toggleTask,
  getTodayString,
  addTask,
  recordMorningPrepAndUnlockAchievement
} from "@/lib/storage";
import { generateMorningTasks } from "@/lib/gemini";
import type { Habit, Goal, Task } from "@/lib/storage";
import { toast } from "@/hooks/use-toast";
import {
  Sun,
  Moon,
  MessageCircle,
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Sparkles,
  User,
  Loader2,
  ArrowRight,
} from "lucide-react";

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [habits, setHabits] = useState<Habit[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  const [isGenerating, setIsGenerating] = useState(false);
  const today = getTodayString();

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const loadData = async () => {
      try {
        const [dbHabits, dbGoals, dbTasks] = await Promise.all([
          getHabits(),
          getGoals(),
          getTasks(today),
        ]);

        setHabits(dbHabits);
        setGoals(dbGoals);
        setTasks(dbTasks);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to load home data",
          variant: "destructive",
        });
      }
    };

    loadData();
  }, [user, navigate, today]);

  const completedHabits = habits.filter((h) => h.completedDates.includes(today))
    .length;
  const completedTasks = tasks.filter((t) => t.completed).length;

  const habitsPercent =
    habits.length === 0 ? 0 : Math.round((completedHabits / habits.length) * 100);

  const tasksPercent =
    tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

const handleHabitToggle = async (id: string, isCompleted: boolean) => {
  if (isCompleted) return;

  await completeHabit(id);
  setHabits(await getHabits());
};


  const handleTaskToggle = async (id: string) => {
    await toggleTask(id);
    setTasks(await getTasks(today));
  };

  const handleMorningPrep = async () => {
    setIsGenerating(true);
    try {
      const goals = await getGoals();
      const generatedTasks = await generateMorningTasks(
        goals.map((g) => ({ title: g.title, category: g.category })),
        habits.map((h) => ({ title: h.title, category: h.category }))
      );

      for (const task of generatedTasks) {
        await addTask({
          title: task.title,
          description: task.description,
          completed: false,
          date: today,
          priority: task.priority,
        });
      }
      await recordMorningPrepAndUnlockAchievement();
      setTasks(await getTasks(today));

      toast({
        title: "Morning prep complete!",
        description: `${generatedTasks.length} tasks added for today.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate tasks.",
        variant: "destructive",
      });
    }
    setIsGenerating(false);
  };

  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 17
      ? "Good afternoon"
      : "Good evening";

  const dateLabel = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen gradient-calm pb-24">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{dateLabel}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1 truncate">
              {greeting}, {user?.name?.split(" ")[0]}!
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Let’s make today count — small steps, big progress ✨
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="soft"
              className="hidden sm:flex items-center gap-2"
              onClick={handleMorningPrep}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
              <span>{isGenerating ? "Preparing..." : "Morning Prep"}</span>
            </Button>

            <Button
              variant="soft"
              size="icon"
              className="sm:hidden"
              onClick={handleMorningPrep}
              disabled={isGenerating}
              aria-label="Morning prep"
            >
              {isGenerating ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>

            <Button variant="ghost" size="icon" asChild aria-label="Profile">
              <Link to="/profile">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="gradient">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Habits today</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {completedHabits}/{habits.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${clampPercent(habitsPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {habitsPercent}% completed
                </p>
              </div>
            </CardContent>
          </Card>

          <Card variant="gradient">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tasks done</p>
                  <p className="text-2xl font-bold text-foreground mt-1">
                    {completedTasks}/{tasks.length}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
              </div>

              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${clampPercent(tasksPercent)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {tasksPercent}% completed
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals + Habits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Goals */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Your Goals</CardTitle>
              <Button variant="ghost" size="sm" asChild className="gap-1">
                <Link to="/goals">
                  View <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="space-y-2">
              {goals.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    No goals found yet.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Complete onboarding to set your first goals.
                  </p>
                </div>
              ) : (
                goals.slice(0, 3).map((g) => (
                  <div
                    key={g.id}
                    className="p-3 rounded-lg bg-secondary/40 border border-border/50"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{g.title}</p>

{g.description ? (
  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
    {g.description}
  </p>
) : (
  <p className="text-xs text-muted-foreground mt-1">
    No description added
  </p>
)}

<p className="text-[11px] text-muted-foreground mt-2 capitalize">
  Category: {g.category}
</p>

                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                        {typeof g.progress === "number" ? `${g.progress}%` : "0%"}
                      </span>
                    </div>

                    <div className="mt-3 h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{
                          width: `${clampPercent(
                            typeof g.progress === "number" ? g.progress : 0
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Habits */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Today's Habits</CardTitle>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link to="/habits" aria-label="Add habit">
                  <Plus className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>

            <CardContent className="space-y-2">
              {habits.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground">
                    No habits yet.
                  </p>
                  <Button variant="soft" size="sm" asChild className="mt-3">
                    <Link to="/habits">Add your first habit</Link>
                  </Button>
                </div>
              ) : (
                habits.slice(0, 5).map((habit) => {
                  const isCompleted = habit.completedDates.includes(today);

                  return (
                    <button
                      key={habit.id}
                      onClick={() => handleHabitToggle(habit.id, isCompleted)}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-colors ${
                        isCompleted
                          ? "bg-primary/5 border-primary/20"
                          : "bg-card border-border hover:bg-secondary/50"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}

                      <span
                        className={`text-sm ${
                          isCompleted
                            ? "line-through text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {habit.title}
                      </span>

                      {habit.streak > 0 && (
                        <span className="ml-auto text-xs px-2 py-1 rounded-full bg-secondary text-foreground">
                          🔥 {habit.streak}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Today's Tasks</CardTitle>

            {tasks.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Tap to mark complete
              </span>
            )}
          </CardHeader>

          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-2">
                  No tasks for today
                </p>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={handleMorningPrep}
                  disabled={isGenerating}
                  className="gap-2"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sun className="h-4 w-4" />
                      Generate with AI
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-3">
                  Tip: Morning Prep adds 5–7 tasks aligned to your habits & goals.
                </p>
              </div>
            ) : (
              tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => handleTaskToggle(task.id)}
                  className={`flex items-center gap-3 w-full p-3 rounded-lg border transition-colors ${
                    task.completed
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card border-border hover:bg-secondary/50"
                  }`}
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}

                  <span
                    className={`text-sm ${
                      task.completed
                        ? "line-through text-muted-foreground"
                        : "text-foreground"
                    }`}
                  >
                    {task.title}
                  </span>

                  <span className="ml-auto text-xs text-muted-foreground">
                    {task.priority}
                  </span>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-3">
            <Link to="/home" className="flex flex-col items-center text-primary">
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

export default Home;
