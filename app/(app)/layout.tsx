"use client";
import { AppProvider } from "@/components/AppContext";
import TabBar from "@/components/TabBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}<TabBar /></AppProvider>;
}
