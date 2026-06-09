/**
 * Wywołaj tę funkcję po każdej akcji, która może odblokować osiągnięcie
 * (import, dodanie wpływu, nowy wydatek, itp.)
 *
 * Przykład:
 *   import { triggerAchievementCheck } from "@/lib/triggerAchievementCheck";
 *   // ... po zapisaniu danych ...
 *   triggerAchievementCheck();
 */
export function triggerAchievementCheck() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("achievementCheck"));
  }
}
