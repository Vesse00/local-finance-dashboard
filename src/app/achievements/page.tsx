"use client";

import { useEffect, useState, useMemo } from "react";
import { Trophy, Lock, ChevronRight } from "lucide-react";
import { TIER_STYLES, type AchievementResult } from "@/lib/achievements";

// ── Karta pojedynczego osiągnięcia ───────────────────────────
function AchievementCard({ ach }: { ach: AchievementResult }) {
  const isComplete = ach.unlockedTier === 4;
  const currentTierStyle = ach.unlockedTier > 0 ? TIER_STYLES[ach.unlockedTier] : null;

  return (
    <div
      className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-300
        ${isComplete
          ? "bg-linear-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-purple-200 dark:border-purple-500/30 shadow-lg shadow-purple-500/10"
          : ach.unlockedTier > 0
            ? "bg-white/70 dark:bg-zinc-950/60 border-black/5 dark:border-white/10 shadow-sm"
            : "bg-white/40 dark:bg-zinc-950/30 border-black/5 dark:border-white/5"
        }
      `}
    >
      {/* Platyna – blask w tle */}
      {isComplete && (
        <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-purple-500/5 to-indigo-500/5 pointer-events-none" />
      )}

      {/* Nagłówek */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shrink-0 shadow-inner
            ${ach.unlockedTier > 0
              ? `bg-linear-to-br ${currentTierStyle!.gradient} shadow-md ${currentTierStyle!.glow}`
              : "bg-zinc-100 dark:bg-zinc-800"
            }
          `}
        >
          {ach.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-zinc-900 dark:text-white text-sm leading-tight">{ach.name}</h3>
            {ach.unlockedTier > 0 && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentTierStyle!.badge}`}>
                {currentTierStyle!.label}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">{ach.description}</p>
        </div>
        {ach.unlockedTier === 0 && (
          <Lock className="w-4 h-4 text-zinc-300 dark:text-zinc-600 shrink-0 mt-0.5" />
        )}
      </div>

      {/* 4 Tiery */}
      <div className="flex gap-1.5 mb-4">
        {ach.tiers.map((tier) => {
          const unlocked = ach.unlockedTier >= tier.level;
          const style = TIER_STYLES[tier.level];
          return (
            <div
              key={tier.level}
              className="flex-1 flex flex-col items-center gap-1"
              title={tier.description}
            >
              <div
                className={`w-full h-1.5 rounded-full transition-all duration-500
                  ${unlocked
                    ? `bg-linear-to-r ${style.gradient}`
                    : "bg-zinc-200 dark:bg-zinc-700"
                  }
                `}
              />
              <span
                className={`text-[10px] font-bold transition-colors
                  ${unlocked ? "text-zinc-700 dark:text-zinc-200" : "text-zinc-300 dark:text-zinc-600"}
                `}
              >
                {tier.emoji} {tier.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Pasek postępu do następnego tiera */}
      {ach.nextTier ? (
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium">
              {ach.formatValue
                ? ach.formatValue(ach.currentValue)
                : `${ach.currentValue} ${ach.unit}`}
            </span>
            <span className="text-zinc-400 dark:text-zinc-500">
              cel: {ach.formatValue
                ? ach.formatValue(ach.nextTier.threshold)
                : `${ach.nextTier.threshold} ${ach.unit}`}
            </span>
          </div>
          <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className={`h-full rounded-full bg-linear-to-r transition-all duration-700 ${TIER_STYLES[ach.nextTier.level].gradient}`}
              style={{ width: `${ach.progressToNext}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
            Następny: <span className="font-semibold text-zinc-600 dark:text-zinc-300">{ach.nextTier.description}</span>
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-[11px] font-bold text-purple-600 dark:text-purple-400">
          <Trophy className="w-3.5 h-3.5" />
          Wszystkie tiery odblokowane!
        </div>
      )}
    </div>
  );
}

