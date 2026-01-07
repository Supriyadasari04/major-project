import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { getChatHistory, addChatMessage, getGoals, getHabits, ChatMessage } from '@/lib/storage';
import { sendMessage } from '@/lib/gemini';
import { toast } from '@/hooks/use-toast';
import { Send, Mic, MicOff, Target, MessageCircle, Sparkles, Moon, User, Loader2 } from 'lucide-react';

const Coach = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(getChatHistory());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(prev => prev + transcript);
        setIsListening(false);
      };
      
      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) {
      toast({ title: 'Voice not supported', description: 'Your browser does not support voice input.', variant: 'destructive' });
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = addChatMessage({ role: 'user', content: input.trim() });
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const goals = getGoals();
      const habits = getHabits();
      const response = await sendMessage(
        userMessage.content,
        messages.map(m => ({ role: m.role, content: m.content })),
        {
          goals: goals.map(g => g.title),
          habits: habits.map(h => h.title),
        }
      );
      
      const assistantMessage = addChatMessage({ role: 'assistant', content: response });
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to get response. Please try again.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen gradient-calm flex flex-col pb-20">
      <header className="container mx-auto px-4 py-4 border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-semibold text-foreground">AI Coach</h1>
            <p className="text-xs text-muted-foreground">Here to support you</p>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="h-16 w-16 rounded-2xl gradient-hero flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Hi {user?.name?.split(' ')[0]}!</h2>
            <p className="text-muted-foreground max-w-sm">
              I'm your personal coach. Share what's on your mind, ask for guidance, or just vent. I'm here for you.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <Card className={`max-w-[85%] p-3 ${msg.role === 'user' ? 'gradient-hero text-primary-foreground' : 'bg-card'}`}>
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

      <div className="fixed bottom-20 left-0 right-0 bg-card border-t border-border p-4">
        <div className="container mx-auto flex gap-2">
          <Button variant={isListening ? 'destructive' : 'outline'} size="icon" onClick={toggleVoice}>
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
          <Input
            placeholder="Type a message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="flex-1"
          />
          <Button variant="hero" size="icon" onClick={handleSend} disabled={!input.trim() || isLoading}>
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex justify-around py-3">
            <Link to="/home" className="flex flex-col items-center text-muted-foreground hover:text-primary"><Target className="h-5 w-5" /><span className="text-xs mt-1">Home</span></Link>
            <Link to="/coach" className="flex flex-col items-center text-primary"><MessageCircle className="h-5 w-5" /><span className="text-xs mt-1">Coach</span></Link>
            <Link to="/habits" className="flex flex-col items-center text-muted-foreground hover:text-primary"><Sparkles className="h-5 w-5" /><span className="text-xs mt-1">Habits</span></Link>
            <Link to="/reflect" className="flex flex-col items-center text-muted-foreground hover:text-primary"><Moon className="h-5 w-5" /><span className="text-xs mt-1">Reflect</span></Link>
            <Link to="/profile" className="flex flex-col items-center text-muted-foreground hover:text-primary"><User className="h-5 w-5" /><span className="text-xs mt-1">Profile</span></Link>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default Coach;
