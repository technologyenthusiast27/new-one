"use client";

import { useEffect, useState } from "react";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function compute(target: number): TimeLeft {
  const diff = Math.max(0, target - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff / 3600000) % 24),
    minutes: Math.floor((diff / 60000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Live countdown to `target` (an ISO timestamp, e.g. event.eventDate). */
export function Countdown({ target }: { target: string }) {
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const ts = new Date(target).getTime();
    setTime(compute(ts));
    const id = setInterval(() => setTime(compute(ts)), 1000);
    return () => clearInterval(id);
  }, [target]);

  const units: { label: string; value: number }[] = [
    { label: "Days", value: time?.days ?? 0 },
    { label: "Hours", value: time?.hours ?? 0 },
    { label: "Minutes", value: time?.minutes ?? 0 },
    { label: "Seconds", value: time?.seconds ?? 0 },
  ];

  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      {units.map((u, i) => (
        <div key={u.label} className="flex items-center gap-2.5 sm:gap-3">
          <div className="flex min-w-[3.75rem] flex-col items-center rounded-2xl glass px-3 py-2.5 sm:min-w-[4.5rem]">
            <span className="font-display text-2xl font-semibold tabular-nums text-white sm:text-3xl">
              {time ? pad(u.value) : "--"}
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-neutral-400">
              {u.label}
            </span>
          </div>
          {i < units.length - 1 && (
            <span className="text-lg text-violet-soft/50">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
