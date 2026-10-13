"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

export type Me = {
  id: number; email: string; name: string; emoji: string; role: "admin" | "user";
  nickname: string | null; signature: string | null; era: string | null; color: string; avatarV: number;
  motivation: string | null; onboarded: number;
};
export type Goal = { id: number; category: string; title: string; emoji: string; color: string };
type Ctx = { me: Me; goals: Goal[]; start: string; refresh: () => Promise<void> };

const AppCtx = createContext<Ctx | null>(null);
export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp hors du provider");
  return c;
}

export function AppProvider({ children, allowAdmin = false, allowUnboarded = false }: { children: ReactNode; allowAdmin?: boolean; allowUnboarded?: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<{ user: Me; goals: Goal[]; start: string } | null>(null);
  const refresh = useCallback(async () => setData(await api("/api/me")), []);
  useEffect(() => { refresh().catch(() => router.replace("/login")); }, [refresh, router]);
  useEffect(() => {
    if (!data) return;
    if (data.user.role === "admin" && !allowAdmin) router.replace("/admin");
    else if (data.user.role === "user" && !data.user.onboarded && !allowUnboarded) router.replace("/onboarding");
  }, [data, allowAdmin, allowUnboarded, router]);
  if (!data) return <Loader />;
  return <AppCtx.Provider value={{ me: data.user, goals: data.goals, start: data.start, refresh }}>{children}</AppCtx.Provider>;
}

export function Loader() {
  return (
    <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center" }}>
      <div style={{ fontSize: 40, animation: "beat 1s ease-in-out infinite" }}>💗</div>
      <style>{`@keyframes beat{50%{transform:scale(1.25)}}`}</style>
    </div>
  );
}
