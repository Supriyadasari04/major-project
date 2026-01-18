import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  getGoals,
  getAchievements,
  getSettings,
  saveSettings,
  getHabits,
  getJournalEntries,
} from "@/lib/storage";
import { toast } from "@/hooks/use-toast";
import {
  Target,
  MessageCircle,
  Sparkles,
  Moon,
  User,
  Settings as SettingsIcon,
  Trophy,
  History,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Loader2,
} from "lucide-react";

import type { Goal, Habit, Settings, JournalEntry, Achievement } from "@/lib/storage";

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeDialog, setActiveDialog] = useState<string | null>(null);

  const [settings, setSettingsState] = useState<Settings | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);


  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        setIsLoading(true);

        const [dbSettings, dbGoals, dbHabits, dbJournals, dbAchievements] = await Promise.all([
          getSettings(),
          getGoals(),
          getHabits(),
          getJournalEntries(),
          getAchievements(),
        ]);

        setSettingsState(dbSettings);
        setGoals(dbGoals);
        setHabits(dbHabits);
        setAchievements(dbAchievements);
        setJournals(dbJournals);
      } catch (error) {
        console.error(error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProfileData();
  }, []);

  const handleLogout = () => {
    logout();
    toast({ title: "Logged out", description: "See you soon!" });
    navigate("/");
  };

  const handleSettingChange = async (key: keyof Settings, value: any) => {
    if (!settings) return;

    const updated = { ...settings, [key]: value };
    setSettingsState(updated);

    try {
      await saveSettings(updated);
      toast({ title: "Settings updated" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    }
  };

  const handlePrivacyChange = async (privacyKey: keyof Settings["privacy"], value: boolean) => {
    if (!settings) return;

    const updated = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [privacyKey]: value,
      },
    };

    setSettingsState(updated);

    try {
      await saveSettings(updated);
      toast({ title: "Privacy updated" });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to update privacy",
        variant: "destructive",
      });
    }
  };

  const menuItems = [
    {
      id: "achievements",
      icon: Trophy,
      label: "Achievements",
      count: achievements.filter((a) => a.unlockedAt).length,
    },
    { id: "history", icon: History, label: "History", count: journals.length },
    { id: "notifications", icon: Bell, label: "Notifications" },
    { id: "privacy", icon: Shield, label: "Privacy" },
    { id: "help", icon: HelpCircle, label: "Help & Support" },
  ];

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen gradient-calm flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-calm pb-24">
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Profile</h1>

          <Dialog
            open={activeDialog === "settings"}
            onOpenChange={(o) => setActiveDialog(o ? "settings" : null)}
          >
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <SettingsIcon className="h-5 w-5" />
              </Button>
            </DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <Label>Notifications</Label>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(v) => handleSettingChange("notifications", v)}
                  />
                </div>

                <div>
                  <Label>Morning Prep Time</Label>
                  <Input
                    type="time"
                    value={settings.morningPrepTime}
                    onChange={(e) => handleSettingChange("morningPrepTime", e.target.value)}
                  />
                </div>

                <div>
                  <Label>Evening Reflection Time</Label>
                  <Input
                    type="time"
                    value={settings.eveningReflectionTime}
                    onChange={(e) => handleSettingChange("eveningReflectionTime", e.target.value)}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-6">
        <Card variant="gradient">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-16 w-16 rounded-full gradient-hero flex items-center justify-center text-2xl text-primary-foreground font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <h2 className="text-xl font-bold text-foreground">{user?.name}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Member since {new Date(user?.createdAt || "").toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          <Card variant="soft">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{habits.length}</p>
              <p className="text-xs text-muted-foreground">Habits</p>
            </CardContent>
          </Card>

          <Card variant="soft">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{goals.length}</p>
              <p className="text-xs text-muted-foreground">Goals</p>
            </CardContent>
          </Card>

          <Card variant="soft">
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{journals.length}</p>
              <p className="text-xs text-muted-foreground">Entries</p>
            </CardContent>
          </Card>
        </div>

<Card>
  <CardContent className="p-0">
    <button
      onClick={() => navigate("/goals")}
      className="flex items-center gap-3 w-full p-4 hover:bg-secondary/50 transition-colors"
    >
      <Target className="h-5 w-5 text-muted-foreground" />
      <span className="flex-1 text-left text-foreground">My Goals</span>
      <span className="text-sm text-muted-foreground">{goals.length}</span>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  </CardContent>
</Card>

        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, i) => (
              <Dialog
                key={item.id}
                open={activeDialog === item.id}
                onOpenChange={(o) => setActiveDialog(o ? item.id : null)}
              >
                <DialogTrigger asChild>
                  <button
                    className={`flex items-center gap-3 w-full p-4 hover:bg-secondary/50 transition-colors ${
                      i !== 0 ? "border-t border-border" : ""
                    }`}
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 text-left text-foreground">{item.label}</span>

                    {item.count !== undefined && (
                      <span className="text-sm text-muted-foreground">{item.count}</span>
                    )}

                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DialogTrigger>

                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{item.label}</DialogTitle>
                  </DialogHeader>

                  <div className="pt-4 max-h-96 overflow-y-auto">
                    {item.id === "goals" &&
                      (goals.length === 0 ? (
                        <p className="text-muted-foreground">No goals yet.</p>
                      ) : (
                        goals.map((g) => (
                          <div
                            key={g.id}
                            className="p-3 bg-secondary/50 rounded-lg mb-2"
                          >
                            <p className="font-medium">{g.title}</p>
                            <p className="text-sm text-muted-foreground">{g.description}</p>
                          </div>
                        ))
                      ))}

                    {item.id === "achievements" &&
                      achievements.map((a) => (
                        <div
                          key={a.id}
                          className={`p-3 rounded-lg mb-2 ${
                            a.unlockedAt ? "bg-primary/10" : "bg-secondary/50 opacity-50"
                          }`}
                        >
                          <span className="text-2xl">{a.icon}</span>
                          <p className="font-medium">{a.title}</p>
                          <p className="text-sm text-muted-foreground">{a.description}</p>
                        </div>
                      ))}

                    {item.id === "history" &&
                      (journals.length === 0 ? (
                        <p className="text-muted-foreground">No journal entries yet.</p>
                      ) : (
                        journals.map((j) => (
                          <div
                            key={j.id}
                            className="p-3 bg-secondary/50 rounded-lg mb-2"
                          >
                            <p className="text-sm font-medium">
                              {new Date(j.date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {j.content}
                            </p>
                          </div>
                        ))
                      ))}

                    {item.id === "notifications" && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label>Push Notifications</Label>
                          <Switch
                            checked={settings.notifications}
                            onCheckedChange={(v) => handleSettingChange("notifications", v)}
                          />
                        </div>
                      </div>
                    )}

                    {item.id === "privacy" && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Your data is stored securely in the database.
                        </p>

                        <div className="flex items-center justify-between">
                          <Label>Show Streak Badge</Label>
                          <Switch
                            checked={settings.privacy.showStreak}
                            onCheckedChange={(v) => handlePrivacyChange("showStreak", v)}
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <Label>Share Analytics</Label>
                          <Switch
                            checked={settings.privacy.shareAnalytics}
                            onCheckedChange={(v) => handlePrivacyChange("shareAnalytics", v)}
                          />
                        </div>
                      </div>
                    )}

                    {item.id === "help" && (
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Need help? Contact us at support@justly.app
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Justly supports wellness, but it is not professional therapy.
                        </p>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </CardContent>
        </Card>

        <Button variant="outline" className="w-full" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" /> Log Out
        </Button>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-3">
            <Link to="/home" className="flex flex-col items-center text-muted-foreground hover:text-primary">
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

            <Link to="/profile" className="flex flex-col items-center text-primary">
              <User className="h-5 w-5" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Profile;
