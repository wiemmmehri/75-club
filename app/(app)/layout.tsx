"use client";
import { AppProvider } from "@/components/AppContext";
import TabBar from "@/components/TabBar";
import WheelGate from "@/components/WheelGate";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppProvider>{children}<TabBar /><WheelGate /></AppProvider>;
}
