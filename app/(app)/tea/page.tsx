"use client";
import TopBar from "@/components/TopBar";
import TeaFeed from "@/components/Feed";
import { useApp } from "@/components/AppContext";

export default function TeaPage() {
  const { me } = useApp();
  return (
    <main className="page">
      <TopBar />
      <h1 className="title">The daily <em>tea</em></h1>
      <p className="muted" style={{ fontWeight: 500, margin: "8px 0 20px" }}>Updates, photos, petites victoires et gros craquages. Entre nous.</p>
      <TeaFeed meId={me.id} />
    </main>
  );
}
