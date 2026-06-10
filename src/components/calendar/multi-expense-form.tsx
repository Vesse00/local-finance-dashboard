"use client";

import { useState, useTransition, useCallback } from "react";
import { Plus, Trash2, LayoutList } from "lucide-react";
import { addExpensesBatch } from "@/lib/actions";

interface Row {
  id: string;
  amount: string;
  description: string;
  categoryName: string;
}

interface MultiExpenseFormProps {
  selectedDate: Date | null;
  categories: any[];
  onSuccess: () => void;
  currency?: string;
}

function makeId() {
  return Math.random().toString(36).slice(2);
}

function createRow(categories: any[]): Row {
  return {
    id: makeId(),
    amount: "",
    description: "",
    categoryName: categories[0]?.name ?? "",
  };
}

export function MultiExpenseForm({ selectedDate, categories, onSuccess, currency = "PLN" }: MultiExpenseFormProps) {
  const [isPending, startTransition] = useTransition();
  const [rows, setRows] = useState<Row[]>(() => [createRow(categories)]);

  const updateRow = useCallback(
    (id: string, field: keyof Row, value: string) => {
      setRows(prev => {
        const updated = prev.map(r => (r.id === id ? { ...r, [field]: value } : r));
        const last = updated[updated.length - 1];
        // Jeśli edytujemy ostatni wiersz i podajemy kwotę → dołącz nowy pusty wiersz
        if (field === "amount" && last.id === id && value.trim() !== "") {
          return [...updated, createRow(categories)];
        }
        return updated;
      });
    },
    [categories],
  );

  const removeRow = useCallback((id: string) => {
    setRows(prev => (prev.length === 1 ? prev : prev.filter(r => r.id !== id)));
  }, []);

  const filledRows = rows.filter(r => r.amount.trim() !== "" && parseFloat(r.amount) > 0);
  const total = filledRows.reduce((sum, r) => sum + parseFloat(r.amount), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filledRows.length === 0) return;

    const dateStr = selectedDate?.toISOString() ?? new Date().toISOString();
    const items = filledRows.map(r => ({
      amount: parseFloat(r.amount),
      description: r.description,
      categoryName: r.categoryName || categories[0]?.name || "",
      date: dateStr,
    }));

    startTransition(async () => {
      await addExpensesBatch(items);
      onSuccess();
    });
  };

  const pluralWydatek = (n: number) => {
    if (n === 1) return "wydatek";
    if (n >= 2 && n <= 4) return "wydatki";
    return "wydatków";
  };

  return (
    <form onSubmit={handleSubmit} className="animate-in fade-in duration-300">
      {/* HINT */}
      <div className="mb-4 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 bg-black/5 dark:bg-white/5 px-3 py-2 rounded-xl">
        <LayoutList className="w-4 h-4 shrink-0" />
        <span>Wypełnij kwotę — nowy wiersz pojawia się automatycznie. Puste wiersze nie zostaną dodane.</span>
      </div>

      {/* NAGŁÓWEK KOLUMN */}
      <div className="grid grid-cols-[130px_1fr_170px_36px] gap-2 mb-1.5 px-1">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kwota</span>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Opis</span>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Kategoria</span>
        <span />
      </div>

      {/* WIERSZE */}
      <div className="space-y-2 max-h-85 overflow-y-auto pr-1">
        {rows.map((row, idx) => {
          const isLast = idx === rows.length - 1;
          const isEmpty = row.amount.trim() === "";
          return (
            <div
              key={row.id}
              className={`grid grid-cols-[130px_1fr_170px_36px] gap-2 items-center px-2 py-2 rounded-xl border transition-all duration-200 ${
                isLast && isEmpty
                  ? "border-dashed border-zinc-200 dark:border-zinc-800 bg-transparent"
                  : "bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10"
              }`}
            >
              {/* KWOTA */}
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={row.amount}
                onChange={e => updateRow(row.id, "amount", e.target.value)}
                className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm font-bold text-zinc-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-zinc-400"
              />

              {/* OPIS */}
              <input
                type="text"
                placeholder="Opis (opcjonalny)..."
                value={row.description}
                onChange={e => updateRow(row.id, "description", e.target.value)}
                className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-zinc-400"
              />

              {/* KATEGORIA */}
              <select
                value={row.categoryName}
                onChange={e => updateRow(row.id, "categoryName", e.target.value)}
                className="w-full rounded-lg border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900 px-2 py-2 text-sm text-zinc-900 dark:text-white outline-none focus:border-primary cursor-pointer"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>

              {/* USUŃ */}
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                disabled={rows.length === 1}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* PODSUMOWANIE + SUBMIT */}
      <div className="mt-4 pt-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-sm">
          {filledRows.length > 0 ? (
            <span className="text-zinc-600 dark:text-zinc-400">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">{filledRows.length} {pluralWydatek(filledRows.length)}</span>
              {" · łącznie "}
              <span className="font-bold text-primary">
                {total.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
              </span>
            </span>
          ) : (
            <span className="text-zinc-400 text-xs">Brak wypełnionych wierszy</span>
          )}
        </div>
        <button
          type="submit"
          disabled={isPending || filledRows.length === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg shadow-primary/20 disabled:opacity-50 transition-all hover:opacity-90"
        >
          <Plus className="w-4 h-4" />
          {isPending
            ? "Zapisywanie..."
            : `Dodaj ${filledRows.length > 0 ? `${filledRows.length} ` : ""}${pluralWydatek(filledRows.length)}`}
        </button>
      </div>
    </form>
  );
}
