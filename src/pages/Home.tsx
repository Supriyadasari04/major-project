import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getHabits, getTasks, getGoals, completeHabit, uncompleteHabit, toggleTask, getTodayString, addTask, Task } from '@/lib/storage';
import { generateMorningTasks } from '@/lib/gemini';
import { toast } from '@/hooks/use-toast';
import { Sun, Moon, MessageCircle, Target, CheckCircle2, Circle, Plus, Sparkles, User, Loader2 } from 'lucide-react';

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState(getHabits());
  const [tasks, setTasks] = useState(getTasks(getTodayString()));
  const [isGenerating, setIsGenerating] = useState(false);
  const today = getTodayString();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user, navigate]);

  const completedHabits = habits.filter(h => h.completedDates.includes(today)).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  const handleHabitToggle = (id: string, isCompleted: boolean) => {
    if (isCompleted) {
      uncompleteHabit(id);
    } else {
      completeHabit(id);
    }
    setHabits(getHabits());
  };

  const handleTaskToggle = (id: string) => {
    toggleTask(id);
    setTasks(getTasks(today));
  };

  const handleMorningPrep = async () => {
    setIsGenerating(true);
    try {
      const goals = getGoals();
      const generatedTasks = await generateMorningTasks(
        goals.map(g => ({ title: g.title, category: g.category })),
        habits.map(h => ({ title: h.title, category: h.category }))
      );
      
      generatedTasks.forEach(task => {
        addTask({
          title: task.title,
          description: task.description,
          completed: false,
          date: today,
          priority: task.priority,
        });
      });
      
      setTasks(getTasks(today));
      toast({ title: 'Morning prep complete!', description: `${generatedTasks.length} tasks added for today.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to generate tasks.', variant: 'destructive' });
    }
    setIsGenerating(false);
  };

  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="min-h-screen gradient-calm pb-24">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{greeting}, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-muted-foreground">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="soft" size="icon" onClick={handleMorningPrep} disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" asChild>
              <Link to="/profile"><User className="h-5 w-5" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card variant="gradient">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{completedHabits}/{habits.length}</div>
              <p className="text-sm text-muted-foreground">Habits today</p>
            </CardContent>
          </Card>
          <Card variant="gradient">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-primary">{completedTasks}/{tasks.length}</div>
              <p className="text-sm text-muted-foreground">Tasks done</p>
            </CardContent>
          </Card>
        </div>

        {/* Today's Habits */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Today's Habits</CardTitle>
            <Button variant="ghost" size="icon-sm" asChild>
              <Link to="/habits"><Plus className="h-4 w-4" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {habits.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-4">No habits yet. <Link to="/habits" className="text-primary">Add some!</Link></p>
            ) : (
              habits.slice(0, 5).map(habit => {
                const isCompleted = habit.completedDates.includes(today);
                return (
                  <button
                    key={habit.id}
                    onClick={() => handleHabitToggle(habit.id, isCompleted)}
                    className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}>{habit.title}</span>
                    {habit.streak > 0 && <span className="ml-auto text-xs text-accent">🔥 {habit.streak}</span>}
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Today's Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground text-sm mb-2">No tasks for today</p>
                <Button variant="soft" size="sm" onClick={handleMorningPrep} disabled={isGenerating}>
                  {isGenerating ? 'Generating...' : 'Generate with AI'}
                </Button>
              </div>
            ) : (
              tasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleTaskToggle(task.id)}
                  className="flex items-center gap-3 w-full p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                >
                  {task.completed ? (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className={task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}>{task.title}</span>
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
            <Link to="/coach" className="flex flex-col items-center text-muted-foreground hover:text-primary">
              <MessageCircle className="h-5 w-5" />
              <span className="text-xs mt-1">Coach</span>
            </Link>
            <Link to="/habits" className="flex flex-col items-center text-muted-foreground hover:text-primary">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs mt-1">Habits</span>
            </Link>
            <Link to="/reflect" className="flex flex-col items-center text-muted-foreground hover:text-primary">
              <Moon className="h-5 w-5" />
              <span className="text-xs mt-1">Reflect</span>
            </Link>
            <Link to="/profile" className="flex flex-col items-center text-muted-foreground hover:text-primary">
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
