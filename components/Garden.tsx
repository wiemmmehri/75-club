"use client";
import MiniHeart, { partsOf } from "./MiniHeart";
import { addDays } from "@/lib/dates";

/** 75 hearts, one per day. Each slice lights up with a goal. */
export default function Garden({ start, today, byDate, goals, onPick }: {
  start: string; today: string; byDate: Record<string, number[]>; goals: { id: number; color: string }[]; onPick?: (date: string, n: number) => void;
}) {
  return (
    <div className="garden">
      {Array.from({ length: 75 }).map((_, i) => {
        const d = addDays(start, i);
        const future = d > today;
        return (
          <button key={d} disabled={future || !onPick} onClick={() => onPick?.(d, i + 1)} aria-label={`Jour ${i + 1}`}
            style={d === today ? { color: "var(--cherry)" } : undefined}>
            <MiniHeart parts={partsOf(goals, byDate[d])} size={34} dim={future} />
            <span>{d === today ? "auj." : i + 1}</span>
          </button>
        );
      })}
    </div>
  );
}
