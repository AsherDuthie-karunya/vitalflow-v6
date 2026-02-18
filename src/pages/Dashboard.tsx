import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Heart, Activity, Moon, Droplets, Flame, Footprints, Brain, Plus, TrendingUp, Scale, Zap, Target, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { format, subDays } from "date-fns";

const metricCards = [
  { key: "heart_rate", label: "Heart Rate", icon: Heart, unit: "bpm", gradient: "gradient-workout", color: "hsl(340, 75%, 55%)" },
  { key: "steps", label: "Steps", icon: Footprints, unit: "steps", gradient: "gradient-health", color: "hsl(168, 80%, 36%)" },
  { key: "calories", label: "Calories", icon: Flame, unit: "kcal", gradient: "gradient-ai", color: "hsl(38, 92%, 55%)" },
  { key: "sleep_hours", label: "Sleep", icon: Moon, unit: "hrs", gradient: "gradient-routine", color: "hsl(262, 70%, 58%)" },
  { key: "water_intake", label: "Water", icon: Droplets, unit: "L", gradient: "gradient-health", color: "hsl(200, 85%, 50%)" },
  { key: "mood", label: "Mood", icon: Brain, unit: "", gradient: "gradient-ai", color: "hsl(20, 90%, 55%)" },
];

const moods = ["😊 Great", "🙂 Good", "😐 Okay", "😔 Low", "😴 Tired"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const CHART_COLORS = ["hsl(168, 80%, 36%)", "hsl(340, 75%, 55%)", "hsl(262, 70%, 58%)", "hsl(38, 92%, 55%)", "hsl(200, 85%, 50%)"];

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [weeklyMetrics, setWeeklyMetrics] = useState<any[]>([]);
  const [todayWorkouts, setTodayWorkouts] = useState(0);
  const [weeklyWorkoutStats, setWeeklyWorkoutStats] = useState({ count: 0, totalDuration: 0, totalCalories: 0 });
  const [routineCompletion, setRoutineCompletion] = useState(0);
  const [healthScore, setHealthScore] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const [formData, setFormData] = useState({
    weight: "", blood_pressure_sys: "", blood_pressure_dia: "", heart_rate: "",
    sleep_hours: "", water_intake: "", calories: "", steps: "", mood: "", notes: "",
  });

  const fetchData = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const weekAgo = subDays(new Date(), 6).toISOString().split("T")[0];

    const { data: m } = await supabase.from("health_metrics").select("*")
      .eq("user_id", user.id).eq("metric_date", today).maybeSingle();
    setMetrics(m);

    // Fetch 7-day metrics for charts
    const { data: weekly } = await supabase.from("health_metrics").select("*")
      .eq("user_id", user.id).gte("metric_date", weekAgo).order("metric_date");
    
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i);
      const dateStr = format(d, "yyyy-MM-dd");
      const dayData = (weekly || []).find((w: any) => w.metric_date === dateStr);
      last7.push({
        day: format(d, "EEE"),
        date: dateStr,
        heart_rate: dayData?.heart_rate || null,
        steps: dayData?.steps || null,
        calories: dayData?.calories || null,
        sleep_hours: dayData?.sleep_hours || null,
        water_intake: dayData?.water_intake || null,
        weight: dayData?.weight || null,
      });
    }
    setWeeklyMetrics(last7);

    const { count: wc } = await supabase.from("workouts").select("*", { count: "exact", head: true })
      .eq("user_id", user.id).eq("workout_date", today).eq("completed", true);
    setTodayWorkouts(wc || 0);

    // Weekly workout stats
    const { data: weekWorkouts } = await supabase.from("workouts").select("duration_minutes, calories_burned")
      .eq("user_id", user.id).gte("workout_date", weekAgo).eq("completed", true);
    if (weekWorkouts) {
      setWeeklyWorkoutStats({
        count: weekWorkouts.length,
        totalDuration: weekWorkouts.reduce((s, w) => s + (w.duration_minutes || 0), 0),
        totalCalories: weekWorkouts.reduce((s, w) => s + (w.calories_burned || 0), 0),
      });
    }

    const { count: totalRoutines } = await supabase.from("routines").select("*", { count: "exact", head: true })
      .eq("user_id", user.id).eq("is_active", true);
    const { count: completedRoutines } = await supabase.from("routine_completions").select("*", { count: "exact", head: true })
      .eq("user_id", user.id).eq("completed_date", today);
    const rPct = totalRoutines ? Math.round(((completedRoutines || 0) / totalRoutines) * 100) : 0;
    setRoutineCompletion(rPct);

    // Compute a simple health score
    let score = 0; let factors = 0;
    if (m?.heart_rate) { score += (m.heart_rate >= 60 && m.heart_rate <= 100) ? 100 : 50; factors++; }
    if (m?.sleep_hours) { score += (m.sleep_hours >= 7 && m.sleep_hours <= 9) ? 100 : m.sleep_hours >= 5 ? 70 : 40; factors++; }
    if (m?.steps) { score += m.steps >= 10000 ? 100 : m.steps >= 5000 ? 70 : 40; factors++; }
    if (m?.water_intake) { score += m.water_intake >= 2.5 ? 100 : m.water_intake >= 1.5 ? 70 : 40; factors++; }
    if (wc && wc > 0) { score += 100; factors++; }
    if (rPct > 0) { score += rPct; factors++; }
    setHealthScore(factors > 0 ? Math.round(score / factors) : 0);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleLogMetrics = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];
    const payload: any = { user_id: user.id, metric_date: today };
    Object.entries(formData).forEach(([k, v]) => { if (v) payload[k] = k === "mood" || k === "notes" ? v : Number(v); });
    if (metrics) {
      await supabase.from("health_metrics").update(payload).eq("id", metrics.id);
    } else {
      await supabase.from("health_metrics").insert(payload);
    }
    toast.success("Metrics logged!");
    setLogOpen(false);
    fetchData();
  };

  const getValue = (key: string) => {
    if (!metrics) return "—";
    return metrics[key] ?? "—";
  };

  const getScoreColor = () => {
    if (healthScore >= 80) return "text-gradient-health";
    if (healthScore >= 50) return "text-gradient-hero";
    return "text-destructive";
  };

  const moodDistribution = () => {
    const moodCounts: Record<string, number> = {};
    weeklyMetrics.forEach(d => {
      if (d.mood) { moodCounts[d.mood] = (moodCounts[d.mood] || 0) + 1; }
    });
    return Object.entries(moodCounts).map(([name, value]) => ({ name, value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Dashboard</h1>
          <p className="text-muted-foreground">Your health at a glance</p>
        </div>
        <Dialog open={logOpen} onOpenChange={setLogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-health text-primary-foreground border-0 hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> Log Metrics
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">Log Today's Metrics</DialogTitle></DialogHeader>
            <form onSubmit={handleLogMetrics} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Heart Rate (bpm)</Label><Input type="number" value={formData.heart_rate} onChange={e => setFormData(p => ({ ...p, heart_rate: e.target.value }))} /></div>
                <div><Label>Steps</Label><Input type="number" value={formData.steps} onChange={e => setFormData(p => ({ ...p, steps: e.target.value }))} /></div>
                <div><Label>Calories (kcal)</Label><Input type="number" value={formData.calories} onChange={e => setFormData(p => ({ ...p, calories: e.target.value }))} /></div>
                <div><Label>Sleep (hours)</Label><Input type="number" step="0.5" value={formData.sleep_hours} onChange={e => setFormData(p => ({ ...p, sleep_hours: e.target.value }))} /></div>
                <div><Label>Water (L)</Label><Input type="number" step="0.1" value={formData.water_intake} onChange={e => setFormData(p => ({ ...p, water_intake: e.target.value }))} /></div>
                <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={formData.weight} onChange={e => setFormData(p => ({ ...p, weight: e.target.value }))} /></div>
                <div><Label>BP Systolic</Label><Input type="number" value={formData.blood_pressure_sys} onChange={e => setFormData(p => ({ ...p, blood_pressure_sys: e.target.value }))} /></div>
                <div><Label>BP Diastolic</Label><Input type="number" value={formData.blood_pressure_dia} onChange={e => setFormData(p => ({ ...p, blood_pressure_dia: e.target.value }))} /></div>
              </div>
              <div>
                <Label>Mood</Label>
                <Select value={formData.mood} onValueChange={v => setFormData(p => ({ ...p, mood: v }))}>
                  <SelectTrigger><SelectValue placeholder="How are you feeling?" /></SelectTrigger>
                  <SelectContent>{moods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full gradient-health text-primary-foreground border-0">Save Metrics</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Health Score + Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="glass-card p-6 flex flex-col items-center justify-center">
          <Target className="w-6 h-6 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground mb-1">Health Score</p>
          <p className={`text-4xl font-bold font-display ${getScoreColor()}`}>{healthScore || "—"}</p>
          <p className="text-[10px] text-muted-foreground mt-1">out of 100</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.05 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg gradient-workout"><Zap className="w-4 h-4 text-secondary-foreground" /></div>
            <p className="text-sm text-muted-foreground">Weekly Workouts</p>
          </div>
          <p className="text-2xl font-bold font-display">{weeklyWorkoutStats.count}</p>
          <p className="text-xs text-muted-foreground">{weeklyWorkoutStats.totalDuration} min total</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg gradient-ai"><Flame className="w-4 h-4 text-secondary-foreground" /></div>
            <p className="text-sm text-muted-foreground">Calories Burned</p>
          </div>
          <p className="text-2xl font-bold font-display">{weeklyWorkoutStats.totalCalories}</p>
          <p className="text-xs text-muted-foreground">this week</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg gradient-routine"><Calendar className="w-4 h-4 text-accent-foreground" /></div>
            <p className="text-sm text-muted-foreground">Routine Completion</p>
          </div>
          <p className="text-2xl font-bold font-display">{routineCompletion}%</p>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
            <div className="h-full gradient-routine rounded-full transition-all" style={{ width: `${routineCompletion}%` }} />
          </div>
        </motion.div>
      </div>

      {/* Metric Cards */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metricCards.map((mc) => (
          <motion.div key={mc.key} variants={item} className="glass-card p-4 space-y-2">
            <div className={`w-8 h-8 rounded-lg ${mc.gradient} flex items-center justify-center`}>
              <mc.icon className="w-4 h-4 text-primary-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">{mc.label}</p>
            <p className="text-xl font-bold font-display">
              {getValue(mc.key)} <span className="text-xs font-normal text-muted-foreground">{mc.unit}</span>
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Heart Rate + Steps Trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Heart className="w-4 h-4" style={{ color: "hsl(340, 75%, 55%)" }} /> Heart Rate & Steps (7 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weeklyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 83% / 0.3)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <YAxis yAxisId="hr" orientation="left" tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <YAxis yAxisId="steps" orientation="right" tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 14%)", border: "none", borderRadius: 8, color: "hsl(0 0% 98%)" }} />
              <Line yAxisId="hr" type="monotone" dataKey="heart_rate" stroke="hsl(340, 75%, 55%)" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Heart Rate" />
              <Line yAxisId="steps" type="monotone" dataKey="steps" stroke="hsl(168, 80%, 36%)" strokeWidth={2} dot={{ r: 3 }} connectNulls name="Steps" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Sleep & Water */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Moon className="w-4 h-4" style={{ color: "hsl(262, 70%, 58%)" }} /> Sleep & Water (7 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyMetrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 83% / 0.3)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 14%)", border: "none", borderRadius: 8, color: "hsl(0 0% 98%)" }} />
              <Bar dataKey="sleep_hours" fill="hsl(262, 70%, 58%)" radius={[4, 4, 0, 0]} name="Sleep (hrs)" />
              <Bar dataKey="water_intake" fill="hsl(200, 85%, 50%)" radius={[4, 4, 0, 0]} name="Water (L)" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Calories + Weight Trend */}
      <div className="grid md:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Flame className="w-4 h-4" style={{ color: "hsl(38, 92%, 55%)" }} /> Calorie Intake (7 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyMetrics}>
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(38, 92%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 83% / 0.3)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 14%)", border: "none", borderRadius: 8, color: "hsl(0 0% 98%)" }} />
              <Area type="monotone" dataKey="calories" stroke="hsl(38, 92%, 55%)" fill="url(#calGrad)" strokeWidth={2} connectNulls name="Calories" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6">
          <h3 className="font-display font-semibold mb-4 flex items-center gap-2">
            <Scale className="w-4 h-4" style={{ color: "hsl(168, 80%, 36%)" }} /> Weight Trend (7 days)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weeklyMetrics}>
              <defs>
                <linearGradient id="wtGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(168, 80%, 36%)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(168, 80%, 36%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 83% / 0.3)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <YAxis domain={["dataMin - 1", "dataMax + 1"]} tick={{ fontSize: 11, fill: "hsl(0 0% 63%)" }} />
              <Tooltip contentStyle={{ background: "hsl(0 0% 14%)", border: "none", borderRadius: 8, color: "hsl(0 0% 98%)" }} />
              <Area type="monotone" dataKey="weight" stroke="hsl(168, 80%, 36%)" fill="url(#wtGrad)" strokeWidth={2} connectNulls name="Weight (kg)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Summary Cards Row */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg gradient-workout"><Activity className="w-5 h-5 text-secondary-foreground" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Workouts Today</p>
              <p className="text-2xl font-bold font-display">{todayWorkouts}</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-workout rounded-full transition-all" style={{ width: `${Math.min(todayWorkouts * 33, 100)}%` }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg gradient-health"><Heart className="w-5 h-5 text-primary-foreground" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Blood Pressure</p>
              <p className="text-2xl font-bold font-display">
                {metrics?.blood_pressure_sys && metrics?.blood_pressure_dia
                  ? `${metrics.blood_pressure_sys}/${metrics.blood_pressure_dia}`
                  : "—/—"}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">mmHg</p>
        </motion.div>

        {/* Mood Distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h3 className="font-display font-semibold text-sm mb-2 flex items-center gap-2">
            <Brain className="w-4 h-4" /> Weekly Mood
          </h3>
          {moodDistribution().length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie data={moodDistribution()} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={40}>
                  {moodDistribution().map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(0 0% 14%)", border: "none", borderRadius: 8, color: "hsl(0 0% 98%)" }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-8">Log your mood to see trends</p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
