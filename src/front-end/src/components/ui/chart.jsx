import React from "react";
import { cn } from "@/lib/utils";

export function ChartContainer({ className, children }) {
  return <div className={cn("w-full h-full", className)}>{children}</div>;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
}) {
  if (!active || !payload || payload.length === 0) return null;

  const p = payload[0];
  const value = p?.value;
  const name = p?.name || "";

  const [formattedValue, formattedName] = formatter
    ? [].concat(formatter(value, name))
    : [value, name];

  const finalLabel = labelFormatter ? labelFormatter(label) : label;

  return (
    <div className="rounded-md border border-black/10 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
      <div className="text-[11px] font-bold text-black/70">{finalLabel}</div>
      <div className="mt-1 flex items-baseline gap-2">
        {formattedName ? (
          <span className="text-[11px] font-semibold text-black/60">{formattedName}</span>
        ) : null}
        <span className="text-sm font-extrabold text-black/80">{formattedValue}</span>
      </div>
    </div>
  );
}
