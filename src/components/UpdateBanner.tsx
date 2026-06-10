"use client";

import { useEffect, useState } from "react";
import { X, ArrowUpCircle } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

interface UpdateStatus {
  updateAvailable: boolean;
  latestVersion?: string | null;
  lastChecked?: string | null;
}

export function UpdateBanner() {
  const { t } = useLanguage();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const wasDismissed = sessionStorage.getItem("update-banner-dismissed");
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    fetch("/api/system/update-status")
      .then((r) => r.json())
      .then((data: UpdateStatus) => setStatus(data))
      .catch(() => {});
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem("update-banner-dismissed", "1");
    setDismissed(true);
  };

  if (!status?.updateAvailable || dismissed) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-9999 flex items-center justify-between gap-4 bg-amber-500 px-4 py-2.5 text-sm font-semibold text-amber-950 shadow-lg">
      <div className="flex items-center gap-2">
        <ArrowUpCircle className="h-4 w-4 shrink-0" />
        <span>
          {t("update_banner.available")}
          {status.latestVersion ? ` (${status.latestVersion})` : ""}.{" "}
          <a
            href="https://github.com/Vesse00/local-finance-dashboard/releases/latest"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-amber-900"
          >
            {t("update_banner.see_changelog")}
          </a>
          {" · "}
          <a
            href="/settings?tab=utilities"
            className="underline underline-offset-2 hover:text-amber-900"
          >
            {t("update_banner.update_link")}
          </a>
        </span>
      </div>
      <button
        onClick={handleDismiss}
        aria-label={t("update_banner.dismiss_aria")}
        className="shrink-0 rounded-md p-1 hover:bg-amber-400 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
