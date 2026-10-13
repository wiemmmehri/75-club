/**
 * Comptes créés automatiquement au tout premier lancement (base vide).
 * ✏️ Change les mots de passe AVANT le premier lancement en prod.
 * Ensuite l'admin peut tout modifier depuis son espace.
 */
export const SEED_ACCOUNTS = [
  { email: "admin@75club.app", password: "Boss75!", name: "La Boss", emoji: "👑", role: "admin" as const,
    nickname: "The Founder", signature: "Je vois tout. Je sais tout.", color: "#2A0B1C" },
  { email: "hajer@75club.app", password: "Hajer-75", name: "Hajer", emoji: "🎀", role: "user" as const,
    nickname: "The Dream Girl", signature: "Her era starts now.", color: "#FF4F9A" },
  { email: "wiem@75club.app", password: "Wiem-75", name: "Wiem", emoji: "🍒", role: "user" as const,
    nickname: "The Plot Twist", signature: "Watch her work.", color: "#D9134F" },
  { email: "roua@75club.app", password: "Roua-75", name: "Roua", emoji: "🦋", role: "user" as const,
    nickname: "The Wild Card", signature: "Unexpectedly iconic.", color: "#8B6CFF" },
  { email: "amani@75club.app", password: "Amani-75", name: "Amani", emoji: "✨", role: "user" as const,
    nickname: "The Golden Girl", signature: "Quietly becoming her.", color: "#E0A030" },
];
