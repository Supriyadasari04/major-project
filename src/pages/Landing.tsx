import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Brain, Target, BookOpen, Moon, Sparkles, Shield, Heart, Zap } from 'lucide-react';

const Landing = () => {
  return (
    <div className="min-h-screen gradient-calm">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl gradient-hero flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Justly</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Heart className="h-4 w-4" />
              Your personal wellness companion
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
              Transform your life with mindful habits
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Justly is your AI-powered life coach that helps you build positive habits, 
              track your goals, reflect on your journey, and grow into your best self.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">Start Your Journey</Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/login">I have an account</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">Everything you need to thrive</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A complete wellness ecosystem designed to support your personal growth journey.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-calm-teal-light flex items-center justify-center mx-auto mb-4">
                  <Brain className="h-7 w-7 text-calm-teal" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">AI Coach</h3>
                <p className="text-sm text-muted-foreground">
                  Chat with your personal AI coach anytime for guidance, support, and motivation.
                </p>
              </CardContent>
            </Card>

            <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-soft-sage-light flex items-center justify-center mx-auto mb-4">
                  <Target className="h-7 w-7 text-soft-sage" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Goal & Habit Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Set meaningful goals and build daily habits that align with your vision.
                </p>
              </CardContent>
            </Card>

            <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-gentle-lavender-light flex items-center justify-center mx-auto mb-4">
                  <Moon className="h-7 w-7 text-gentle-lavender" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Evening Reflection</h3>
                <p className="text-sm text-muted-foreground">
                  End each day with guided reflection to celebrate wins and learn from challenges.
                </p>
              </CardContent>
            </Card>

            <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <CardContent className="p-6 text-center">
                <div className="h-14 w-14 rounded-2xl bg-warm-coral-light flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="h-7 w-7 text-warm-coral" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Auto Journaling</h3>
                <p className="text-sm text-muted-foreground">
                  Your conversations and reflections automatically become beautiful journal entries.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">How Justly works</h2>
              <p className="text-muted-foreground">A simple daily routine that transforms your life.</p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold">1</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Morning Prep</h3>
                  <p className="text-muted-foreground">
                    Start your day with AI-generated tasks aligned to your goals. No more decision fatigue.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold">2</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Track & Complete</h3>
                  <p className="text-muted-foreground">
                    Check off habits and tasks throughout your day. Chat with your AI coach whenever you need support.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="h-12 w-12 rounded-full gradient-hero flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-bold">3</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Reflect & Grow</h3>
                  <p className="text-muted-foreground">
                    End with evening reflection. Your insights become journal entries, building your growth story.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust section */}
        <section className="container mx-auto px-4 py-16">
          <Card variant="soft" className="max-w-4xl mx-auto">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                  <div className="h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                    <Shield className="h-10 w-10 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-3">Your privacy matters</h3>
                  <p className="text-muted-foreground">
                    Your thoughts and reflections are personal. Justly keeps your data private and secure. 
                    Your conversations are yours alone – we never share or sell your personal information.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <div className="h-16 w-16 rounded-2xl gradient-hero flex items-center justify-center mx-auto mb-6">
              <Zap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-4">Ready to begin?</h2>
            <p className="text-muted-foreground mb-8">
              Join thousands of people who are transforming their lives with Justly.
            </p>
            <Button variant="hero" size="xl" asChild>
              <Link to="/signup">Create Free Account</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-hero flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Justly</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Justly. Your journey to a better you starts here.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
