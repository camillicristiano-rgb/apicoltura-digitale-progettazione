import { cn } from "@/lib/utils";
import { AlertTriangle, Check, Scale } from "lucide-react";

export function WeightGraph({
  value,
  optimalValue,
  min = 0,
  max = 100,
  size = 96,
  className,
  showLabel = true,
}) {
  // Calcola la percentuale basata sul range
  const percentage = Math.min(
    100,
    Math.max(0, ((value - min) / (max - min)) * 100),
  );
  const optimalPercentage = optimalValue
    ? Math.min(100, Math.max(0, ((optimalValue - min) / (max - min)) * 100))
    : null;

  // Calcola l'angolo di rotazione dell'ago (da -45° a +45°)
  const needleAngle = -45 + (percentage / 100) * 90;

  // Determina il colore in base alla percentuale
  const getColorClass = () => {
    if (optimalPercentage !== null) {
      const deviation = Math.abs(percentage - optimalPercentage);
      if (deviation <= 10) return "text-green-500"; // vicino all'ottimale
      if (deviation <= 20) return "text-yellow-500"; // scarto moderato
    }
    if (percentage < 30) return "text-blue-500"; // leggero
    if (percentage < 70) return "text-green-500"; // normale
    return "text-red-500"; // pesante
  };

  // Determina il colore delle visualizzazioni in base alla percentuale
  const getFillColor = () => {
    if (optimalPercentage !== null) {
      const deviation = Math.abs(percentage - optimalPercentage);
      if (deviation <= 10) return "#22c55e"; // green-500
      if (deviation <= 20) return "#facc15"; // yellow-500
    }
    if (percentage < 30) return "#3b82f6"; // blue-500
    if (percentage < 70) return "#22c55e"; // green-500
    return "#ef4444"; // red-500
  };

  const colorClass = getColorClass();
  const fillColor = getFillColor();

  return (
    <div
      className={cn(
        "relative flex flex-wrap items-center justify-center gap-2 sm:flex-nowrap",
        className,
      )}
      style={{ width: size }}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Icona di stato */}
        <div className="flex h-5 items-center justify-center">
          {percentage < 30 && (
            <Scale className="h-5 w-5 animate-pulse text-blue-500" />
          )}
          {percentage >= 30 &&
            percentage < 70 &&
            optimalPercentage !== null &&
            Math.abs(percentage - optimalPercentage) <= 10 && (
              <Check className="h-5 w-5 animate-pulse text-green-500" />
            )}
          {percentage >= 70 && (
            <AlertTriangle className="h-5 w-5 animate-pulse text-red-500" />
          )}
        </div>

        {/* Visualizzatore bilancia con ago */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" className="absolute inset-0">
            <defs>
              <linearGradient id="scale-gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fillColor} stopOpacity="0.2" />
                <stop offset="100%" stopColor={fillColor} stopOpacity="0.6" />
              </linearGradient>
            </defs>

            {/* Arco della scala */}
            <path
              d="M 4 16 A 8 8 0 0 1 20 16"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Tacche della scala */}
            {[0, 25, 50, 75, 100].map((tick) => {
              const angle = 180 + (tick / 100) * 180; // Da 180° (sinistra) a 360° (destra)
              const rad = (angle * Math.PI) / 180;
              const centerX = 12;
              const centerY = 16;
              const x1 = centerX + Math.cos(rad) * 7;
              const y1 = centerY + Math.sin(rad) * 7;
              const x2 = centerX + Math.cos(rad) * 8;
              const y2 = centerY + Math.sin(rad) * 8;
              return (
                <line
                  key={tick}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#9ca3af"
                  strokeWidth="0.5"
                />
              );
            })}

            {/* Ago della bilancia */}
            <g
              transform={`rotate(${needleAngle}, 12, 16)`}
              className="transition-transform duration-500 ease-out"
            >
              <line
                x1="12"
                y1="16"
                x2="12"
                y2="9"
                stroke={fillColor}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="12" cy="16" r="1.5" fill={fillColor} />
            </g>
          </svg>

          {/* Icona della bilancia */}
          <Scale
            size={size}
            strokeWidth={2}
            className={cn(
              "absolute inset-0 transition-colors duration-300",
              colorClass,
            )}
            style={{ opacity: 0.15 }}
          />
        </div>
      </div>

      {/* Label con valore e range */}
      {showLabel && (
        <div className="flex flex-col items-center gap-1 text-center">
          <div className={cn("text-xl font-bold tabular-nums", colorClass)}>
            {value.toFixed(1)}
            <span className="ml-0.5 text-sm">kg</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {min} - {max} kg
          </div>
        </div>
      )}
    </div>
  );
}
