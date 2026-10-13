"use client";
import { Camera } from "lucide-react";
import Avatar from "./Avatar";
import PhotoUpload from "./PhotoUpload";
import { EMOJIS } from "@/lib/categories";

export const COLORS = ["#FF4F9A", "#D9134F", "#8B6CFF", "#E0A030", "#20B486", "#FF8A5B", "#4FA8FF", "#B05CFF"];

export type ProfileDraft = { name: string; emoji: string; nickname: string; signature: string; era: string; color: string };

export default function ProfileFields({ me, v, set, onAvatar }: {
  me: { id: number; name: string; emoji: string; color: string; avatarV: number }; v: ProfileDraft; set: (v: ProfileDraft) => void; onAvatar: () => void;
}) {
  return (
    <div className="stack" style={{ gap: 16 }}>
      <div className="row" style={{ gap: 16 }}>
        <Avatar u={{ ...me, emoji: v.emoji, color: v.color }} size={86} />
        <div className="stack" style={{ gap: 8, flex: 1 }}>
          <PhotoUpload kind="avatar" date="" className="btn sm" label={<><Camera size={15} /> Ma photo</>} onDone={onAvatar} />
          <span className="tiny soft">Visible par les girls sur ta carte et tes posts.</span>
        </div>
      </div>
      <div>
        <span className="label">Mon emoji</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
          {EMOJIS.map((e) => (
            <button key={e} type="button" onClick={() => set({ ...v, emoji: e })} aria-label={e}
              style={{ fontSize: 22, padding: "6px 0", border: 0, borderRadius: 14, background: e === v.emoji ? "#fff" : "transparent", boxShadow: e === v.emoji ? "0 0 0 2px var(--hot)" : "none" }}>{e}</button>
          ))}
        </div>
      </div>
      <div>
        <span className="label">Ma couleur</span>
        <div className="row" style={{ gap: 10 }}>
          {COLORS.map((c) => (
            <button key={c} type="button" aria-label={c} onClick={() => set({ ...v, color: c })}
              style={{ width: 32, height: 32, borderRadius: "50%", border: 0, background: c, boxShadow: c === v.color ? `0 0 0 3px #fff, 0 0 0 5px ${c}` : "none" }} />
          ))}
        </div>
      </div>
      <div><label className="label" htmlFor="pn">Prénom</label><input id="pn" className="input" value={v.name} maxLength={30} onChange={(e) => set({ ...v, name: e.target.value })} /></div>
      <div><label className="label" htmlFor="nk">Mon surnom de club</label><input id="nk" className="input" value={v.nickname} maxLength={40} placeholder="The Dream Girl" onChange={(e) => set({ ...v, nickname: e.target.value })} /></div>
      <div><label className="label" htmlFor="sg">Ma signature</label><input id="sg" className="input" value={v.signature} maxLength={80} placeholder="Her era starts now." onChange={(e) => set({ ...v, signature: e.target.value })} /></div>
      <div><label className="label" htmlFor="er">Mon era du moment</label><input id="er" className="input" value={v.era} maxLength={60} placeholder="Soft life, hard work" onChange={(e) => set({ ...v, era: e.target.value })} /></div>
    </div>
  );
}
