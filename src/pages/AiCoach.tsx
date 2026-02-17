import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { streamChat, Msg } from "@/lib/ai-stream";
import { motion } from "framer-motion";
import { Bot, Send, Heart, Dumbbell, CalendarClock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const quickActions = [
  { label: "Analyze my health", icon: Heart, type: "health", prompt: "Analyze my recent health metrics and give me personalized recommendations.", gradient: "gradient-health" },
  { label: "Plan a workout", icon: Dumbbell, type: "workout", prompt: "Create a workout plan for me based on my fitness data.", gradient: "gradient-workout" },
  { label: "Optimize my routine", icon: CalendarClock, type: "routine", prompt: "Analyze my daily routine and suggest optimizations for better productivity and wellness.", gradient: "gradient-routine" },
  { label: "Wellness tips", icon: Sparkles, type: "general", prompt: "Give me personalized wellness tips based on my overall data.", gradient: "gradient-ai" },
];

const AiCoach = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeType, setActiveType] = useState("general");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const getContext = async () => {
    if (!user) return "";
    const today = new Date().toISOString().split("T")[0];
    const parts: string[] = [];

    const { data: metrics } = await supabase.from("health_metrics").select("*")
      .eq("user_id", user.id).order("metric_date", { ascending: false }).limit(7);
    if (metrics?.length) parts.push(`Recent health metrics (last ${metrics.length} days): ${JSON.stringify(metrics)}`);

    const { data: workouts } = await supabase.from("workouts").select("*")
      .eq("user_id", user.id).order("workout_date", { ascending: false }).limit(10);
    if (workouts?.length) parts.push(`Recent workouts: ${JSON.stringify(workouts)}`);

    const { data: routines } = await supabase.from("routines").select("*")
      .eq("user_id", user.id).eq("is_active", true);
    if (routines?.length) parts.push(`Active routines: ${JSON.stringify(routines)}`);

    const { data: completions } = await supabase.from("routine_completions").select("*")
      .eq("user_id", user.id).gte("completed_date", new Date(Date.now() - 7 * 86400000).toISOString().split("T")[0]);
    if (completions?.length) parts.push(`Routine completions (7 days): ${JSON.stringify(completions)}`);

    const { data: profile } = await supabase.from("health_profiles").select("*")
      .eq("user_id", user.id).maybeSingle();
    if (profile) parts.push(`Health profile: ${JSON.stringify(profile)}`);

    return parts.join("\n\n");
  };

  const sendMessage = async (text: string, type?: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    const t = type || activeType;

    const context = await getContext();
    let assistantSoFar = "";

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        context,
        type: t,
        onDelta: upsertAssistant,
        onDone: () => setIsLoading(false),
        onError: (err) => { toast.error(err); setIsLoading(false); },
      });
    } catch {
      toast.error("Failed to connect to AI.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] md:h-[calc(100vh-6rem)]">
      <div className="mb-4">
        <h1 className="text-3xl font-bold font-display">AI Health Coach</h1>
        <p className="text-muted-foreground">Your personal wellness assistant</p>
      </div>

      {messages.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center gap-6">
          <div className="p-4 rounded-2xl gradient-hero animate-pulse-glow">
            <Bot className="w-12 h-12 text-primary-foreground" />
          </div>
          <div className="text-center">
            <h2 className="text-xl font-bold font-display mb-2">How can I help you today?</h2>
            <p className="text-muted-foreground text-sm max-w-md">I analyze your health data, workouts, and routines to give personalized recommendations.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 max-w-lg w-full">
            {quickActions.map(a => (
              <button key={a.label} onClick={() => { setActiveType(a.type); sendMessage(a.prompt, a.type); }}
                className="glass-card p-4 text-left hover:shadow-glow transition-all group">
                <div className={`w-8 h-8 rounded-lg ${a.gradient} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                  <a.icon className="w-4 h-4 text-primary-foreground" />
                </div>
                <p className="text-sm font-medium">{a.label}</p>
              </button>
            ))}
          </div>
        </motion.div>
      )}

      {messages.length > 0 && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                m.role === "user"
                  ? "gradient-health text-primary-foreground"
                  : "glass-card"
              }`}>
                {m.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert text-foreground">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{m.content}</p>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="glass-card px-4 py-3 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          placeholder="Ask about your health, workouts, or routines..."
          className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          disabled={isLoading}
        />
        <Button onClick={() => sendMessage(input)} disabled={isLoading || !input.trim()}
          className="gradient-health text-primary-foreground border-0 rounded-xl px-4 hover:opacity-90">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default AiCoach;
