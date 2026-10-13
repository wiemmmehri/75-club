"use client";
import { AppProvider } from "@/components/AppContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AppProvider allowAdmin allowUnboarded>{children}</AppProvider>;
}
