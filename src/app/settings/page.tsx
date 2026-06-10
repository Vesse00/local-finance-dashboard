"use client";

import { useState, useEffect } from "react";
import { Shield, Mail, Lock, CheckCircle2, AlertCircle, Save, KeyRound, Pencil, Eye, EyeOff, MapPin, Wrench, Settings, Trash2, AlertTriangle, RefreshCw, Clock } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";

export default function SettingsPage() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"security" | "utilities" | "admin" | "danger">("security");
  
  const [currentEmail, setCurrentEmail] = useState("");
  const [location, setLocation] = useState("");
  const [currency, setCurrency] = useState("PLN");
  const [payday, setPayday] = useState<number>(10);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<"USER" | "ADMIN">("USER");

  // Stan ustawień systemowych (tylko admin)
  const [updateCheckHour, setUpdateCheckHour] = useState<number>(3);
  const [systemStatus, setSystemStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [systemMessage, setSystemMessage] = useState("");
  const [updateInfo, setUpdateInfo] = useState<{ updateAvailable: boolean; latestVersion?: string | null; lastChecked?: string | null } | null>(null);
  
  const [formData, setFormData] = useState({
    newEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // USUWANIE KONTA
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 1. Sprawdzamy, czy weszliśmy przez link z parametrem ?tab=utilities
    const params = new URLSearchParams(window.location.search);
    if (params.get("tab") === "utilities") {
      setActiveTab("utilities");
    }

    // 2. Pobieramy dane ustawień
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          setCurrentEmail(data.email);
          setFormData(prev => ({ ...prev, newEmail: data.email }));
        }
        if (data.location !== undefined) {
          setLocation(data.location);
        }
        if (data.currency) {
          setCurrency(data.currency);
        }
        if (data.payday !== undefined) {
          setPayday(data.payday);
        }
        if (data.role) {
          setUserRole(data.role);
          if (data.role === "ADMIN") {
            // Pobieramy ustawienia systemowe i status aktualizacji
            fetch("/api/system/settings")
              .then(r => r.json())
              .then(sys => { if (sys.updateCheckHour !== undefined) setUpdateCheckHour(sys.updateCheckHour); })
              .catch(() => {});
            fetch("/api/system/update-status")
              .then(r => r.json())
              .then(upd => setUpdateInfo(upd))
              .catch(() => {});
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status !== "idle") { setStatus("idle"); setMessage(""); }
  };

  const handleSystemSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSystemStatus("saving"); setSystemMessage("");
    try {
      const res = await fetch("/api/system/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updateCheckHour }),
      });
      const data = await res.json();
      if (res.ok) {
        setSystemStatus("success");
        setSystemMessage(t("settings_page.admin_save_success"));
        setTimeout(() => setSystemStatus("idle"), 5000);
      } else {
        setSystemStatus("error");
        setSystemMessage(data.error || "Wystąpił błąd.");
      }
    } catch {
      setSystemStatus("error");
      setSystemMessage(t("settings_page.error_server"));
    }
  };

  // FUNKCJA USUWANIA WSZYSTKICH DANYCH
  const handleDeleteData = async (e: React.FormEvent) => {
  e.preventDefault();
  setStatus("saving"); setMessage("");

  try {
    const res = await fetch("/api/emergency-reset", {
      method: "DELETE", // Zwróć uwagę: metoda to DELETE (lub POST, zależnie od Twojej konwencji API)
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: deletePassword })
    });
    
    const data = await res.json();
    if (res.ok) {
      setStatus("success"); 
      setMessage(t("settings_page.danger_success"));
      setDeletePassword("");
      setShowDeleteConfirm(false); // Zwijamy formularz potwierdzenia
      
      // Opcjonalnie: odświeżenie strony po chwili, aby zresetować wszystkie stany w aplikacji
      setTimeout(() => {
        window.location.href = "/"; // Przekierowanie na pusty dashboard
      }, 3000);
      
    } else {
      setStatus("error"); setMessage(data.error || t("settings_page.error_generic"));
    }
  } catch (err) { 
    setStatus("error"); setMessage(t("settings_page.error_server")); 
  }
};

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving"); setMessage("");

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setStatus("error"); setMessage(t("settings_page.security_passwords_mismatch")); return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newEmail: formData.newEmail !== currentEmail ? formData.newEmail : undefined,
          newPassword: formData.newPassword || undefined
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success"); setMessage(t("settings_page.security_success"));
        setCurrentEmail(formData.newEmail || currentEmail);
        setIsEditingEmail(false);
        setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error"); setMessage(data.error || t("settings_page.error_generic"));
      }
    } catch (err) { setStatus("error"); setMessage(t("settings_page.error_server")); }
  };

  const handleUtilitiesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving"); setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location, currency, payday })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success"); setMessage(t("settings_page.utilities_success"));
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error"); setMessage(data.error || t("settings_page.error_generic"));
      }
    } catch (err) { setStatus("error"); setMessage(t("settings_page.error_server")); }
  };

  if (loading) return <div className="p-12 text-center text-zinc-500 animate-pulse">{t("settings_page.loading")}</div>;

  return (
    <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8 relative z-10">
      
      {/* NAGŁÓWEK */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800/50 rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Settings className="w-64 h-64 text-white" />
        </div>
        
        <div className="flex items-center gap-6 z-10">
          <div className="bg-white/10 p-4 rounded-2xl shadow-sm backdrop-blur-md">
            <Settings className="w-10 h-10 text-white" />
          </div>
          <div>
            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 inline-block text-zinc-300">
              {t("settings_page.config_badge")}
            </span>
            <h1 className="text-3xl font-black text-white">{t("settings_page.title")}</h1>
            <p className="text-zinc-400 mt-1 text-sm max-w-md">{t("settings_page.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* BARDZIEJ ZAUWAŻALNE ZAKŁADKI (TABS) */}
      <div className="flex flex-col sm:flex-row p-2 bg-zinc-200/50 dark:bg-zinc-900/80 border border-zinc-300/50 dark:border-zinc-800/50 rounded-2xl w-full sm:w-fit backdrop-blur-xl shadow-inner gap-2">
        <button 
          onClick={() => { setActiveTab("security"); setStatus("idle"); setMessage(""); }}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 ${
            activeTab === "security" 
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 scale-100" 
              : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Shield className="w-4 h-4" /> {t("settings_page.tab_security")}
        </button>
        <button 
          onClick={() => { setActiveTab("utilities"); setStatus("idle"); setMessage(""); }}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 ${
            activeTab === "utilities" 
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25 scale-100" 
              : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Wrench className="w-4 h-4" /> {t("settings_page.tab_utilities")}
        </button>
        {userRole === "ADMIN" && (
          <button 
            onClick={() => { setActiveTab("admin"); setStatus("idle"); setMessage(""); }}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 ${
              activeTab === "admin" 
                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/25 scale-100" 
                : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50"
            }`}
          >
            <Shield className="w-4 h-4" /> {t("settings_page.tab_admin")}
          </button>
        )}
        <button 
          onClick={() => { setActiveTab("danger"); setStatus("idle"); setMessage(""); }}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 ${
            activeTab === "danger" 
              ? "bg-red-500 text-white shadow-lg shadow-red-500/25 scale-100" 
              : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> {t("settings_page.tab_danger")}
        </button>
      </div>

      {/* GŁÓWNY KONTENER */}
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-lg border border-white/50 dark:border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.05)] overflow-hidden transition-all duration-500">
        
        {/* ======================================= */}
        {/* TAB 1: ZABEZPIECZENIA                   */}
        {/* ======================================= */}
        {activeTab === "security" && (
          <form onSubmit={handleSecuritySubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 md:p-8 space-y-8">
              
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-white/40 dark:border-zinc-800 pb-2">
                  <Mail className="w-5 h-5 text-indigo-500" /> {t("settings_page.security_email_title")}
                </h2>
                <div className="space-y-2 group max-w-md">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{t("settings_page.security_email_label")}</span>
                    {isEditingEmail && <span className="text-indigo-500 text-[10px]">{t("settings_page.security_editing_badge")}</span>}
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="email" name="newEmail" value={formData.newEmail} onChange={handleChange} readOnly={!isEditingEmail}
                      className={`w-full p-4 pr-12 rounded-xl outline-none font-bold transition-all ${
                        isEditingEmail 
                          ? "bg-white dark:bg-zinc-900 border-2 border-indigo-500 text-zinc-900 dark:text-white shadow-sm" 
                          : "bg-white/50 dark:bg-zinc-900/50 border-2 border-transparent text-zinc-500"
                      }`} 
                    />
                    {!isEditingEmail && (
                      <button type="button" onClick={() => setIsEditingEmail(true)} className="absolute right-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-500">
                        <Pencil className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-white/40 dark:border-zinc-800 pb-2">
                  <KeyRound className="w-5 h-5 text-emerald-500" /> {t("settings_page.security_password_title")}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t("settings_page.security_new_password_label")}</label>
                    <div className="relative flex items-center">
                      <input type={showNewPassword ? "text" : "password"} name="newPassword" placeholder={t("settings_page.security_new_password_placeholder")} value={formData.newPassword} onChange={handleChange} className="w-full p-4 pr-12 bg-white/60 dark:bg-zinc-900 border border-white/40 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-bold text-zinc-900 dark:text-white transition-colors" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 text-zinc-400 hover:text-emerald-500"><Eye className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t("settings_page.security_confirm_password_label")}</label>
                    <div className="relative flex items-center">
                      <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder={t("settings_page.security_confirm_password_placeholder")} value={formData.confirmPassword} onChange={handleChange} className="w-full p-4 pr-12 bg-white/60 dark:bg-zinc-900 border border-white/40 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-bold text-zinc-900 dark:text-white transition-colors" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 text-zinc-400 hover:text-emerald-500"><Eye className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl space-y-4 max-w-2xl">
                <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">{t("settings_page.security_identity_title")}</h3>
                    <p className="text-xs opacity-80 mt-1">{t("settings_page.security_identity_desc")}</p>
                  </div>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  <input type={showCurrentPassword ? "text" : "password"} name="currentPassword" placeholder={t("settings_page.security_current_password_placeholder")} required value={formData.currentPassword} onChange={handleChange} className="w-full p-4 pl-12 pr-12 bg-white dark:bg-zinc-950 border border-red-200 dark:border-red-500/30 rounded-xl outline-none focus:border-red-500 font-bold text-zinc-900 dark:text-white transition-colors" />
                </div>
              </div>

              {status === "error" && <div className="p-4 bg-red-500/10 text-red-500 text-sm font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {message}</div>}
              {status === "success" && <div className="p-4 bg-emerald-500/10 text-emerald-500 text-sm font-bold rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {message}</div>}
            </div>

            <div className="p-6 bg-white/50 dark:bg-zinc-900/30 border-t border-white/40 dark:border-zinc-800 flex justify-end">
              <button type="submit" disabled={status === "saving" || !formData.currentPassword} className="px-8 py-3.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
                {status === "saving" ? t("settings_page.security_saving") : t("settings_page.security_save_btn")}
              </button>
            </div>
          </form>
        )}

        {/* ======================================= */}
        {/* TAB 2: UTILITIES (PREFERENCJE)          */}
        {/* ======================================= */}
        {activeTab === "utilities" && (
          <form onSubmit={handleUtilitiesSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 md:p-8 space-y-8">
              
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-white/40 dark:border-zinc-800 pb-2">
                  <MapPin className="w-5 h-5 text-purple-500" /> {t("settings_page.utilities_location_title")}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                  {t("settings_page.utilities_location_desc")}
                </p>
                
                <div className="space-y-2 max-w-md pt-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t("settings_page.utilities_location_label")}</label>
                  <input 
                    type="text" 
                    placeholder={t("settings_page.utilities_location_placeholder")}
                    value={location} 
                    onChange={(e) => { setLocation(e.target.value); setStatus("idle"); setMessage(""); }}
                    className="w-full p-4 bg-white/60 dark:bg-zinc-900 border border-white/40 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 font-bold text-zinc-900 dark:text-white transition-colors" 
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-white/40 dark:border-zinc-800 pb-2">
                  <span className="w-5 h-5 flex items-center justify-center font-bold text-purple-500 rounded-full border border-purple-500 text-xs">$</span> {t("settings_page.utilities_currency_title")}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                  {t("settings_page.utilities_currency_desc")}
                </p>
                <div className="space-y-2 max-w-md pt-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t("settings_page.utilities_currency_label")}</label>
                  <select 
                    value={currency} 
                    onChange={(e) => { setCurrency(e.target.value); setStatus("idle"); setMessage(""); }}
                    className="w-full p-4 bg-white/60 dark:bg-zinc-900 border border-white/40 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 font-bold text-zinc-900 dark:text-white transition-colors cursor-pointer"
                  >
                    <option value="PLN">PLN - Polski Złoty</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="USD">USD - Dolar amerykański</option>
                    <option value="GBP">GBP - Funt brytyjski</option>
                    <option value="NOK">NOK - Korona norweska</option>
                    <option value="CHF">CHF - Frank szwajcarski</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-white/40 dark:border-zinc-800 pb-2">
                  <span className="w-5 h-5 flex items-center justify-center font-bold text-purple-500 rounded-full border border-purple-500 text-xs">D</span> {t("settings_page.utilities_payday_title")}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                  {t("settings_page.utilities_payday_desc")}
                </p>
                <div className="space-y-2 max-w-md pt-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t("settings_page.utilities_payday_label")}</label>
                  <select 
                    value={payday} 
                    onChange={(e) => { setPayday(Number(e.target.value)); setStatus("idle"); setMessage(""); }}
                    className="w-full p-4 bg-white/60 dark:bg-zinc-900 border border-white/40 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 font-bold text-zinc-900 dark:text-white transition-colors cursor-pointer"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {t("settings_page.utilities_payday_day").replace("{day}", String(day))}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {status === "error" && <div className="p-4 bg-red-500/10 text-red-500 text-sm font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {message}</div>}
              {status === "success" && <div className="p-4 bg-emerald-500/10 text-emerald-500 text-sm font-bold rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {message}</div>}
            </div>

            <div className="p-6 bg-white/50 dark:bg-zinc-900/30 border-t border-white/40 dark:border-zinc-800 flex justify-end">
              <button type="submit" disabled={status === "saving"} className="px-8 py-3.5 rounded-xl font-bold text-white bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50">
                {status === "saving" ? t("settings_page.utilities_saving") : t("settings_page.utilities_save_btn")}
              </button>
            </div>
          </form>
        )}

        {/* ======================================= */}
{/* TAB 3: DANGER ZONE                      */}
{/* ======================================= */}
{activeTab === "admin" && userRole === "ADMIN" && (
  <form onSubmit={handleSystemSettingsSubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="p-6 md:p-8 space-y-8">

      {/* Status aktualizacji */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-white/40 dark:border-zinc-800 pb-2">
          <RefreshCw className="w-5 h-5 text-orange-500" /> {t("settings_page.admin_update_status_title")}
        </h2>
        {updateInfo ? (
          <div className={`p-4 rounded-xl border ${updateInfo.updateAvailable ? "bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30" : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30"}`}>
            <div className="flex items-center gap-3">
              {updateInfo.updateAvailable ? (
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              )}
              <div>
                <p className={`font-bold text-sm ${updateInfo.updateAvailable ? "text-amber-700 dark:text-amber-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                  {updateInfo.updateAvailable
                    ? t("settings_page.admin_update_available").replace("{version}", updateInfo.latestVersion ?? t("settings_page.admin_update_unknown"))
                    : t("settings_page.admin_update_current")}
                </p>
                {updateInfo.lastChecked && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {t("settings_page.admin_last_checked")} {new Date(updateInfo.lastChecked).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-500">{t("settings_page.admin_update_loading")}</p>
        )}
      </div>

      {/* Harmonogram sprawdzania */}
      <div className="space-y-4 pt-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-white/40 dark:border-zinc-800 pb-2">
          <Clock className="w-5 h-5 text-orange-500" /> {t("settings_page.admin_schedule_title")}
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
          {t("settings_page.admin_schedule_desc")}
        </p>
        <div className="space-y-2 max-w-xs pt-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t("settings_page.admin_hour_label")}</label>
          <select
            value={updateCheckHour}
            onChange={(e) => { setUpdateCheckHour(Number(e.target.value)); setSystemStatus("idle"); setSystemMessage(""); }}
            className="w-full p-4 bg-white/60 dark:bg-zinc-900 border border-white/40 dark:border-zinc-800 rounded-xl outline-none focus:border-orange-500 font-bold text-zinc-900 dark:text-white transition-colors cursor-pointer"
          >
            {Array.from({ length: 24 }, (_, i) => (
              <option key={i} value={i}>
                {String(i).padStart(2, "0")}:00
              </option>
            ))}
          </select>
        </div>
      </div>

      {systemStatus === "error" && <div className="p-4 bg-red-500/10 text-red-500 text-sm font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {systemMessage}</div>}
      {systemStatus === "success" && <div className="p-4 bg-emerald-500/10 text-emerald-500 text-sm font-bold rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {systemMessage}</div>}
    </div>

    <div className="p-6 bg-white/50 dark:bg-zinc-900/30 border-t border-white/40 dark:border-zinc-800 flex justify-end">
      <button type="submit" disabled={systemStatus === "saving"} className="px-8 py-3.5 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50">
        {systemStatus === "saving" ? t("settings_page.admin_saving") : t("settings_page.admin_save_btn")}
      </button>
    </div>
  </form>
)}

        {/* ======================================= */}
{/* TAB 3: DANGER ZONE                      */}
{/* ======================================= */}
{activeTab === "danger" && (
  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="p-6 md:p-8 space-y-8">
      
      <div className="space-y-4">
  <h2 className="text-lg font-bold text-red-600 dark:text-red-500 flex items-center gap-2 border-b border-red-500/20 pb-2">
    <AlertTriangle className="w-5 h-5" /> {t("settings_page.danger_title")}
  </h2>
  <div className="text-sm text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed space-y-2">
    <p>{t("settings_page.danger_desc")}</p>
    <div className="p-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
      <p className="font-bold text-zinc-900 dark:text-white flex items-center gap-2">
        <Shield className="w-4 h-4 text-emerald-500" /> {t("settings_page.danger_account_safe_title")}
      </p>
      <p className="text-xs mt-1">{t("settings_page.danger_account_safe_desc")}</p>
    </div>
    <strong className="text-red-600 dark:text-red-400 block mt-4">{t("settings_page.danger_warning")}</strong>
  </div>
</div>

      {!showDeleteConfirm ? (
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="px-6 py-3 rounded-xl font-bold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-500/10 hover:bg-red-200 dark:hover:bg-red-500/20 border border-red-200 dark:border-red-500/20 transition-all flex items-center gap-2"
        >
          <Trash2 className="w-5 h-5" /> {t("settings_page.danger_start_btn")}
        </button>
      ) : (
        <form onSubmit={handleDeleteData} className="p-6 bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-2xl space-y-6 max-w-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-start gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-6 h-6 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">{t("settings_page.danger_confirm_title")}</h3>
              <p className="text-xs opacity-90 mt-1">{t("settings_page.danger_confirm_desc")}</p>
            </div>
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/70" />
            <input 
              type={showDeletePassword ? "text" : "password"} 
              placeholder={t("settings_page.danger_password_placeholder")} 
              required 
              value={deletePassword} 
              onChange={(e) => { setDeletePassword(e.target.value); setStatus("idle"); setMessage(""); }}
              className="w-full p-4 pl-12 pr-12 bg-white dark:bg-zinc-950 border-2 border-red-200 dark:border-red-500/30 rounded-xl outline-none focus:border-red-500 font-bold text-zinc-900 dark:text-white transition-colors" 
            />
            <button 
              type="button" 
              onClick={() => setShowDeletePassword(!showDeletePassword)} 
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-red-500 transition-colors"
            >
              {showDeletePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button 
              type="button"
              onClick={() => { setShowDeleteConfirm(false); setDeletePassword(""); setStatus("idle"); setMessage(""); }}
              className="px-4 py-2 rounded-lg font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              {t("settings_page.danger_cancel_btn")}
            </button>
            <button 
              type="submit" 
              disabled={status === "saving" || !deletePassword} 
              className="px-6 py-2 rounded-lg font-bold text-white bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {status === "saving" ? t("settings_page.danger_deleting") : t("settings_page.danger_confirm_btn")}
            </button>
          </div>
        </form>
      )}

      {status === "error" && <div className="p-4 bg-red-500/10 text-red-500 text-sm font-bold rounded-xl flex items-center gap-2 max-w-2xl"><AlertCircle className="w-4 h-4" /> {message}</div>}
      {status === "success" && <div className="p-4 bg-emerald-500/10 text-emerald-500 text-sm font-bold rounded-xl flex items-center gap-2 max-w-2xl"><CheckCircle2 className="w-4 h-4" /> {message}</div>}
    </div>
  </div>
)}

      </div>
    </div>
  );
}