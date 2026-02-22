import { useMemo, useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

const MUSCLE_LABELS: Record<string, string> = {
  chest: "Pectorals", back: "Latissimus Dorsi", shoulders: "Deltoids",
  biceps: "Biceps", triceps: "Triceps", core: "Abdominals",
  quads: "Quadriceps", hamstrings: "Hamstrings", glutes: "Gluteals",
  calves: "Gastrocnemius", traps: "Trapezius", forearms: "Forearms",
};

const getIntensityColor = (intensity: number) => {
  if (intensity === 0) return "hsl(var(--muted) / 0.18)";
  if (intensity <= 0.25) return "hsl(200, 85%, 50%)";
  if (intensity <= 0.5) return "hsl(168, 80%, 40%)";
  if (intensity <= 0.75) return "hsl(38, 92%, 55%)";
  return "hsl(340, 75%, 55%)";
};

const getIntensityLabel = (intensity: number) => {
  if (intensity === 0) return "Inactive";
  if (intensity <= 0.25) return "Light";
  if (intensity <= 0.5) return "Moderate";
  if (intensity <= 0.75) return "Active";
  return "Intense";
};

interface MuscleAnatomyProps {
  workouts: Array<{ workout_type: string; completed: boolean; workout_date: string }>;
}

interface MusclePartProps {
  muscle: string;
  d?: string;
  cx?: number; cy?: number; rx?: number; ry?: number;
  transform?: string;
  intensity: number;
  hovered: string | null;
  onHover: (m: string | null) => void;
  shape?: "path" | "ellipse" | "rect";
  x?: number; y?: number; width?: number; height?: number; r?: number;
  opacity?: number;
}

const MusclePart = ({ muscle, d, cx, cy, rx, ry, transform, intensity, hovered, onHover, shape = "path", x, y, width, height, r, opacity = 1 }: MusclePartProps) => {
  const color = getIntensityColor(intensity);
  const isHovered = hovered === muscle;
  const label = MUSCLE_LABELS[muscle] || muscle;
  const intensityLabel = getIntensityLabel(intensity);

  const commonProps = {
    fill: color,
    stroke: isHovered ? "hsl(var(--foreground))" : "hsl(var(--border) / 0.6)",
    strokeWidth: isHovered ? 1.5 : 0.5,
    opacity: opacity,
    className: "transition-all duration-300 cursor-pointer",
    style: { filter: isHovered ? "brightness(1.3) drop-shadow(0 0 6px " + color + ")" : "none" } as React.CSSProperties,
    onMouseEnter: () => onHover(muscle),
    onMouseLeave: () => onHover(null),
    transform: transform,
  };

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          {shape === "path" ? (
            <path d={d} {...commonProps} />
          ) : shape === "ellipse" ? (
            <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...commonProps} />
          ) : shape === "rect" ? (
            <rect x={x} y={y} width={width} height={height} rx={r} {...commonProps} />
          ) : null}
        </TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <p className="font-semibold">{label}</p>
          <p className="text-muted-foreground">{intensityLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const MuscleAnatomy = ({ workouts }: MuscleAnatomyProps) => {
  const [hovered, setHovered] = useState<string | null>(null);

  const muscleIntensity = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const recentWorkouts = workouts.filter((w) => w.completed && w.workout_date >= today);
    const counts: Record<string, number> = {};
    recentWorkouts.forEach((w) => {
      const muscles = WORKOUT_MUSCLE_MAP[w.workout_type] || [];
      muscles.forEach((m) => { counts[m] = (counts[m] || 0) + 1; });
    });
    const max = Math.max(...Object.values(counts), 1);
    const normalized: Record<string, number> = {};
    Object.entries(counts).forEach(([k, v]) => { normalized[k] = v / max; });
    return normalized;
  }, [workouts]);

  const g = (muscle: string) => muscleIntensity[muscle] || 0;

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 260 480" className="w-full max-w-[260px] h-auto" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <ellipse cx="130" cy="32" rx="20" ry="24" fill="hsl(var(--muted) / 0.25)" stroke="hsl(var(--border) / 0.4)" strokeWidth="0.5" />
        {/* Neck */}
        <rect x="121" y="56" width="18" height="14" rx="4" fill="hsl(var(--muted) / 0.25)" />

        {/* Trapezius */}
        <MusclePart muscle="traps" shape="path"
          d="M112 62 Q100 58 80 72 L90 78 Q105 70 112 68Z" intensity={g("traps")} hovered={hovered} onHover={setHovered} />
        <MusclePart muscle="traps" shape="path"
          d="M148 62 Q160 58 180 72 L170 78 Q155 70 148 68Z" intensity={g("traps")} hovered={hovered} onHover={setHovered} />

        {/* Shoulders / Deltoids - rounded caps */}
        <MusclePart muscle="shoulders" shape="path"
          d="M80 72 Q68 68 58 80 Q54 92 62 100 L78 96 Q74 84 80 76Z" intensity={g("shoulders")} hovered={hovered} onHover={setHovered} />
        <MusclePart muscle="shoulders" shape="path"
          d="M180 72 Q192 68 202 80 Q206 92 198 100 L182 96 Q186 84 180 76Z" intensity={g("shoulders")} hovered={hovered} onHover={setHovered} />

        {/* Chest / Pectorals */}
        <MusclePart muscle="chest" shape="path"
          d="M82 78 Q96 74 130 76 Q130 74 130 76 Q164 74 178 78 Q182 96 130 106 Q78 96 82 78Z"
          intensity={g("chest")} hovered={hovered} onHover={setHovered} />

        {/* Core / Abs - segmented look */}
        <MusclePart muscle="core" shape="path"
          d="M108 108 Q130 104 152 108 L150 172 Q130 176 110 172Z"
          intensity={g("core")} hovered={hovered} onHover={setHovered} />
        {/* Ab detail lines */}
        <line x1="130" y1="110" x2="130" y2="170" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.4" />
        <line x1="112" y1="122" x2="148" y2="122" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.4" />
        <line x1="112" y1="136" x2="148" y2="136" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.4" />
        <line x1="112" y1="150" x2="148" y2="150" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.4" />
        <line x1="112" y1="164" x2="148" y2="164" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.4" />

        {/* Obliques / Back side bands */}
        <MusclePart muscle="back" shape="path"
          d="M80 82 L90 80 L92 96 L88 160 L80 156 Q76 120 80 82Z"
          intensity={g("back")} hovered={hovered} onHover={setHovered} />
        <MusclePart muscle="back" shape="path"
          d="M180 82 L170 80 L168 96 L172 160 L180 156 Q184 120 180 82Z"
          intensity={g("back")} hovered={hovered} onHover={setHovered} />

        {/* Biceps */}
        <MusclePart muscle="biceps" shape="path"
          d="M62 100 Q56 94 50 102 Q44 118 46 136 Q48 142 54 138 Q60 128 64 118 L66 104Z"
          intensity={g("biceps")} hovered={hovered} onHover={setHovered} />
        <MusclePart muscle="biceps" shape="path"
          d="M198 100 Q204 94 210 102 Q216 118 214 136 Q212 142 206 138 Q200 128 196 118 L194 104Z"
          intensity={g("biceps")} hovered={hovered} onHover={setHovered} />

        {/* Triceps */}
        <MusclePart muscle="triceps" shape="path"
          d="M50 102 Q44 98 40 106 Q36 120 38 136 Q40 140 46 136 L44 118 Q46 108 50 102Z"
          intensity={g("triceps")} hovered={hovered} onHover={setHovered} opacity={0.85} />
        <MusclePart muscle="triceps" shape="path"
          d="M210 102 Q216 98 220 106 Q224 120 222 136 Q220 140 214 136 L216 118 Q214 108 210 102Z"
          intensity={g("triceps")} hovered={hovered} onHover={setHovered} opacity={0.85} />

        {/* Forearms */}
        <MusclePart muscle="forearms" shape="path"
          d="M46 138 Q42 140 38 150 Q34 164 34 178 Q36 184 40 180 Q44 168 48 156 Q52 146 54 138Z"
          intensity={g("forearms")} hovered={hovered} onHover={setHovered} />
        <MusclePart muscle="forearms" shape="path"
          d="M214 138 Q218 140 222 150 Q226 164 226 178 Q224 184 220 180 Q216 168 212 156 Q208 146 206 138Z"
          intensity={g("forearms")} hovered={hovered} onHover={setHovered} />

        {/* Hands */}
        <ellipse cx="36" cy="192" rx="6" ry="8" fill="hsl(var(--muted) / 0.2)" />
        <ellipse cx="224" cy="192" rx="6" ry="8" fill="hsl(var(--muted) / 0.2)" />

        {/* Glutes */}
        <MusclePart muscle="glutes" shape="path"
          d="M100 172 Q108 168 130 170 Q130 168 130 170 Q152 168 160 172 Q164 186 130 194 Q96 186 100 172Z"
          intensity={g("glutes")} hovered={hovered} onHover={setHovered} />

        {/* Quads */}
        <MusclePart muscle="quads" shape="path"
          d="M102 194 Q96 196 94 210 Q90 240 92 270 Q96 280 106 278 Q112 270 114 250 Q116 230 112 210 Q110 198 102 194Z"
          intensity={g("quads")} hovered={hovered} onHover={setHovered} />
        <MusclePart muscle="quads" shape="path"
          d="M158 194 Q164 196 166 210 Q170 240 168 270 Q164 280 154 278 Q148 270 146 250 Q144 230 148 210 Q150 198 158 194Z"
          intensity={g("quads")} hovered={hovered} onHover={setHovered} />

        {/* Inner quads */}
        <MusclePart muscle="quads" shape="path"
          d="M114 200 Q120 196 130 198 Q130 196 130 198 Q140 196 146 200 Q148 220 130 260 Q112 220 114 200Z"
          intensity={g("quads")} hovered={hovered} onHover={setHovered} opacity={0.7} />

        {/* Hamstrings */}
        <MusclePart muscle="hamstrings" shape="path"
          d="M96 210 Q92 212 90 230 Q88 250 92 268 Q94 264 96 260 Q100 240 98 220Z"
          intensity={g("hamstrings")} hovered={hovered} onHover={setHovered} opacity={0.75} />
        <MusclePart muscle="hamstrings" shape="path"
          d="M164 210 Q168 212 170 230 Q172 250 168 268 Q166 264 164 260 Q160 240 162 220Z"
          intensity={g("hamstrings")} hovered={hovered} onHover={setHovered} opacity={0.75} />

        {/* Knees */}
        <ellipse cx="104" cy="286" rx="10" ry="8" fill="hsl(var(--muted) / 0.15)" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.3" />
        <ellipse cx="156" cy="286" rx="10" ry="8" fill="hsl(var(--muted) / 0.15)" stroke="hsl(var(--border) / 0.3)" strokeWidth="0.3" />

        {/* Calves */}
        <MusclePart muscle="calves" shape="path"
          d="M96 294 Q92 296 90 316 Q88 340 92 362 Q98 372 108 368 Q114 360 112 340 Q110 316 106 300 Q104 294 96 294Z"
          intensity={g("calves")} hovered={hovered} onHover={setHovered} />
        <MusclePart muscle="calves" shape="path"
          d="M164 294 Q168 296 170 316 Q172 340 168 362 Q162 372 152 368 Q146 360 148 340 Q150 316 154 300 Q156 294 164 294Z"
          intensity={g("calves")} hovered={hovered} onHover={setHovered} />

        {/* Shins */}
        <path d="M108 300 Q112 298 114 316 Q116 340 112 368 L108 368 Q110 340 108 316Z" fill="hsl(var(--muted) / 0.12)" />
        <path d="M152 300 Q148 298 146 316 Q144 340 148 368 L152 368 Q150 340 152 316Z" fill="hsl(var(--muted) / 0.12)" />

        {/* Ankles */}
        <rect x="94" y="370" width="20" height="8" rx="4" fill="hsl(var(--muted) / 0.15)" />
        <rect x="146" y="370" width="20" height="8" rx="4" fill="hsl(var(--muted) / 0.15)" />

        {/* Feet */}
        <path d="M92 378 Q88 382 86 388 Q84 394 90 396 L114 396 Q118 394 116 388 L114 378Z" fill="hsl(var(--muted) / 0.2)" />
        <path d="M168 378 Q172 382 174 388 Q176 394 170 396 L146 396 Q142 394 144 388 L146 378Z" fill="hsl(var(--muted) / 0.2)" />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-3 text-[10px]">
        {[
          { label: "Inactive", color: "hsl(var(--muted) / 0.18)" },
          { label: "Light", color: "hsl(200, 85%, 50%)" },
          { label: "Moderate", color: "hsl(168, 80%, 40%)" },
          { label: "Active", color: "hsl(38, 92%, 55%)" },
          { label: "Intense", color: "hsl(340, 75%, 55%)" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full border border-border/30" style={{ background: item.color }} />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>

      {hovered && (
        <p className="text-xs text-center text-muted-foreground animate-in fade-in-50">
          <span className="font-medium text-foreground">{MUSCLE_LABELS[hovered] || hovered}</span>
          {" · "}{getIntensityLabel(g(hovered))}
        </p>
      )}
    </div>
  );
};

export default MuscleAnatomy;
