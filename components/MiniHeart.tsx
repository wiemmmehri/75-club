type Part = { color: string; on: boolean };

const HEART = "M16 29C6 21 1 15.5 1 9.5 1 5 4.5 1.5 8.8 1.5c3 0 5.4 1.6 7.2 4.2 1.8-2.6 4.2-4.2 7.2-4.2 4.3 0 7.8 3.5 7.8 8 0 6-5 11.5-15 19.5Z";

function slice(i: number, n: number) {
  if (n === 1) return "M-10 -10H42V42H-10Z";
  const cx = 16, cy = 15, r = 40;
  const a0 = -Math.PI / 2 + (i / n) * Math.PI * 2;
  const a1 = -Math.PI / 2 + ((i + 1) / n) * Math.PI * 2;
  const p = (a: number) => `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
  return `M${cx} ${cy}L${p(a0)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${p(a1)}Z`;
}

/** Flat heart split in one slice per goal (1 to 6). Used in calendars & cards. */
export default function MiniHeart({ parts, size = 34, dim = false }: { parts: Part[]; size?: number; dim?: boolean }) {
  const done = parts.filter((p) => p.on).length;
  const full = parts.length > 0 && done === parts.length;
  return (
    <svg width={size} height={size} viewBox="0 0 32 30" style={{ opacity: dim ? 0.35 : 1 }} aria-label={`${done}/${parts.length}`}>
      <defs><clipPath id="mh-clip"><path d={HEART} /></clipPath></defs>
      <g clipPath="url(#mh-clip)">
        <rect width="32" height="30" fill="#fff" />
        {parts.map((p, i) => p.on && <path key={i} d={slice(i, parts.length)} fill={p.color} />)}
      </g>
      <path d={HEART} fill="none" stroke={full ? "#d9134f" : "rgba(42,11,28,.25)"} strokeWidth={full ? 1.6 : 1.1} />
    </svg>
  );
}

/** Helper: goals + checked ids → slices */
export const partsOf = (goals: { id: number; color: string }[], done: number[] = []) =>
  goals.map((g) => ({ color: g.color, on: done.includes(g.id) }));
