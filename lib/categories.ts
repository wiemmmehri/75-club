export type CatKey = "sport" | "diet" | "quran" | "selfcare";
export type GoalCat = CatKey | "custom";

export type Category = {
  key: CatKey;
  label: string;
  short: string;
  emoji: string;
  color: string;
  soft: string;
  placeholder: string;
  cheers: string[];
};

export const CATEGORIES: Category[] = [
  {
    key: "sport", label: "Sport", short: "Sport", emoji: "🏋️‍♀️", color: "#FF3D7F", soft: "#FFD3E2",
    placeholder: "Ex : 45 min de sport, 10 000 pas…",
    cheers: ["Cardio validé, ton cœur te dit merci 💓", "Tu transpires des paillettes ✨", "Ton canapé est jaloux. Tant pis 🛋️", "Leg day survived. Barely. 🦵", "Beyoncé n'a qu'à bien se tenir 💃"],
  },
  {
    key: "diet", label: "Alimentation", short: "Food", emoji: "🥗", color: "#20B486", soft: "#C9F2E2",
    placeholder: "Ex : pas de sucre, 2L d'eau, pas de fast-food…",
    cheers: ["Légumes 1, tentations 0 🥦", "La pizza pleure en silence 🍕😢", "Ton corps t'envoie un bisou 😘", "Healthy et canon, rien à ajouter 💚", "Le chocolat a perdu, la reine a gagné 👑"],
  },
  {
    key: "quran", label: "Coran", short: "Coran", emoji: "📖", color: "#8B6CFF", soft: "#E3DAFF",
    placeholder: "Ex : 2 pages par jour, apprendre une sourate…",
    cheers: ["Qu'Allah te récompense 🤍", "Ton âme vient de faire un spa 🌙", "Lumière dans le cœur ✨", "Pages lues, cœur apaisé 🤲", "Barak Allahou fiki 🌷"],
  },
  {
    key: "selfcare", label: "Self-care & dev perso", short: "Self-care", emoji: "🎀", color: "#FF9A3D", soft: "#FFE2C9",
    placeholder: "Ex : skincare, 10 pages de lecture, journaling…",
    cheers: ["Main character energy 💅", "Glow-up en cours… 87%", "Reine. Point. Fin du débat. 👑", "Tu prends soin de toi, c'est sacré 🕯️", "Ton futur toi te fait un câlin 🫶"],
  },
];

export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<CatKey, Category>;
export const CAT_KEYS = CATEGORIES.map((c) => c.key);

export const MAX_GOALS = 6;

/** Personal goals: pick an emoji, we pick a pretty color. */
export const CUSTOM_EMOJIS = ["💧", "📚", "🧘‍♀️", "🚶‍♀️", "😴", "📵", "✍️", "🎨", "💰", "🌿", "☀️", "💌", "🧴", "🎧", "🤲", "🍵"];
export const CUSTOM_COLORS = ["#4FA8FF", "#B05CFF", "#00B8A9", "#FF6FB5", "#E0A030", "#FF8A5B"];

/** What we say when she skips a base category. Funny, never mean. */
export const SKIP_LINES: Record<CatKey, string> = {
  sport: "Pas de sport ? Ton canapé a déjà dit oui 🛋️",
  diet: "Pas d'objectif food ? La pizza te remercie personnellement 🍕",
  quran: "Le Coran attend sur l'étagère, sans rancune. Tu l'ajoutes quand tu veux 🤍",
  selfcare: "Pas de self-care ? Ta skincare fait une dépression silencieuse 🧴😢",
};
export const ZERO_GOALS = "Zéro objectif ? Même un cactus a plus d'ambition 🌵 Choisis-en au moins un.";
export const MAX_REACHED = "6 objectifs, c'est le max. On veut un glow-up, pas un burn-out 😮‍💨";
export const SKIP_CONFIRM = [
  "Tu es sûre ? Vraiment vraiment ? 🥺",
  "Ok on respecte… mais on juge un tout petit peu 👀",
  "Supprimé. Le club fera semblant de ne pas avoir vu 🙈",
];

