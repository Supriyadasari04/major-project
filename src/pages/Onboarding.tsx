import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { addGoal, setOnboardingComplete, addHabit } from '@/lib/storage';
import { toast } from '@/hooks/use-toast';
import { Sparkles, Heart, Target, Briefcase, Users, Brain, Check } from 'lucide-react';

const categories = [
  { id: 'health', label: 'Health & Fitness', icon: Heart, color: 'bg-warm-coral-light text-warm-coral' },
  { id: 'career', label: 'Career & Learning', icon: Briefcase, color: 'bg-calm-teal-light text-calm-teal' },
  { id: 'wellness', label: 'Mental Wellness', icon: Brain, color: 'bg-gentle-lavender-light text-gentle-lavender' },
  { id: 'relationships', label: 'Relationships', icon: Users, color: 'bg-soft-sage-light text-soft-sage' },
  { id: 'personal', label: 'Personal Growth', icon: Target, color: 'bg-sunshine-light text-sunshine' },
] as const;

const suggestedHabits = {
  health: [
    { title: 'Morning exercise', description: '30 minutes of movement' },
    { title: 'Drink 8 glasses of water', description: 'Stay hydrated' },
    { title: 'Sleep 8 hours', description: 'Quality rest' },
  ],
  career: [
    { title: 'Learn something new', description: '30 min of learning' },
    { title: 'Work on important tasks first', description: 'Deep work' },
    { title: 'Review goals weekly', description: 'Stay on track' },
  ],
  wellness: [
    { title: 'Morning meditation', description: '10 min mindfulness' },
    { title: 'Gratitude journaling', description: '3 things grateful for' },
    { title: 'Digital detox evening', description: 'No screens before bed' },
  ],
  relationships: [
    { title: 'Connect with loved ones', description: 'Call or message someone' },
    { title: 'Active listening', description: 'Be fully present' },
    { title: 'Express appreciation', description: 'Say thank you' },
  ],
  personal: [
    { title: 'Read for 20 minutes', description: 'Personal development' },
    { title: 'Reflect on the day', description: 'Evening review' },
    { title: 'Try something new', description: 'Step outside comfort zone' },
  ],
};

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [goals, setGoals] = useState<{ category: string; title: string; description: string }[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const navigate = useNavigate();

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((c) => c !== categoryId) : [...prev, categoryId]
    );
  };

  const updateGoal = (category: string, field: 'title' | 'description', value: string) => {
    setGoals((prev) => {
      const existing = prev.find((g) => g.category === category);
      if (existing) {
        return prev.map((g) => (g.category === category ? { ...g, [field]: value } : g));
      }
      return [...prev, { category, title: '', description: '', [field]: value }];
    });
  };

  const toggleHabit = (habitKey: string) => {
    setSelectedHabits((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(habitKey)) {
        newSet.delete(habitKey);
      } else {
        newSet.add(habitKey);
      }
      return newSet;
    });
  };

  const handleComplete = () => {
    // Save goals
    goals.forEach((goal) => {
      if (goal.title) {
        addGoal({
          title: goal.title,
          description: goal.description,
          category: goal.category as any,
        });
      }
    });

    // Save habits
    selectedHabits.forEach((habitKey) => {
      const [category, index] = habitKey.split('-');
      const habit = suggestedHabits[category as keyof typeof suggestedHabits]?.[parseInt(index)];
      if (habit) {
        addHabit({
          title: habit.title,
          description: habit.description,
          category: category === 'health' ? 'health' : category === 'career' ? 'productivity' : category === 'wellness' ? 'mindfulness' : category === 'relationships' ? 'social' : 'learning',
          frequency: 'daily',
        });
      }
    });

    setOnboardingComplete();
    toast({
      title: "You're all set!",
      description: 'Your personalized wellness journey begins now.',
    });
    navigate('/home');
  };

  return (
    <div className="min-h-screen gradient-calm flex flex-col">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Justly</span>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        {/* Progress */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Step {step} of 3</span>
            <span className="text-sm text-muted-foreground">{Math.round((step / 3) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full gradient-hero transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Categories */}
        {step === 1 && (
          <Card className="max-w-2xl mx-auto animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Hi {user?.name}! 👋</CardTitle>
              <CardDescription>
                What areas of life do you want to focus on? Select all that apply.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedCategories.includes(cat.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`h-12 w-12 rounded-xl ${cat.color} flex items-center justify-center`}>
                      <cat.icon className="h-6 w-6" />
                    </div>
                    <span className="font-medium text-foreground flex-1 text-left">{cat.label}</span>
                    {selectedCategories.includes(cat.id) && (
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <Button
                variant="hero"
                size="lg"
                className="w-full mt-6"
                onClick={() => setStep(2)}
                disabled={selectedCategories.length === 0}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Goals */}
        {step === 2 && (
          <Card className="max-w-2xl mx-auto animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Define your vision 🎯</CardTitle>
              <CardDescription>
                What does success look like in each area? Be specific about what you want to achieve.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedCategories.map((catId) => {
                const cat = categories.find((c) => c.id === catId)!;
                const goal = goals.find((g) => g.category === catId);
                return (
                  <div key={catId} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg ${cat.color} flex items-center justify-center`}>
                        <cat.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-foreground">{cat.label}</span>
                    </div>
                    <Input
                      placeholder="Your goal (e.g., 'Run a marathon')"
                      value={goal?.title || ''}
                      onChange={(e) => updateGoal(catId, 'title', e.target.value)}
                    />
                    <Textarea
                      placeholder="Why is this important to you? What will achieving this mean?"
                      value={goal?.description || ''}
                      onChange={(e) => updateGoal(catId, 'description', e.target.value)}
                      rows={2}
                    />
                  </div>
                );
              })}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button variant="hero" size="lg" className="flex-1" onClick={() => setStep(3)}>
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Habits */}
        {step === 3 && (
          <Card className="max-w-2xl mx-auto animate-slide-up">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Build your habits ✨</CardTitle>
              <CardDescription>
                Select habits that will help you reach your goals. You can always add more later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedCategories.map((catId) => {
                const cat = categories.find((c) => c.id === catId)!;
                const habits = suggestedHabits[catId as keyof typeof suggestedHabits];
                return (
                  <div key={catId} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className={`h-8 w-8 rounded-lg ${cat.color} flex items-center justify-center`}>
                        <cat.icon className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-foreground">{cat.label}</span>
                    </div>
                    <div className="grid gap-2">
                      {habits.map((habit, idx) => {
                        const key = `${catId}-${idx}`;
                        const isSelected = selectedHabits.has(key);
                        return (
                          <button
                            key={key}
                            onClick={() => toggleHabit(key)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 text-left ${
                              isSelected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div
                              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                                isSelected ? 'border-primary bg-primary' : 'border-muted-foreground'
                              }`}
                            >
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground text-sm">{habit.title}</p>
                              <p className="text-xs text-muted-foreground">{habit.description}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-3 pt-4">
                <Button variant="outline" size="lg" className="flex-1" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button variant="hero" size="lg" className="flex-1" onClick={handleComplete}>
                  Start My Journey
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Onboarding;
