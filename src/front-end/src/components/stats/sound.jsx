import { cn } from "@/lib/utils";
import { AlertTriangle, Check, Volume2 } from "lucide-react";

export function SoundGraph({
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

  // Genera punti dell'onda sinusoidale basati sul valore
  const generateWavePoints = () => {
    const points = [];
    const amplitude = (percentage / 100) * 8; // Ampiezza basata sul valore
    const frequency = 3; // Numero di onde
    const baselineY = 12; // Linea centrale

    for (let x = 0; x <= 24; x += 0.5) {
      const y =
        baselineY - amplitude * Math.sin((x / 24) * frequency * Math.PI * 2);
      points.push(`${x},${y}`);
    }
    return points.join(" ");
  };

  // Determina il colore in base alla percentuale
  const getColorClass = () => {
    if (optimalPercentage !== null) {
      const deviation = Math.abs(percentage - optimalPercentage);
      if (deviation <= 10) return "text-green-500"; // vicino all'ottimale
      if (deviation <= 20) return "text-yellow-500"; // scarto moderato
    }
    if (percentage < 30) return "text-blue-500"; // silenzioso
    if (percentage < 70) return "text-yellow-500"; // normale
    return "text-red-500"; // troppo rumoroso
  };

  // Determina il colore dell'onda in base alla percentuale
  const getWaveColor = () => {
    if (optimalPercentage !== null) {
      const deviation = Math.abs(percentage - optimalPercentage);
      if (deviation <= 10) return "#22c55e"; // green-500
      if (deviation <= 20) return "#facc15"; // yellow-500
    }
    if (percentage < 30) return "#3b82f6"; // blue-500
    if (percentage < 70) return "#facc15"; // yellow-500
    return "#ef4444"; // red-500
  };

  const colorClass = getColorClass();
  const waveColor = getWaveColor();
  const wavePoints = generateWavePoints();

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
            <Volume2 className="h-5 w-5 animate-pulse text-blue-500" />
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

        {/* Visualizzatore onda sonora */}
        <div className="relative" style={{ width: size, height: size }}>
          <svg viewBox="0 0 24 24" className="absolute inset-0">
            <defs>
              <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={waveColor} stopOpacity="0.3" />
                <stop offset="50%" stopColor={waveColor} stopOpacity="1" />
                <stop offset="100%" stopColor={waveColor} stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* Linea di base */}
            <line
              x1="0"
              y1="12"
              x2="24"
              y2="12"
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />

            {/* Onda sinusoidale */}
            <polyline
              points={wavePoints}
              fill="none"
              stroke="url(#wave-gradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-500 ease-out"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Icona del volume */}
          <Volume2
            size={size}
            strokeWidth={1.5}
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
            <span className="ml-0.5 text-sm">dB</span>
          </div>
          <div className="text-muted-foreground text-xs">
            {min} - {max} dB
          </div>
        </div>
      )}
    </div>
  );
}