export const MOODS = [
  { key: "ko", emoji: "😵‍💫", label: "KO" },
  { key: "meh", emoji: "🫠", label: "Bof" },
  { key: "ok", emoji: "🙂", label: "Ça va" },
  { key: "good", emoji: "🥰", label: "Bien" },
  { key: "fire", emoji: "🔥", label: "En feu" },
];

export const REACTIONS = ["💗", "🔥", "👑", "😭", "🫶"];

export const EMOJIS = ["🎀", "🍒", "🦋", "✨", "🌷", "🍓", "🌙", "💎", "🐚", "🦢", "🍑", "🪷", "👑", "🐰", "🧚‍♀️", "💌"];

export const EPISODES = [
  "The Delulu Beginning", "Reality Hits", "No More Excuses", "The Comeback", "Main Character Energy",
  "Soft Life, Hard Work", "Glow In Progress", "Unbothered Era", "That Girl Arc", "Almost Her", "The Girls We Became",
];

export const DAILY_LINES = [
  "Babe, ton futur toi te regarde 👀",
  "Pas de motivation ? Pas grave. Discipline, chérie.",
  "Cute face. Serious goals.",
  "On ne souhaite pas. On devient.",
  "Aujourd'hui, on fait comme si on était déjà elle.",
  "Petit rappel : tu n'as pas fait tout ça pour abandonner au jour 12.",
  "Hydrate-toi, prie, bouge, brille. Dans cet ordre ou pas.",
  "Le club compte sur toi (et il te surveille un peu aussi).",
];

/** How a punishment gets proved in the Tea. */
export type ProofKind = "none" | "photo" | "voice";

/** The Punishment Wheel 🎡 — each one is on the wheel twice (8 slices). */
const PUNISHMENTS = [
  { key: "free", label: "FREE PASS", emoji: "✨", color: "#FFF1C7", proof: "none" as ProofKind, hint: "La chance de ta vie. Profite, ça n'arrivera pas deux fois (si, peut-être)." },
  { key: "sadaqa", label: "5 DT de sadaqa", emoji: "🤲", color: "#C9F2E2", proof: "photo" as ProofKind, hint: "Donne 5 DT à quelqu'un qui en a besoin. Une photo (sans visage) ou un petit mot comme preuve." },
  { key: "walk", label: "+30 min de marche", emoji: "🚶‍♀️", color: "#E3DAFF", proof: "photo" as ProofKind, hint: "30 minutes en plus de ton sport. Screenshot de ton appli de pas ou une photo de la balade." },
  { key: "insult", label: "Insulte-toi 20 s en vocal", emoji: "🎙️", color: "#FFD3E2", proof: "voice" as ProofKind, hint: "20 secondes à te remonter les bretelles, en vocal, pour tout le club. Sois créative 😈" },
];
export const WHEEL = [...PUNISHMENTS, ...PUNISHMENTS];
export const punishmentOf = (label: string) => PUNISHMENTS.find((p) => label.includes(p.label)) || null;

export const MILESTONES: Record<number, { title: string; text: string }> = {
  7: { title: "Une semaine.", text: "7 jours de discipline. L'épisode pilote est validé, la série est renouvelée." },
  15: { title: "Jour 15.", text: "Tu as dépassé le moment où tout le monde abandonne. Pas toi." },
  30: { title: "Un mois.", text: "30 jours. Ce n'est plus un challenge, c'est ta personnalité maintenant." },
  50: { title: "Jour 50.", text: "Les deux tiers. Elle est là, elle arrive, on la sent." },
  75: { title: "75/75.", text: "Who we were vs who we became. Le club est fier de toi." },
};

export const CHALLENGE_DAYS = 75;
