import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";

import { useAuth } from "@/contexts/AuthContext";

import {
  getGoals,
  getHabits,
  ChatMessage,
  ChatSession,
  getChatSessions,
  createChatSession,
  renameChatSession,
  deleteChatSession,
  togglePinChatSession,
  getActiveChatSessionId,
  setActiveChatSessionId,
  getChatMessagesBySession,
  addMessageToSession,
} from "@/lib/storage";

import { sendMessage } from "@/lib/gemini";
import { toast } from "@/hooks/use-toast";

import {
  Send,
  Mic,
  MicOff,
  Moon,
  Target,
  MessageCircle,
  Sparkles,
  User,
  Loader2,
  Menu,
  Plus,
  MoreVertical,
  Pin,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

const Coach = () => {
  const { user } = useAuth();

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState("");
  const [renameSessionId, setRenameSessionId] = useState<string | null>(null);

  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId]
  );
useEffect(() => {
  const load = async () => {
    try {
      const dbSessions = await getChatSessions();
      setSessions(dbSessions);

      const storedActive = getActiveChatSessionId();
      const nextActive = null;

      setActiveChatSessionId(nextActive);
      setActiveSessionIdState(nextActive);
      setMessages([]);
    } catch (error) {
      console.error(error);
      setSessions([]);
      setActiveChatSessionId(null);
      setActiveSessionIdState(null);
      setMessages([]);
    }
  };

  load();
}, []);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeSessionId) {
        setMessages([]);
        return;
      }
        const dbMessages = await getChatMessagesBySession(activeSessionId);
        setMessages(dbMessages);
    };
    loadMessages();
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;

      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? prev + " " + transcript : transcript));
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const refreshSessions = async () => {
    const dbSessions = await getChatSessions();
    setSessions(dbSessions);
  };

  const handleCreateNewChat = async () => {
    try {
      const newSession = await createChatSession();
      await refreshSessions();

      setActiveChatSessionId(newSession.id);
      setActiveSessionIdState(newSession.id);
      setMessages([]);

      setIsSidebarOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to create new chat",
        variant: "destructive",
      });
    }
  };

  const handleSelectSession = async (id: string) => {
    try {
      setActiveChatSessionId(id);
      setActiveSessionIdState(id);

      const dbMessages = await getChatMessagesBySession(id);
      setMessages(dbMessages);
      setIsSidebarOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to open chat",
        variant: "destructive",
      });
    }
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice not supported",
        description: "Your browser does not support voice input.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const openRenameDialog = (sessionId: string, currentTitle: string) => {
    setRenameSessionId(sessionId);
    setRenameText(currentTitle);
    setIsRenameOpen(true);
  };

  const confirmRename = async () => {
    if (!renameSessionId) return;

    try {
      await renameChatSession(renameSessionId, renameText);
      await refreshSessions();
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to rename chat",
        variant: "destructive",
      });
    } finally {
      setIsRenameOpen(false);
      setRenameSessionId(null);
    }
  };

  const openDeleteDialog = (sessionId: string) => {
    setDeleteSessionId(sessionId);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteSessionId) return;

    try {
      await deleteChatSession(deleteSessionId);
      await refreshSessions();

      const nextActive = getActiveChatSessionId();
      setActiveSessionIdState(nextActive);

      if (nextActive) {
        const dbMessages = await getChatMessagesBySession(nextActive);
        setMessages(dbMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
    } finally {
      setIsDeleteOpen(false);
      setDeleteSessionId(null);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);

    try {
      let sid = activeSessionId;

      if (!sid) {
        const newSession = await createChatSession();
        await refreshSessions();
        sid = newSession.id;

        setActiveChatSessionId(sid);
        setActiveSessionIdState(sid);
        setMessages([]);
      }
      const userMsg = await addMessageToSession(sid, {
        role: "user",
        content: input.trim(),
      });

      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      const goals = await getGoals();
      const habits = await getHabits();
      const response = await sendMessage(
        userMsg.content,
        [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
        {
          goals: goals.map((g) => g.title),
          habits: habits.map((h) => h.title),
        }
      );

      const assistantMsg = await addMessageToSession(sid, {
        role: "assistant",
        content: response,
      });

      setMessages((prev) => [...prev, assistantMsg]);
      await refreshSessions();
    } catch (error) {
      console.error(error);

      toast({
        title: "AI Unavailable",
        description:
          "Looks like the AI service hit its usage limit (quota/rate limit). Try again later.",
        variant: "destructive",
      });
      try {
        const sid = activeSessionId;
        if (sid) {
          const fallback = await addMessageToSession(sid, {
            role: "assistant",
            content:
              "No worries — tell me what you want to achieve today, and I’ll help you break it into 3 small steps you can do immediately.",
          });
          setMessages((prev) => [...prev, fallback]);
          await refreshSessions();
        }
      } catch (e) {
        console.error("Fallback save failed", e);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-calm flex flex-col pb-20">
      {/* HEADER */}
      <header className="container mx-auto px-4 py-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* ✅ header button opens left drawer */}
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open chats">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-[320px] p-0 [&>button]:hidden">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <SheetHeader className="p-0">
                      <SheetTitle className="text-lg">Chats</SheetTitle>
                    </SheetHeader>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="hero"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={handleCreateNewChat}
                        aria-label="New chat"
                      >
                        <Plus className="h-5 w-5" />
                      </Button>

                      {/* ✅ Your own close button */}
                      <SheetClose asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-full"
                          aria-label="Close chats"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </SheetClose>
                    </div>
                  </div>
                </div>

                <div className="p-3 space-y-2">
                  {sessions.length === 0 ? (
                    <div className="text-sm text-muted-foreground p-3">
                      No chats yet. Create one using the + button.
                    </div>
                  ) : (
                    sessions.map((s) => {
                      const isActive = s.id === activeSessionId;

                      return (
                        <button
                          key={s.id}
                          onClick={() => handleSelectSession(s.id)}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                            isActive
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-secondary/50"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-foreground truncate flex items-center gap-2">
                                {s.pinned ? "📌" : null}
                                <span className="truncate">{s.title}</span>
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(s.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  onClick={(e) => e.stopPropagation()}
                                  aria-label="Chat options"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>

                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openRenameDialog(s.id, s.title);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await togglePinChatSession(s.id);
                                      await refreshSessions();
                                    } catch (err) {
                                      console.error(err);
                                      toast({
                                        title: "Error",
                                        description: "Failed to pin chat",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Pin className="h-4 w-4 mr-2" />
                                  {s.pinned ? "Unpin" : "Pin"}
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteDialog(s.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center">
              <MessageCircle className="h-5 w-5 text-primary-foreground" />
            </div>

            <div>
              <h1 className="font-semibold text-foreground">
                AI Coach{" "}
                {activeSession?.title ? (
                  <span className="text-muted-foreground font-normal">
                    • {activeSession.title}
                  </span>
                ) : null}
              </h1>
              <p className="text-xs text-muted-foreground">Here to support you</p>
            </div>
          </div>

          <Button variant="ghost" size="icon" asChild>
            <Link to="/profile" aria-label="Profile">
              <User className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </header>

      {/* MAIN CHAT */}
      <main className="flex-1 container mx-auto px-4 py-4 overflow-y-auto pb-28">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="h-16 w-16 rounded-2xl gradient-hero flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Hi {user?.name?.split(" ")[0]}!
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Start a new chat from the menu, or just type below and I’ll create one automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <Card
                  className={`max-w-[85%] p-3 ${
                    msg.role === "user"
                      ? "gradient-hero text-primary-foreground"
                      : "bg-card"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </Card>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <Card className="p-3 bg-card">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* INPUT BAR */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border p-4">
        <div className="container mx-auto flex gap-2">
          <Button
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={toggleVoice}
            aria-label="Voice input"
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>

          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1"
          />

          <Button
            variant="hero"
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* BOTTOM NAV */}
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

            <Link to="/coach" className="flex flex-col items-center text-primary">
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

      {/* ✅ RENAME DIALOG */}
      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
  <DialogTitle>Rename chat</DialogTitle>
  <DialogDescription className="text-sm text-muted-foreground">
    Give this chat a short title so you can find it later.
  </DialogDescription>
</DialogHeader>


          <Input
            value={renameText}
            onChange={(e) => setRenameText(e.target.value)}
            placeholder="Enter chat title"
          />

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={confirmRename}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ✅ DELETE CONFIRMATION */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Coach;
