import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { Heart, Activity, Moon, Droplets, Flame, Footprints, Brain, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const metricCards = [
  { key: "heart_rate", label: "Heart Rate", icon: Heart, unit: "bpm", gradient: "gradient-workout", color: "text-workout" },
  { key: "steps", label: "Steps", icon: Footprints, unit: "steps", gradient: "gradient-health", color: "text-health" },
  { key: "calories", label: "Calories", icon: Flame, unit: "kcal", gradient: "gradient-ai", color: "text-ai" },
  { key: "sleep_hours", label: "Sleep", icon: Moon, unit: "hrs", gradient: "gradient-routine", color: "text-routine" },
  { key: "water_intake", label: "Water", icon: Droplets, unit: "L", gradient: "gradient-health", color: "text-ocean" },
  { key: "mood", label: "Mood", icon: Brain, unit: "", gradient: "gradient-ai", color: "text-ai" },
];

const moods = ["😊 Great", "🙂 Good", "😐 Okay", "😔 Low", "😴 Tired"];

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const Dashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [todayWorkouts, setTodayWorkouts] = useState(0);
  const [routineCompletion, setRoutineCompletion] = useState(0);
  const [logOpen, setLogOpen] = useState(false);
  const [formData, setFormData] = useState({
    weight: "", blood_pressure_sys: "", blood_pressure_dia: "", heart_rate: "",
    sleep_hours: "", water_intake: "", calories: "", steps: "", mood: "", notes: "",
  });

  const fetchData = async () => {
    if (!user) return;
    const today = new Date().toISOString().split("T")[0];

    const { data: m } = await supabase.from("health_metrics").select("*")
      .eq("user_id", user.id).eq("metric_date", today).maybeSingle();
    setMetrics(m);

    const { count: wc } = await supabase.from("workouts").select("*", { count: "exact", head: true })
      .eq("user_id", user.id).eq("workout_date", today).eq("completed", true);
    setTodayWorkouts(wc || 0);

    const { count: totalRoutines } = await supabase.from("routines").select("*", { count: "exact", head: true })
      .eq("user_id", user.id).eq("is_active", true);
    const { count: completedRoutines } = await supabase.from("routine_completions").select("*", { count: "exact", head: true })
      .eq("user_id", user.id).eq("completed_date", today);
    setRoutineCompletion(totalRoutines ? Math.round(((completedRoutines || 0) / totalRoutines) * 100) : 0);
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
    const v = metrics[key];
    return v ?? "—";
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

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
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

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg gradient-routine"><TrendingUp className="w-5 h-5 text-accent-foreground" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Routine Completion</p>
              <p className="text-2xl font-bold font-display">{routineCompletion}%</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full gradient-routine rounded-full transition-all" style={{ width: `${routineCompletion}%` }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
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
      </div>
    </div>
  );
};

export default Dashboard;
