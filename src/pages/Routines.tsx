import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Plus, Check, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const categories = ["health", "fitness", "work", "learning", "mindfulness", "nutrition", "general"];
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Routines = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", scheduled_time: "08:00", duration_minutes: "30", category: "general",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
  });

  const today = new Date().toISOString().split("T")[0];
  const todayDow = new Date().getDay() || 7; // 1=Mon, 7=Sun

  const fetchData = async () => {
    if (!user) return;
    const { data: r } = await supabase.from("routines").select("*")
      .eq("user_id", user.id).eq("is_active", true).order("scheduled_time");
    setRoutines(r || []);

    const { data: c } = await supabase.from("routine_completions").select("routine_id")
      .eq("user_id", user.id).eq("completed_date", today);
    setCompletions(new Set((c || []).map((x: any) => x.routine_id)));
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("routines").insert({
      user_id: user.id,
      title: form.title,
      scheduled_time: form.scheduled_time,
      duration_minutes: Number(form.duration_minutes),
      category: form.category,
      days_of_week: form.days_of_week,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Routine created!");
    setOpen(false);
    setForm({ title: "", scheduled_time: "08:00", duration_minutes: "30", category: "general", days_of_week: [1, 2, 3, 4, 5, 6, 7] });
    fetchData();
  };

  const toggleCompletion = async (routineId: string) => {
    if (!user) return;
    if (completions.has(routineId)) {
      await supabase.from("routine_completions").delete()
        .eq("user_id", user.id).eq("routine_id", routineId).eq("completed_date", today);
    } else {
      await supabase.from("routine_completions").insert({
        user_id: user.id, routine_id: routineId, completed_date: today,
      });
    }
    fetchData();
  };

  const deleteRoutine = async (id: string) => {
    await supabase.from("routines").delete().eq("id", id);
    toast.success("Deleted");
    fetchData();
  };

  const toggleDay = (day: number) => {
    setForm(p => ({
      ...p,
      days_of_week: p.days_of_week.includes(day)
        ? p.days_of_week.filter(d => d !== day)
        : [...p.days_of_week, day].sort(),
    }));
  };

  const todaysRoutines = routines.filter(r => {
    const days: number[] = Array.isArray(r.days_of_week) ? r.days_of_week : [];
    return days.includes(todayDow);
  });

  const completedCount = todaysRoutines.filter(r => completions.has(r.id)).length;
  const completionPct = todaysRoutines.length ? Math.round((completedCount / todaysRoutines.length) * 100) : 0;

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      health: "gradient-health", fitness: "gradient-workout", work: "gradient-ai",
      learning: "gradient-routine", mindfulness: "gradient-routine", nutrition: "gradient-health", general: "gradient-ai",
    };
    return colors[cat] || "gradient-ai";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Daily Routines</h1>
          <p className="text-muted-foreground">Build habits that stick</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-routine text-accent-foreground border-0 hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> New Routine
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">New Routine</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Time</Label><Input type="time" value={form.scheduled_time} onChange={e => setForm(p => ({ ...p, scheduled_time: e.target.value }))} /></div>
                <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} /></div>
              </div>
              <div><Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Days</Label>
                <div className="flex gap-2 mt-2">
                  {dayLabels.map((d, i) => (
                    <button key={i} type="button" onClick={() => toggleDay(i + 1)}
                      className={`w-9 h-9 rounded-full text-xs font-medium transition-all ${form.days_of_week.includes(i + 1) ? "gradient-routine text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full gradient-routine text-accent-foreground border-0">Create Routine</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground">Today's Progress</p>
            <p className="text-2xl font-bold font-display">{completedCount}/{todaysRoutines.length} completed</p>
          </div>
          <div className="text-3xl font-bold font-display text-gradient-hero">{completionPct}%</div>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${completionPct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full gradient-routine rounded-full" />
        </div>
      </motion.div>

      {/* Routines List */}
      <AnimatePresence>
        <div className="space-y-3">
          {todaysRoutines.length === 0 && (
            <div className="glass-card p-12 text-center">
              <CalendarClock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No routines for today. Create one!</p>
            </div>
          )}
          {todaysRoutines.map((r, i) => {
            const done = completions.has(r.id);
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`glass-card p-4 flex items-center gap-4 ${done ? "opacity-70" : ""}`}>
                <button onClick={() => toggleCompletion(r.id)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${done ? "border-routine bg-routine" : "border-muted-foreground"}`}>
                  {done && <Check className="w-4 h-4 text-primary-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold font-display ${done ? "line-through" : ""}`}>{r.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full text-primary-foreground capitalize ${getCategoryColor(r.category)}`}>{r.category}</span>
                  </div>
                  <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.scheduled_time?.slice(0, 5)}</span>
                    <span>{r.duration_minutes}min</span>
                  </div>
                </div>
                <button onClick={() => deleteRoutine(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            );
          })}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default Routines;
