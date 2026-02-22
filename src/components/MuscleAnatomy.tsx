import { useMemo } from "react";

// Maps workout types to muscle groups they primarily target
const WORKOUT_MUSCLE_MAP: Record<string, string[]> = {
  strength: ["chest", "back", "shoulders", "biceps", "triceps", "quads", "hamstrings", "glutes"],
  cardio: ["quads", "hamstrings", "calves", "core"],
  hiit: ["core", "quads", "shoulders", "chest", "calves"],
  yoga: ["core", "back", "hamstrings", "shoulders"],
  flexibility: ["hamstrings", "back", "shoulders", "calves"],
  swimming: ["back", "shoulders", "triceps", "core", "chest"],
  running: ["quads", "hamstrings", "calves", "glutes", "core"],
  cycling: ["quads", "hamstrings", "calves", "glutes"],
};

// Intensity colors: higher = more red
const getIntensityColor = (intensity: number) => {
  if (intensity === 0) return "hsl(0 0% 30% / 0.3)";
  if (intensity <= 0.25) return "hsl(200, 85%, 50%)";
  if (intensity <= 0.5) return "hsl(168, 80%, 40%)";
  if (intensity <= 0.75) return "hsl(38, 92%, 55%)";
  return "hsl(340, 75%, 55%)";
};

interface MuscleAnatomyProps {
  workouts: Array<{ workout_type: string; completed: boolean; workout_date: string }>;
}

const MuscleAnatomy = ({ workouts }: MuscleAnatomyProps) => {
  const muscleIntensity = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const recentWorkouts = workouts.filter((w) => w.completed && w.workout_date >= today);
    
    const counts: Record<string, number> = {};
    recentWorkouts.forEach((w) => {
      const muscles = WORKOUT_MUSCLE_MAP[w.workout_type] || [];
      muscles.forEach((m) => {
        counts[m] = (counts[m] || 0) + 1;
      });
    });

    const max = Math.max(...Object.values(counts), 1);
    const normalized: Record<string, number> = {};
    Object.entries(counts).forEach(([k, v]) => {
      normalized[k] = v / max;
    });
    return normalized;
  }, [workouts]);

  const getColor = (muscle: string) => getIntensityColor(muscleIntensity[muscle] || 0);
  const inactive = "hsl(0 0% 30% / 0.3)";

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 200 400" className="w-full max-w-[220px] h-auto" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <ellipse cx="100" cy="30" rx="18" ry="22" fill="hsl(var(--muted) / 0.4)" stroke="hsl(var(--border))" strokeWidth="0.5" />
        
        {/* Neck */}
        <rect x="93" y="52" width="14" height="12" rx="3" fill="hsl(var(--muted) / 0.4)" />

        {/* Shoulders */}
        <ellipse cx="62" cy="75" rx="18" ry="10" fill={getColor("shoulders")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" />
        <ellipse cx="138" cy="75" rx="18" ry="10" fill={getColor("shoulders")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" />

        {/* Chest */}
        <path d="M75 70 Q100 65 125 70 Q128 90 100 95 Q72 90 75 70Z" fill={getColor("chest")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" />

        {/* Core / Abs */}
        <rect x="82" y="96" width="36" height="55" rx="8" fill={getColor("core")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" />
        {/* Ab lines */}
        <line x1="100" y1="100" x2="100" y2="148" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.5" />
        <line x1="85" y1="112" x2="115" y2="112" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.5" />
        <line x1="85" y1="126" x2="115" y2="126" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.5" />
        <line x1="85" y1="140" x2="115" y2="140" stroke="hsl(var(--border))" strokeWidth="0.3" opacity="0.5" />

        {/* Back (behind core, shown as side bands) */}
        <rect x="72" y="80" width="10" height="65" rx="4" fill={getColor("back")} stroke="hsl(var(--border))" strokeWidth="0.3" className="transition-colors duration-500" />
        <rect x="118" y="80" width="10" height="65" rx="4" fill={getColor("back")} stroke="hsl(var(--border))" strokeWidth="0.3" className="transition-colors duration-500" />

        {/* Biceps */}
        <ellipse cx="50" cy="110" rx="8" ry="22" fill={getColor("biceps")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" transform="rotate(-8 50 110)" />
        <ellipse cx="150" cy="110" rx="8" ry="22" fill={getColor("biceps")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" transform="rotate(8 150 110)" />

        {/* Triceps */}
        <ellipse cx="42" cy="112" rx="5" ry="18" fill={getColor("triceps")} stroke="hsl(var(--border))" strokeWidth="0.3" className="transition-colors duration-500" transform="rotate(-8 42 112)" />
        <ellipse cx="158" cy="112" rx="5" ry="18" fill={getColor("triceps")} stroke="hsl(var(--border))" strokeWidth="0.3" className="transition-colors duration-500" transform="rotate(8 158 112)" />

        {/* Forearms */}
        <ellipse cx="44" cy="148" rx="6" ry="18" fill={inactive} stroke="hsl(var(--border))" strokeWidth="0.3" transform="rotate(-5 44 148)" />
        <ellipse cx="156" cy="148" rx="6" ry="18" fill={inactive} stroke="hsl(var(--border))" strokeWidth="0.3" transform="rotate(5 156 148)" />

        {/* Glutes */}
        <ellipse cx="90" cy="160" rx="12" ry="10" fill={getColor("glutes")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" />
        <ellipse cx="110" cy="160" rx="12" ry="10" fill={getColor("glutes")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" />

        {/* Quads */}
        <ellipse cx="88" cy="210" rx="13" ry="38" fill={getColor("quads")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" />
        <ellipse cx="112" cy="210" rx="13" ry="38" fill={getColor("quads")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" />

        {/* Hamstrings (shown slightly behind quads) */}
        <ellipse cx="85" cy="215" rx="7" ry="32" fill={getColor("hamstrings")} stroke="hsl(var(--border))" strokeWidth="0.3" className="transition-colors duration-500" opacity="0.7" />
        <ellipse cx="115" cy="215" rx="7" ry="32" fill={getColor("hamstrings")} stroke="hsl(var(--border))" strokeWidth="0.3" className="transition-colors duration-500" opacity="0.7" />

        {/* Calves */}
        <ellipse cx="86" cy="300" rx="9" ry="30" fill={getColor("calves")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" />
        <ellipse cx="114" cy="300" rx="9" ry="30" fill={getColor("calves")} stroke="hsl(var(--border))" strokeWidth="0.5" className="transition-colors duration-500" />

        {/* Feet */}
        <ellipse cx="86" cy="340" rx="10" ry="5" fill="hsl(var(--muted) / 0.4)" />
        <ellipse cx="114" cy="340" rx="10" ry="5" fill="hsl(var(--muted) / 0.4)" />

        {/* Hands */}
        <circle cx="42" cy="170" r="5" fill="hsl(var(--muted) / 0.4)" />
        <circle cx="158" cy="170" r="5" fill="hsl(var(--muted) / 0.4)" />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-2 text-[10px]">
        {[
          { label: "Inactive", color: inactive },
          { label: "Light", color: "hsl(200, 85%, 50%)" },
          { label: "Moderate", color: "hsl(168, 80%, 40%)" },
          { label: "Active", color: "hsl(38, 92%, 55%)" },
          { label: "Intense", color: "hsl(340, 75%, 55%)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-sm" style={{ background: item.color }} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MuscleAnatomy;
