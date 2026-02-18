import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarClock, Plus, Check, Trash2, Clock, Award, TrendingUp, ListChecks, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

const categories = ["health", "fitness", "work", "learning", "mindfulness", "nutrition", "general"];
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CAT_COLORS: Record<string, string> = {
  health: "hsl(168, 80%, 36%)", fitness: "hsl(340, 75%, 55%)", work: "hsl(38, 92%, 55%)",
  learning: "hsl(262, 70%, 58%)", mindfulness: "hsl(200, 85%, 50%)", nutrition: "hsl(20, 90%, 55%)",
  general: "hsl(0, 0%, 63%)",
};

const Routines = () => {
  const { user } = useAuth();
  const [routines, setRoutines] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Set<string>>(new Set());
  const [weeklyCompletionData, setWeeklyCompletionData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "", scheduled_time: "08:00", duration_minutes: "30", category: "general",
    days_of_week: [1, 2, 3, 4, 5, 6, 7],
  });

  const today = new Date().toISOString().split("T")[0];
  const todayDow = new Date().getDay() || 7;

  const fetchData = async () => {
    if (!user) return;
    const { data: r } = await supabase.from("routines").select("*")
      .eq("user_id", user.id).eq("is_active", true).order("scheduled_time");
    setRoutines(r || []);

    const { data: c } = await supabase.from("routine_completions").select("routine_id, completed_date")
      .eq("user_id", user.id).gte("completed_date", subDays(new Date(), 6).toISOString().split("T")[0]);
    
    const todayCompletions = (c || []).filter((x: any) => x.completed_date === today);
    setCompletions(new Set(todayCompletions.map((x: any) => x.routine_id)));

    // Total completed all time
    const { count: totalC } = await supabase.from("routine_completions").select("*", { count: "exact", head: true })
      .eq("user_id", user.id);
    setTotalCompleted(totalC || 0);

    // Weekly completion bar chart
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dow = d.getDay() || 7;
      const scheduledForDay = (r || []).filter((rt: any) => {
        const days: number[] = Array.isArray(rt.days_of_week) ? rt.days_of_week : [];
        return days.includes(dow);
      });
      const completedForDay = (c || []).filter((x: any) => x.completed_date === dateStr);
      weekly.push({
        day: format(d, "EEE"),
        scheduled: scheduledForDay.length,
        completed: completedForDay.length,
      });
    }
    setWeeklyCompletionData(weekly);

    // Category distribution
    const catCounts: Record<string, number> = {};
    (r || []).forEach((rt: any) => { catCounts[rt.category] = (catCounts[rt.category] || 0) + 1; });
    setCategoryData(Object.entries(catCounts).map(([name, value]) => ({ name, value })));

    // Streak calculation
    let s = 0;
    for (let i = 0; i < 30; i++) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dow = d.getDay() || 7;
      const scheduledForDay = (r || []).filter((rt: any) => {
        const days: number[] = Array.isArray(rt.days_of_week) ? rt.days_of_week : [];
        return days.includes(dow);
      });
      if (scheduledForDay.length === 0) { s++; continue; }
      const completedForDay = (c || []).filter((x: any) => x.completed_date === dateStr);
      if (completedForDay.length >= scheduledForDay.length) s++;
      else break;
    }
    setStreak(s);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("routines").insert({
      user_id: user.id, title: form.title, scheduled_time: form.scheduled_time,
      duration_minutes: Number(form.duration_minutes), category: form.category, days_of_week: form.days_of_week,
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
      await supabase.from("routine_completions").insert({ user_id: user.id, routine_id: routineId, completed_date: today });
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
      ...p, days_of_week: p.days_of_week.includes(day) ? p.days_of_week.filter(d => d !== day) : [...p.days_of_week, day].sort(),
    }));
  };

  const todaysRoutines = routines.filter(r => {
    const days: number[] = Array.isArray(r.days_of_week) ? r.days_of_week : [];
    return days.includes(todayDow);
  });

  const completedCount = todaysRoutines.filter(r => completions.has(r.id)).length;
  const completionPct = todaysRoutines.length ? Math.round((completedCount / todaysRoutines.length) * 100) : 0;

  const getCategoryColor = (cat: string) => CAT_COLORS[cat] || "hsl(0, 0%, 63%)";
  const getCategoryGradient = (cat: string) => {
    const g: Record<string, string> = {
      health: "gradient-health", fitness: "gradient-workout", work: "gradient-ai",
      learning: "gradient-routine", mindfulness: "gradient-routine", nutrition: "gradient-health", general: "gradient-ai",
    };
    return g[cat] || "gradient-ai";
  };

  const RoutineCard = ({ r, i, done }: { r: any; i: number; done: boolean }) => (
    <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
      className={`glass-card p-4 flex items-center gap-4 ${done ? "opacity-70" : ""}`}>
      <button onClick={() => toggleCompletion(r.id)}
        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all`}
        style={done ? { borderColor: getCategoryColor(r.category), background: getCategoryColor(r.category) } : { borderColor: "hsl(0 0% 63%)" }}>
        {done && <Check className="w-4 h-4 text-primary-foreground" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className={`font-semibold font-display ${done ? "line-through" : ""}`}>{r.title}</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full text-primary-foreground capitalize" style={{ background: getCategoryColor(r.category) }}>{r.category}</span>
        </div>
        <div className="flex gap-3 text-sm text-muted-foreground mt-1">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.scheduled_time?.slice(0, 5)}</span>
          <span>{r.duration_minutes}min</span>
          <span className="text-[10px]">{(r.days_of_week || []).map((d: number) => dayLabels[d - 1]).join(", ")}</span>
        </div>
      </div>
      <button onClick={() => deleteRoutine(r.id)} className="text-muted-foreground hover:text-destructive transition-colors">
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );

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

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Today's Progress", value: `${completionPct}%`, sub: `${completedCount}/${todaysRoutines.length}`, icon: TrendingUp, gradient: "gradient-routine" },
          { label: "Current Streak", value: `${streak}d`, sub: "consecutive", icon: Award, gradient: "gradient-workout" },
          { label: "Active Routines", value: routines.length, sub: "habits", icon: ListChecks, gradient: "gradient-health" },
          { label: "Total Completed", value: totalCompleted, sub: "all time", icon: BarChart3, gradient: "gradient-ai" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card p-4 text-center">
            <div className={`w-8 h-8 rounded-lg ${s.gradient} flex items-center justify-center mx-auto mb-2`}>
              <s.icon className="w-4 h-4 text-primary-foreground" />
            </div>
            <p className="text-lg font-bold font-display">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
            <p className="text-[9px] text-muted-foreground">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
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

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4">Weekly Completion</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyCompletionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 83% / 0.3)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 14%)", border: "none", borderRadius: 8, color: "hsl(0 0% 98%)" }} />
              <Bar dataKey="scheduled" fill="hsl(0 0% 45%)" radius={[4, 4, 0, 0]} name="Scheduled" />
              <Bar dataKey="completed" fill="hsl(262, 70%, 58%)" radius={[4, 4, 0, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4">Category Breakdown</h3>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {categoryData.map((entry, i) => <Cell key={i} fill={getCategoryColor(entry.name)} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(0 0% 14%)", border: "none", borderRadius: 8, color: "hsl(0 0% 98%)" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-16">Create routines to see breakdown</p>
          )}
        </motion.div>
      </div>

      {/* Routines Tabs */}
      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today">Today ({todaysRoutines.length})</TabsTrigger>
          <TabsTrigger value="all">All Routines ({routines.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <AnimatePresence>
            <div className="space-y-3">
              {todaysRoutines.length === 0 && (
                <div className="glass-card p-12 text-center">
                  <CalendarClock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No routines for today. Create one!</p>
                </div>
              )}
              {todaysRoutines.map((r, i) => <RoutineCard key={r.id} r={r} i={i} done={completions.has(r.id)} />)}
            </div>
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="all">
          <AnimatePresence>
            <div className="space-y-3">
              {routines.length === 0 && (
                <div className="glass-card p-12 text-center">
                  <CalendarClock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No routines yet. Create one!</p>
                </div>
              )}
              {routines.map((r, i) => <RoutineCard key={r.id} r={r} i={i} done={completions.has(r.id)} />)}
            </div>
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Routines;