// ── Sekcja kategorii ──────────────────────────────────────────
function CategorySection({
  categoryIcon,
  category,
  achievements,
}: {
  categoryIcon: string;
  category: string;
  achievements: AchievementResult[];
}) {
  const unlockedCount = achievements.filter((a) => a.unlockedTier > 0).length;
  const totalTiers = achievements.reduce((s, a) => s + a.tiers.length, 0);
  const unlockedTiers = achievements.reduce((s, a) => s + a.unlockedTier, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2.5 text-base font-bold text-zinc-800 dark:text-zinc-200">
          <span className="text-xl">{categoryIcon}</span>
          {category}
          <span className="text-xs font-normal text-zinc-400">
            ({unlockedCount}/{achievements.length} osiągnięć)
          </span>
        </h2>
        <div className="text-xs text-zinc-400 font-medium">
          {unlockedTiers}/{totalTiers} tierów
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {achievements.map((ach) => (
          <AchievementCard key={ach.id} ach={ach} />
        ))}
      </div>
    </section>
  );
}

// ── Główna strona ─────────────────────────────────────────────
export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/achievements")
      .then((r) => r.json())
      .then((data) => {
        setAchievements(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Grupowanie po kategorii, zachowanie kolejności
  const grouped = useMemo(() => {
    const map = new Map<string, { icon: string; items: AchievementResult[] }>();
    for (const ach of achievements) {
      if (!map.has(ach.category)) {
        map.set(ach.category, { icon: ach.categoryIcon, items: [] });
      }
      map.get(ach.category)!.items.push(ach);
    }
    return map;
  }, [achievements]);

  // Statystyki globalne
  const totalUnlocked = achievements.filter((a) => a.unlockedTier > 0).length;
  const totalPlatinum = achievements.filter((a) => a.unlockedTier === 4).length;
  const totalTiers = achievements.reduce((s, a) => s + a.unlockedTier, 0);
  const maxTiers   = achievements.reduce((s, a) => s + a.tiers.length, 0);
  const overallPct = maxTiers > 0 ? Math.round((totalTiers / maxTiers) * 100) : 0;

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto">

      {/* ── Nagłówek ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl p-6 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2.5 text-zinc-900 dark:text-white">
            <Trophy className="w-7 h-7 text-yellow-500" />
            Osiągnięcia
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Odblokuj kolejne tiery aktywnie korzystając z aplikacji
          </p>
        </div>

        {/* Mini statystyki */}
        {!loading && (
          <div className="flex gap-4 flex-wrap">
            <div className="text-center">
              <div className="text-2xl font-black text-zinc-900 dark:text-white">{totalUnlocked}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">odblokowanych</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalPlatinum}</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">Platyna 💎</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{overallPct}%</div>
              <div className="text-[10px] text-zinc-400 uppercase tracking-wide font-bold">ukończonych tierów</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Pasek ogólnego postępu ────────────────────────────── */}
      {!loading && (
        <div className="bg-white/70 dark:bg-zinc-950/40 backdrop-blur-xl p-4 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm">
          <div className="flex justify-between text-xs font-medium mb-2 text-zinc-600 dark:text-zinc-400">
            <span>Ogólny postęp tierów</span>
            <span>{totalTiers} / {maxTiers} tierów</span>
          </div>
          <div className="h-3 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-linear-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-1000"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          {/* Miniaturowe flagi tierów */}
          <div className="flex justify-between mt-1.5 text-[9px] text-zinc-400 font-bold">
            <span>🥉 Brąz</span>
            <span>🥈 Srebro</span>
            <span>🥇 Złoto</span>
            <span>💎 Platyna</span>
          </div>
        </div>
      )}

      {/* ── Skeleton / Ładowanie ──────────────────────────────── */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="h-52 rounded-2xl bg-zinc-100 dark:bg-zinc-900 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Kategorie ────────────────────────────────────────── */}
      {!loading && Array.from(grouped.entries()).map(([category, { icon, items }]) => (
        <CategorySection
          key={category}
          category={category}
          categoryIcon={icon}
          achievements={items}
        />
      ))}
    </div>
  );
}
