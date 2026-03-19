"use client";

import { useState, useEffect } from "react";
import { Shield, Mail, Lock, CheckCircle2, AlertCircle, Save, KeyRound, Pencil, Eye, EyeOff, MapPin, Wrench, Settings } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"security" | "utilities">("security");
  
  const [currentEmail, setCurrentEmail] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(true);
  
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
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status !== "idle") { setStatus("idle"); setMessage(""); }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving"); setMessage("");

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setStatus("error"); setMessage("Nowe hasła nie są identyczne!"); return;
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
        setStatus("success"); setMessage("Zmiany zabezpieczeń zostały zapisane.");
        setCurrentEmail(formData.newEmail || currentEmail);
        setIsEditingEmail(false);
        setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error"); setMessage(data.error || "Wystąpił błąd.");
      }
    } catch (err) { setStatus("error"); setMessage("Błąd serwera."); }
  };

  const handleUtilitiesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving"); setMessage("");

    try {
      const res = await fetch("/api/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ location })
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success"); setMessage("Preferencje zostały zaktualizowane.");
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error"); setMessage(data.error || "Wystąpił błąd.");
      }
    } catch (err) { setStatus("error"); setMessage("Błąd serwera."); }
  };

  if (loading) return <div className="p-12 text-center text-zinc-500 animate-pulse">Wczytywanie ustawień...</div>;

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
              Konfiguracja
            </span>
            <h1 className="text-3xl font-black text-white">Ustawienia Aplikacji</h1>
            <p className="text-zinc-400 mt-1 text-sm max-w-md">Zarządzaj swoimi danymi, bezpieczeństwem i preferencjami Asystenta.</p>
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
          <Shield className="w-4 h-4" /> Zabezpieczenia Konta
        </button>
        <button 
          onClick={() => { setActiveTab("utilities"); setStatus("idle"); setMessage(""); }}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all duration-300 ${
            activeTab === "utilities" 
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/25 scale-100" 
              : "bg-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-white/50 dark:hover:bg-zinc-800/50"
          }`}
        >
          <Wrench className="w-4 h-4" /> System & Utilities
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
                  <Mail className="w-5 h-5 text-indigo-500" /> Adres E-mail
                </h2>
                <div className="space-y-2 group max-w-md">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Twój E-mail</span>
                    {isEditingEmail && <span className="text-indigo-500 text-[10px]">Tryb edycji</span>}
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
                  <KeyRound className="w-5 h-5 text-emerald-500" /> Zmiana Hasła
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nowe hasło</label>
                    <div className="relative flex items-center">
                      {/* PRZYWRÓCONY PLACEHOLDER */}
                      <input type={showNewPassword ? "text" : "password"} name="newPassword" placeholder="Minimum 6 znaków" value={formData.newPassword} onChange={handleChange} className="w-full p-4 pr-12 bg-white/60 dark:bg-zinc-900 border border-white/40 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-bold text-zinc-900 dark:text-white transition-colors" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 text-zinc-400 hover:text-emerald-500"><Eye className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Powtórz nowe hasło</label>
                    <div className="relative flex items-center">
                      {/* PRZYWRÓCONY PLACEHOLDER */}
                      <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Powtórz nowe hasło" value={formData.confirmPassword} onChange={handleChange} className="w-full p-4 pr-12 bg-white/60 dark:bg-zinc-900 border border-white/40 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-bold text-zinc-900 dark:text-white transition-colors" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 text-zinc-400 hover:text-emerald-500"><Eye className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-red-50/80 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl space-y-4 max-w-2xl">
                <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider">Potwierdzenie tożsamości</h3>
                    <p className="text-xs opacity-80 mt-1">Podaj OBECNE hasło, aby zapisać zmiany zabezpieczeń.</p>
                  </div>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                  {/* PRZYWRÓCONY PLACEHOLDER */}
                  <input type={showCurrentPassword ? "text" : "password"} name="currentPassword" placeholder="Wpisz obecne hasło..." required value={formData.currentPassword} onChange={handleChange} className="w-full p-4 pl-12 pr-12 bg-white dark:bg-zinc-950 border border-red-200 dark:border-red-500/30 rounded-xl outline-none focus:border-red-500 font-bold text-zinc-900 dark:text-white transition-colors" />
                </div>
              </div>

              {status === "error" && <div className="p-4 bg-red-500/10 text-red-500 text-sm font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {message}</div>}
              {status === "success" && <div className="p-4 bg-emerald-500/10 text-emerald-500 text-sm font-bold rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {message}</div>}
            </div>

            <div className="p-6 bg-white/50 dark:bg-zinc-900/30 border-t border-white/40 dark:border-zinc-800 flex justify-end">
              <button type="submit" disabled={status === "saving" || !formData.currentPassword} className="px-8 py-3.5 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50">
                {status === "saving" ? "Zapisywanie..." : "Zapisz zabezpieczenia"}
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
                  <MapPin className="w-5 h-5 text-purple-500" /> Lokalizacja i Pogoda
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                  Podaj swoją miejscowość, aby Asystent w Daily Briefingu mógł rano i wieczorem informować Cię o prognozie pogody (korzystamy z darmowego API, nie potrzebujesz klucza!).
                </p>
                
                <div className="space-y-2 max-w-md pt-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Miasto (np. Poznań, Warszawa)</label>
                  <input 
                    type="text" 
                    placeholder="Wpisz miasto..."
                    value={location} 
                    onChange={(e) => { setLocation(e.target.value); setStatus("idle"); setMessage(""); }}
                    className="w-full p-4 bg-white/60 dark:bg-zinc-900 border border-white/40 dark:border-zinc-800 rounded-xl outline-none focus:border-purple-500 font-bold text-zinc-900 dark:text-white transition-colors" 
                  />
                </div>
              </div>

              {status === "error" && <div className="p-4 bg-red-500/10 text-red-500 text-sm font-bold rounded-xl flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {message}</div>}
              {status === "success" && <div className="p-4 bg-emerald-500/10 text-emerald-500 text-sm font-bold rounded-xl flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {message}</div>}
            </div>

            <div className="p-6 bg-white/50 dark:bg-zinc-900/30 border-t border-white/40 dark:border-zinc-800 flex justify-end">
              <button type="submit" disabled={status === "saving"} className="px-8 py-3.5 rounded-xl font-bold text-white bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50">
                {status === "saving" ? "Zapisywanie..." : "Zapisz preferencje"}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}