"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { Trophy, X } from "lucide-react";
import type { AchievementResult } from "@/lib/achievements";
import { TIER_STYLES } from "@/lib/achievements";

// ── Confetti ────────────────────────────────────────────────
const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#96CEB4", "#FFEAA7", "#DDA0DD", "#F8B500",
  "#FF85A1", "#A8E6CF", "#FFB347",
];

function Confetti() {
  // Generujemy raz przy renderze (useRef żeby nie re-renderować)
  const pieces = useRef(
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 2.5,
      duration: 2.5 + Math.random() * 3,
      size: 5 + Math.random() * 9,
      isRect: i % 3 !== 0,
      swayAmp: 15 + Math.random() * 25,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none z-9996 overflow-hidden">
      <style>{`
        @keyframes ach-fall {
          0%   { transform: translateY(-40px) rotateZ(0deg) rotateX(0deg); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(105vh) rotateZ(600deg) rotateX(360deg); opacity: 0; }
        }
        @keyframes ach-sway {
          0%, 100% { margin-left: 0; }
          33%       { margin-left: var(--sway); }
          66%       { margin-left: calc(var(--sway) * -0.7); }
        }
      `}</style>
      {pieces.current.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: 0,
            width: p.isRect ? `${p.size}px` : `${p.size * 0.65}px`,
            height: p.isRect ? `${p.size * 0.45}px` : `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.isRect ? "2px" : "50%",
            "--sway": `${p.swayAmp}px`,
            animation: `ach-fall ${p.duration}s ease-in ${p.delay}s both, ach-sway ${p.duration * 0.7}s ease-in-out ${p.delay}s infinite`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

// ── Popup ───────────────────────────────────────────────────
interface PopupData {
  achievement: AchievementResult;
  newLevel: 1 | 2 | 3 | 4;
}

const AUTO_DISMISS_MS = 6500;

function AchievementPopup({
  data,
  onClose,
}: {
  data: PopupData;
  onClose: () => void;
}) {
  const { achievement, newLevel } = data;
  const style = TIER_STYLES[newLevel];
  const tier = achievement.tiers.find((t) => t.level === newLevel)!;

  useEffect(() => {
    const t = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <>
      <Confetti />
      <div className="fixed bottom-6 right-6 z-9997 w-80 animate-in slide-in-from-bottom-5 fade-in duration-500">
        <style>{`
          @keyframes ach-timer {
            from { width: 100%; }
            to   { width: 0%; }
          }
        `}</style>
        <div
          className={`rounded-2xl overflow-hidden bg-white dark:bg-zinc-950 border-2 shadow-2xl ${style.ring}`}
        >
          {/* Pasek koloru tiera */}
          <div className={`h-1.5 w-full bg-linear-to-r ${style.gradient}`} />

          <div className="p-4">
            <div className="flex items-start gap-3">
              {/* Ikona */}
              <div
                className={`w-13 h-13 rounded-full flex items-center justify-center text-2xl shrink-0 bg-linear-to-br ${style.gradient} shadow-lg`}
                style={{ width: 52, height: 52 }}
              >
                {achievement.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-0.5">
                  <Trophy className="w-3 h-3 text-yellow-500" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    Osiągnięcie Odblokowane!
                  </span>
                </div>
                <p className="font-black text-zinc-900 dark:text-white text-sm leading-tight">
                  {achievement.name}
                </p>
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5 ${style.badge}`}
                >
                  {tier.emoji} {style.label}
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                  {tier.description}
                </p>
              </div>

              <button
                onClick={onClose}
                className="text-zinc-300 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors shrink-0 mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Auto-close timer bar */}
          <div className="h-1 bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full bg-linear-to-r ${style.gradient}`}
              style={{ animation: `ach-timer ${AUTO_DISMISS_MS}ms linear forwards` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Context ─────────────────────────────────────────────────
interface AchievementsCtx {
  triggerCheck: () => void;
}

const Ctx = createContext<AchievementsCtx>({ triggerCheck: () => {} });
export const useAchievements = () => useContext(Ctx);

// ── Provider ─────────────────────────────────────────────────
const STORAGE_KEY = "seenAchievementTiers_v2";
const POLL_INTERVAL_MS = 60_000;

export function AchievementsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const statusRef = useRef(status);
  statusRef.current = status;

  const [queue, setQueue] = useState<PopupData[]>([]);
  const [current, setCurrent] = useState<PopupData | null>(null);

  // Wyświetl następny z kolejki gdy current się zamknie
  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((prev) => prev.slice(1));
    }
  }, [current, queue]);

  const handleClose = useCallback(() => setCurrent(null), []);

  // ── Główna funkcja sprawdzania osiągnięć ──────────────────
  const check = useCallback(async () => {
    if (statusRef.current !== "authenticated") return;
    try {
      const res = await fetch("/api/achievements");
      if (!res.ok) return;
      const achievements: AchievementResult[] = await res.json();

      const storedStr = localStorage.getItem(STORAGE_KEY);
      const seen: Record<string, number> = storedStr ? JSON.parse(storedStr) : {};
      const isFirstLoad = !storedStr;

      const newNotifications: PopupData[] = [];

      for (const ach of achievements) {
        const seenLevel = seen[ach.id] ?? 0;

        // Przy pierwszym uruchomieniu – tylko zainicjalizuj baseline, bez powiadomień
        if (!isFirstLoad && ach.unlockedTier > seenLevel && ach.isPrerequisiteMet) {
          for (let lvl = seenLevel + 1; lvl <= ach.unlockedTier; lvl++) {
            newNotifications.push({ achievement: ach, newLevel: lvl as 1 | 2 | 3 | 4 });
          }
        }

        seen[ach.id] = ach.unlockedTier;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));

      if (newNotifications.length > 0) {
        setQueue((prev) => [...prev, ...newNotifications]);
      }
    } catch {
      // Ciche pominięcie błędów sieciowych
    }
  }, []);

  // Inicjalne wywołanie gdy session jest gotowa
  useEffect(() => {
    if (status === "authenticated") {
      check();
    }
  }, [status, check]);

  // Polling co minutę
  useEffect(() => {
    if (status !== "authenticated") return;
    const interval = setInterval(check, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [status, check]);

  // Nasłuchiwanie na custom event ze stron
  useEffect(() => {
    const handler = () => check();
    window.addEventListener("achievementCheck", handler);
    return () => window.removeEventListener("achievementCheck", handler);
  }, [check]);

  return (
    <Ctx.Provider value={{ triggerCheck: check }}>
      {children}
      {current && <AchievementPopup data={current} onClose={handleClose} />}
    </Ctx.Provider>
  );
}
