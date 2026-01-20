import { cn } from "@/lib/utils";
import { AlertTriangle, Check, Droplet, Wind } from "lucide-react";

export function HumidityGraph({
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
  const fillHeight = (percentage / 100) * 24;

  // Determina il colore in base alla percentuale
  const getColorClass = () => {
    if (optimalPercentage !== null) {
      const deviation = Math.abs(percentage - optimalPercentage);
      if (deviation <= 10) return "text-blue-500"; // vicino all'ottimale
      if (deviation <= 20) return "text-cyan-500"; // scarto moderato
    }
    if (percentage < 30) return "text-orange-500"; // troppo secco
    if (percentage < 70) return "text-blue-500"; // ottimale
    return "text-red-500"; // troppo umido
  };

  // Determina il colore del riempimento in base alla percentuale
  const getFillColor = () => {
    if (optimalPercentage !== null) {
      const deviation = Math.abs(percentage - optimalPercentage);
      if (deviation <= 10) return "#3b82f6"; // blue-500 - vicino all'ottimale
      if (deviation <= 20) return "#06b6d4"; // cyan-500 - scarto moderato
    }
    if (percentage < 30) return "#f97316"; // orange-500 - troppo secco
    if (percentage < 70) return "#3b82f6"; // blue-500 - ottimale
    return "#ef4444"; // red-500 - troppo umido
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
            <AlertTriangle className="h-5 w-5 animate-pulse text-orange-500" />
          )}
          {percentage >= 30 && percentage < 70 && (
            <Wind className="h-5 w-5 animate-pulse text-blue-500" />
          )}
          {percentage >= 30 &&
            percentage < 70 &&
            optimalPercentage !== null &&
            Math.abs(percentage - optimalPercentage) <= 10 && (
              <Check className="h-5 w-5 animate-pulse text-blue-500" />
            )}
          {percentage >= 70 && (
            <AlertTriangle className="h-5 w-5 animate-pulse text-red-500" />
          )}
        </div>

        {/* Contenitore umidità con gocce */}
        <div className="relative" style={{ width: size, height: size }}>
          {/* Riempimento con colore dinamico */}
          <svg viewBox="0 0 24 24" className="absolute inset-0">
            <defs>
              <clipPath id="droplet-clip">
                <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
              </clipPath>

              <linearGradient
                id={`humidity-gradient-${percentage}`}
                x1="0"
                y1="1"
                x2="0"
                y2="0"
              >
                <stop offset="0%" stopColor={fillColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor={fillColor} stopOpacity="1" />
              </linearGradient>
            </defs>

            <rect
              x="0"
              y={24 - fillHeight}
              width="24"
              height={fillHeight}
              fill={`url(#humidity-gradient-${percentage})`}
              clipPath="url(#droplet-clip)"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Icona della goccia d'acqua */}
          <Droplet
            size={size}
            strokeWidth={2}
            className={cn(
              "absolute inset-0 transition-colors duration-300",
              colorClass,
            )}
          />
        </div>
      </div>

      {/* Label con valore e range */}
      {showLabel && (
        <div className="flex flex-col items-center gap-1 text-center">
          <div className={cn("text-xl font-bold tabular-nums", colorClass)}>
            {value.toFixed(1)}
            <span className="ml-0.5 text-sm">%</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {min} - {max}%
          </div>
        </div>
      )}
    </div>
  );
}
