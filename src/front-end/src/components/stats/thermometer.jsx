import { cn } from "@/lib/utils";
import { Check, Snowflake, Sun, Thermometer } from "lucide-react";

const unitSymbols = {
  celsius: "\u00B0C",
  fahrenheit: "\u00B0F",
  kelvin: "K",
};

export function ThermometerGraph({
  value = 0,
  optimalValue,
  min = 0,
  max = 100,
  unit = "celsius",
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
      if (deviation <= 10) return "text-green-500"; // vicino all'ottimale
      if (deviation <= 20) return "text-yellow-500"; // scarto moderato
    }
    if (percentage < 30) return "text-blue-500";
    if (percentage < 70) return "text-yellow-500";
    return "text-red-500";
  };

  // Determina il colore del riempimento in base alla percentuale
  const getFillColor = () => {
    if (optimalPercentage !== null) {
      const deviation = Math.abs(percentage - optimalPercentage);
      if (deviation <= 10) return "#22c55e"; // green-500 - vicino all'ottimale
      if (deviation <= 20) return "#facc15"; // yellow-500 - scarto moderato
    }
    if (percentage < 30) return "#3b82f6"; // blue-500
    if (percentage < 70) return "#facc15"; // yellow-500
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
            <Snowflake className="h-5 w-5 animate-pulse text-blue-500" />
          )}
          {percentage >= 30 &&
            percentage < 70 &&
            optimalPercentage !== null &&
            Math.abs(percentage - optimalPercentage) <= 10 && (
              <Check className="h-5 w-5 animate-pulse text-green-500" />
            )}
          {percentage >= 70 && (
            <Sun className="h-5 w-5 animate-pulse text-red-500" />
          )}
        </div>

        {/* Termometro */}
        <div className="relative" style={{ width: size, height: size }}>
          {/* Riempimento con colore dinamico */}
          <svg viewBox="0 0 24 24" className="absolute inset-0">
            <defs>
              <clipPath id="thermo-clip">
                <path d="M14 14.76V3.5a2 2 0 0 0-4 0v11.26a4 4 0 1 0 4 0Z" />
              </clipPath>

              <linearGradient
                id={`thermo-gradient-${percentage}`}
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
              fill={`url(#thermo-gradient-${percentage})`}
              clipPath="url(#thermo-clip)"
              className="transition-all duration-500 ease-out"
            />
          </svg>

          {/* Corpo del termometro */}
          <Thermometer
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
            <span className="ml-0.5 text-sm">{unitSymbols[unit]}</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {min} - {max} {unitSymbols[unit]}
          </div>
        </div>
      )}
    </div>
  );
}
