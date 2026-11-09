// Seasonal events that follow the real calendar: arena tint, enemy skin and a limited-time achievement.
// Tint colours are fixed event colours (identical in every UI style).
export interface Season { id: string; icon: string; name: string; desc: string; from: number; to: number; arena: string; enemy: string }

// from/to are month*100+day; ranges may wrap over New Year
export const SEASONS: Season[] = [
  { id: "lunar", icon: "🏮", name: "Lunar Festival", desc: "Red lanterns and golden foes", from: 121, to: 210, arena: "#FF3B30", enemy: "#FFD23F" },
  { id: "valentine", icon: "💘", name: "Heartbreakers", desc: "Pink skies and lovestruck raiders", from: 211, to: 216, arena: "#FF4FA3", enemy: "#FF7BC1" },
  { id: "spring", icon: "🌸", name: "Spring Bloom", desc: "Green skies and blooming foes", from: 320, to: 420, arena: "#5BE37D", enemy: "#9CFF6E" },
  { id: "summer", icon: "☀️", name: "Solar Summer", desc: "Heatwave skies and sun-baked foes", from: 701, to: 815, arena: "#FFB000", enemy: "#FFD84D" },
  { id: "halloween", icon: "🎃", name: "Spooky Space", desc: "Purple skies and pumpkin foes", from: 1015, to: 1102, arena: "#8A2BE2", enemy: "#FF7A00" },
  { id: "winter", icon: "❄️", name: "Frost Fleet", desc: "Icy skies and frozen foes", from: 1210, to: 106, arena: "#4FC3F7", enemy: "#BDEBFF" },
];

export const SEASON_GOAL = 1500; // kills during the event for its achievement

const md = (d: Date) => (d.getMonth() + 1) * 100 + d.getDate();
const inside = (s: Season, v: number) => (s.from <= s.to ? v >= s.from && v <= s.to : v >= s.from || v <= s.to);

let cache: { at: number; season: Season | null } = { at: 0, season: null };
export function activeSeason(d?: Date): Season | null {
  if (d) return SEASONS.find((s) => inside(s, md(d))) ?? null;
  const now = Date.now();
  if (now - cache.at > 60000) cache = { at: now, season: SEASONS.find((s) => inside(s, md(new Date(now)))) ?? null };
  return cache.season;
}

// Unique key per event per year (winter counts from its December start)
export function seasonKey(s: Season, d = new Date()) {
  const y = s.from > s.to && md(d) <= s.to ? d.getFullYear() - 1 : d.getFullYear();
  return `${s.id}${y}`;
}

const dateOf = (v: number, year: number) => new Date(year, Math.floor(v / 100) - 1, v % 100);

// Next event to start after today
export function nextSeason(d = new Date()): { season: Season; start: Date } {
  const v = md(d);
  const list = SEASONS.map((s) => ({ season: s, start: dateOf(s.from, s.from > v ? d.getFullYear() : d.getFullYear() + 1) }));
  list.sort((a, b) => +a.start - +b.start);
  return list[0];
}

export function seasonEnd(s: Season, d = new Date()) {
  return dateOf(s.to, s.from > s.to && md(d) >= s.from ? d.getFullYear() + 1 : d.getFullYear());
}
