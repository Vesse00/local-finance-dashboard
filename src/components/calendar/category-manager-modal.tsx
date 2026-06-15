"use client";

import { useState, useTransition, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Plus, Tags } from "lucide-react";
import { createCategory, deleteCategory } from "@/lib/actions";
import { useLanguage } from "@/components/LanguageProvider";

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: any[];
}

export function CategoryManagerModal({ isOpen, onClose, categories }: CategoryManagerModalProps) {
  const { t } = useLanguage();
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
    return () => { document.body.style.overflow = "auto"; };
  }, [isOpen]);

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createCategory(formData);
      (e.target as HTMLFormElement).reset(); // Czyści formularz po dodaniu
    });
  };

  const handleDelete = (id: string) => {
    const formData = new FormData();
    formData.append("id", id);
    startTransition(async () => {
      await deleteCategory(formData);
    });
  };

  const modalContent = isOpen ? (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div 
        className="relative w-full max-w-md max-h-[92dvh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-3xl border border-white/10 bg-white dark:bg-zinc-950 shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{t("calendar.modals.category_manager.title")}</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("calendar.modals.category_manager.subtitle")}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Lista aktualnych kategorii */}
        <div className="p-6 overflow-y-auto space-y-2 flex-1 min-h-[200px]">
          {categories.length === 0 ? (
            <p className="text-center text-sm text-zinc-500 py-4">{t("calendar.modals.category_manager.empty")}</p>
          ) : (
            categories.map(category => (
              <div key={category.id} className="flex items-center justify-between p-3 rounded-xl border border-black/5 dark:border-white/5 bg-zinc-50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{category.icon}</span>
                  <span className="font-medium text-sm text-zinc-800 dark:text-zinc-200">{category.name}</span>
                </div>
                <button 
                  onClick={() => handleDelete(category.id)}
                  disabled={isPending}
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors disabled:opacity-50"
                  title={t("calendar.modals.category_manager.delete_tooltip")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Formularz dodawania nowej */}
        <div className="p-6 border-t border-black/5 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/50">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              name="icon" 
              type="text" 
              placeholder={t("calendar.modals.category_manager.icon_placeholder")}
              maxLength={2}
              className="w-14 text-center rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xl" 
              required
              title={t("calendar.modals.category_manager.icon_title")}
            />
            <input 
              name="name" 
              type="text" 
              placeholder={t("calendar.modals.category_manager.name_placeholder")} 
              className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 p-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:text-white" 
              required
            />
            <button 
              type="submit" 
              disabled={isPending}
              className="px-4 rounded-xl bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center shadow-md shadow-primary/20"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  ) : null;

  if (!mounted) return null;
  return createPortal(modalContent, document.body);
}