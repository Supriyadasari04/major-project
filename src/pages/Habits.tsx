import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getHabits, addHabit, completeHabit, uncompleteHabit, deleteHabit, getTodayString, Habit } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { Plus, CheckCircle2, Circle, Trash2, Target, MessageCircle, Sparkles, Moon, User } from 'lucide-react';

const Habits = () => {
  const [habits, setHabits] = useState<Habit[]>(getHabits());
  const [isOpen, setIsOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({ title: '', description: '', category: 'health' as const, frequency: 'daily' as const });
  const today = getTodayString();

  const handleAdd = () => {
    if (!newHabit.title.trim()) return;
    addHabit(newHabit);
    setHabits(getHabits());
    setNewHabit({ title: '', description: '', category: 'health', frequency: 'daily' });
    setIsOpen(false);
    toast({ title: 'Habit added!', description: 'Keep it up! Consistency is key.' });
  };

  const handleToggle = (id: string, isCompleted: boolean) => {
    if (isCompleted) uncompleteHabit(id);
    else completeHabit(id);
    setHabits(getHabits());
  };

  const handleDelete = (id: string) => {
    deleteHabit(id);
    setHabits(getHabits());
    toast({ title: 'Habit removed' });
  };

  const categoryColors: Record<string, string> = {
    health: 'bg-warm-coral-light text-warm-coral',
    productivity: 'bg-calm-teal-light text-calm-teal',
    mindfulness: 'bg-gentle-lavender-light text-gentle-lavender',
    social: 'bg-soft-sage-light text-soft-sage',
    learning: 'bg-sunshine-light text-sunshine',
  };

  return (
    <div className="min-h-screen gradient-calm pb-24">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Habits</h1>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" size="icon"><Plus className="h-5 w-5" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add New Habit</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div><Label>Habit name</Label><Input placeholder="e.g., Morning meditation" value={newHabit.title} onChange={(e) => setNewHabit(p => ({ ...p, title: e.target.value }))} /></div>
                <div><Label>Description (optional)</Label><Input placeholder="What does this habit involve?" value={newHabit.description} onChange={(e) => setNewHabit(p => ({ ...p, description: e.target.value }))} /></div>
                <div><Label>Category</Label>
                  <Select value={newHabit.category} onValueChange={(v: any) => setNewHabit(p => ({ ...p, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                      <SelectItem value="mindfulness">Mindfulness</SelectItem>
                      <SelectItem value="social">Social</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="hero" className="w-full" onClick={handleAdd}>Add Habit</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-4">
        {habits.length === 0 ? (
          <Card variant="soft" className="text-center py-12">
            <p className="text-muted-foreground mb-4">No habits yet. Start building your routine!</p>
            <Button variant="hero" onClick={() => setIsOpen(true)}>Add Your First Habit</Button>
          </Card>
        ) : (
          habits.map(habit => {
            const isCompleted = habit.completedDates.includes(today);
            return (
              <Card key={habit.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleToggle(habit.id, isCompleted)} className="flex-shrink-0">
                      {isCompleted ? <CheckCircle2 className="h-6 w-6 text-primary" /> : <Circle className="h-6 w-6 text-muted-foreground" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{habit.title}</p>
                      {habit.description && <p className="text-sm text-muted-foreground truncate">{habit.description}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[habit.category]}`}>{habit.category}</span>
                        {habit.streak > 0 && <span className="text-xs text-accent">🔥 {habit.streak} day streak</span>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(habit.id)}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container mx-auto px-4"><div className="flex justify-around py-3">
          <Link to="/home" className="flex flex-col items-center text-muted-foreground hover:text-primary"><Target className="h-5 w-5" /><span className="text-xs mt-1">Home</span></Link>
          <Link to="/coach" className="flex flex-col items-center text-muted-foreground hover:text-primary"><MessageCircle className="h-5 w-5" /><span className="text-xs mt-1">Coach</span></Link>
          <Link to="/habits" className="flex flex-col items-center text-primary"><Sparkles className="h-5 w-5" /><span className="text-xs mt-1">Habits</span></Link>
          <Link to="/reflect" className="flex flex-col items-center text-muted-foreground hover:text-primary"><Moon className="h-5 w-5" /><span className="text-xs mt-1">Reflect</span></Link>
          <Link to="/profile" className="flex flex-col items-center text-muted-foreground hover:text-primary"><User className="h-5 w-5" /><span className="text-xs mt-1">Profile</span></Link>
        </div></div>
      </nav>
    </div>
  );
};

export default Habits;
