import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { Dumbbell, Plus, Check, Trash2, Clock, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const workoutTypes = ["strength", "cardio", "flexibility", "hiit", "yoga", "swimming", "running", "cycling"];

const Workouts = () => {
  const { user } = useAuth();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", workout_type: "strength", duration_minutes: "", calories_burned: "", notes: "",
    exercises: [{ name: "", sets: "", reps: "", weight: "" }],
  });

  const fetchWorkouts = async () => {
    if (!user) return;
    const { data } = await supabase.from("workouts").select("*")
      .eq("user_id", user.id).order("workout_date", { ascending: false }).limit(20);
    setWorkouts(data || []);
  };

  useEffect(() => { fetchWorkouts(); }, [user]);

  const addExercise = () => setForm(p => ({ ...p, exercises: [...p.exercises, { name: "", sets: "", reps: "", weight: "" }] }));

  const updateExercise = (i: number, field: string, value: string) => {
    const exs = [...form.exercises];
    (exs[i] as any)[field] = value;
    setForm(p => ({ ...p, exercises: exs }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const { error } = await supabase.from("workouts").insert({
      user_id: user.id,
      name: form.name,
      workout_type: form.workout_type,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : null,
      calories_burned: form.calories_burned ? Number(form.calories_burned) : null,
      notes: form.notes || null,
      exercises: form.exercises.filter(e => e.name).map(e => ({
        name: e.name, sets: Number(e.sets) || 0, reps: Number(e.reps) || 0, weight: Number(e.weight) || 0,
      })),
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Workout added!");
    setOpen(false);
    setForm({ name: "", workout_type: "strength", duration_minutes: "", calories_burned: "", notes: "", exercises: [{ name: "", sets: "", reps: "", weight: "" }] });
    fetchWorkouts();
  };

  const toggleComplete = async (id: string, current: boolean) => {
    await supabase.from("workouts").update({ completed: !current }).eq("id", id);
    fetchWorkouts();
  };

  const deleteWorkout = async (id: string) => {
    await supabase.from("workouts").delete().eq("id", id);
    toast.success("Deleted");
    fetchWorkouts();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display">Workouts</h1>
          <p className="text-muted-foreground">Plan and track your training</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-workout text-secondary-foreground border-0 hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" /> New Workout
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">New Workout</DialogTitle></DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><Label>Name</Label><Input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required /></div>
              <div><Label>Type</Label>
                <Select value={form.workout_type} onValueChange={v => setForm(p => ({ ...p, workout_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{workoutTypes.map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Duration (min)</Label><Input type="number" value={form.duration_minutes} onChange={e => setForm(p => ({ ...p, duration_minutes: e.target.value }))} /></div>
                <div><Label>Calories</Label><Input type="number" value={form.calories_burned} onChange={e => setForm(p => ({ ...p, calories_burned: e.target.value }))} /></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Exercises</Label>
                  <Button type="button" variant="ghost" size="sm" onClick={addExercise}><Plus className="w-3 h-3 mr-1" /> Add</Button>
                </div>
                {form.exercises.map((ex, i) => (
                  <div key={i} className="grid grid-cols-4 gap-2">
                    <Input placeholder="Exercise" value={ex.name} onChange={e => updateExercise(i, "name", e.target.value)} className="col-span-4 sm:col-span-1" />
                    <Input placeholder="Sets" type="number" value={ex.sets} onChange={e => updateExercise(i, "sets", e.target.value)} />
                    <Input placeholder="Reps" type="number" value={ex.reps} onChange={e => updateExercise(i, "reps", e.target.value)} />
                    <Input placeholder="Weight" type="number" value={ex.weight} onChange={e => updateExercise(i, "weight", e.target.value)} />
                  </div>
                ))}
              </div>

              <Button type="submit" className="w-full gradient-workout text-secondary-foreground border-0">Save Workout</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <AnimatePresence>
        <div className="space-y-3">
          {workouts.length === 0 && (
            <div className="glass-card p-12 text-center">
              <Dumbbell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No workouts yet. Add your first one!</p>
            </div>
          )}
          {workouts.map((w, i) => {
            const exercises = Array.isArray(w.exercises) ? w.exercises : [];
            return (
              <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`glass-card p-4 flex items-center gap-4 ${w.completed ? "opacity-70" : ""}`}>
                <button onClick={() => toggleComplete(w.id, w.completed)}
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${w.completed ? "border-health bg-health" : "border-muted-foreground"}`}>
                  {w.completed && <Check className="w-4 h-4 text-primary-foreground" />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-semibold font-display truncate ${w.completed ? "line-through" : ""}`}>{w.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">{w.workout_type}</span>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    {w.duration_minutes && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{w.duration_minutes}m</span>}
                    {w.calories_burned && <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{w.calories_burned}cal</span>}
                    {exercises.length > 0 && <span>{exercises.length} exercises</span>}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">{w.workout_date}</span>
                <button onClick={() => deleteWorkout(w.id)} className="text-muted-foreground hover:text-destructive transition-colors">
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

export default Workouts;
