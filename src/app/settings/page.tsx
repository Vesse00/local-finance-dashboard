"use client";

import { useState, useEffect } from "react";
import { Shield, Mail, Lock, CheckCircle2, AlertCircle, KeyRound, Pencil, Eye, EyeOff, MapPin, Wrench, Settings, Trash2, AlertTriangle } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"security" | "utilities" | "danger">("security");
  
  const [currentEmail, setCurrentEmail] = useState("");
  const [location, setLocation] = useState("");
  const [currency, setCurrency] = useState("PLN");
  const [payday, setPayday] = useState<number>(10);
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
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status !== "idle") { setStatus("idle"); setMessage(""); }
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
      setMessage("Wszystkie rekordy zostały trwale usunięte. Masz teraz czystą kartę.");
      setDeletePassword("");
      setShowDeleteConfirm(false); // Zwijamy formularz potwierdzenia
      
      // Opcjonalnie: odświeżenie strony po chwili, aby zresetować wszystkie stany w aplikacji
      setTimeout(() => {
        window.location.href = "/"; // Przekierowanie na pusty dashboard
      }, 3000);
      
    } else {
      setStatus("error"); setMessage(data.error || "Nieprawidłowe hasło lub błąd serwera.");
    }
  } catch (err) { 
    setStatus("error"); setMessage("Błąd serwera przy próbie usunięcia danych."); 
  }
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
        body: JSON.stringify({ location, currency, payday })
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
      
      {/* HEADER */}
      <div className="border border-green-900/30 bg-black/40 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
        <div>
          <p className="text-[10px] font-mono text-green-700 tracking-widest mb-1">{`>`} SYSTEM_CONFIG</p>
          <h1 className="text-2xl font-mono font-black text-white">Ustawienia Aplikacji</h1>
          <p className="text-green-800 font-mono text-xs mt-1">{'// Zarządzaj bezpieczeństwem i preferencjami systemu'}</p>
        </div>
        <Settings className="w-8 h-8 text-green-900/50" />
      </div>

      {/* TABS */}
      <div className="flex flex-col sm:flex-row border border-green-900/30 bg-black/20 w-full sm:w-fit">
        <button
          onClick={() => { setActiveTab("security"); setStatus("idle"); setMessage(""); }}
          className={`flex items-center justify-center gap-2 px-6 py-3 font-mono text-sm transition-all ${
            activeTab === "security"
              ? "bg-green-400/10 text-green-400 border-b-2 sm:border-b-0 sm:border-l-2 border-green-500"
              : "text-zinc-600 hover:text-green-600 hover:bg-green-400/5"
          }`}
        >
          <Shield className="w-4 h-4" /> [SECURITY]
        </button>
        <button
          onClick={() => { setActiveTab("utilities"); setStatus("idle"); setMessage(""); }}
          className={`flex items-center justify-center gap-2 px-6 py-3 font-mono text-sm transition-all ${
            activeTab === "utilities"
              ? "bg-green-400/10 text-green-400 border-b-2 sm:border-b-0 sm:border-l-2 border-green-500"
              : "text-zinc-600 hover:text-green-600 hover:bg-green-400/5"
          }`}
        >
          <Wrench className="w-4 h-4" /> [UTILITIES]
        </button>
        <button
          onClick={() => { setActiveTab("danger"); setStatus("idle"); setMessage(""); }}
          className={`flex items-center justify-center gap-2 px-6 py-3 font-mono text-sm transition-all ${
            activeTab === "danger"
              ? "bg-red-900/20 text-red-500 border-b-2 sm:border-b-0 sm:border-l-2 border-red-600"
              : "text-zinc-600 hover:text-red-600 hover:bg-red-900/10"
          }`}
        >
          <AlertTriangle className="w-4 h-4" /> [DANGER]
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <div className="border border-green-900/30 bg-black/20 overflow-hidden transition-all duration-500">
        
        {/* ======================================= */}
        {/* TAB 1: ZABEZPIECZENIA                   */}
        {/* ======================================= */}
        {activeTab === "security" && (
          <form onSubmit={handleSecuritySubmit} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="p-6 md:p-8 space-y-8">
              
              <div className="space-y-4">
                <h2 className="text-xs font-mono font-black text-green-600 uppercase tracking-widest flex items-center gap-2 border-b border-green-900/30 pb-2">
                  <Mail className="w-4 h-4" /> {'// ADRES_EMAIL'}
                </h2>
                <div className="space-y-2 group max-w-md">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Twój E-mail</span>
                    {isEditingEmail && <span className="text-green-600 text-[10px] font-mono">EDITING_MODE</span>}
                  </label>
                  <div className="relative flex items-center">
                    <input 
                      type="email" name="newEmail" value={formData.newEmail} onChange={handleChange} readOnly={!isEditingEmail}
                      className={`w-full p-4 pr-12 font-mono outline-none transition-all ${
                        isEditingEmail
                          ? "bg-black/40 border-2 border-green-600 text-white"
                          : "bg-black/20 border border-green-900/30 text-zinc-600"
                      }`} 
                    />
                    {!isEditingEmail && (
                      <button type="button" onClick={() => setIsEditingEmail(true)} className="absolute right-4 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity hover:text-green-500">
                        <Pencil className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h2 className="text-xs font-mono font-black text-green-600 uppercase tracking-widest flex items-center gap-2 border-b border-green-900/30 pb-2">
                  <KeyRound className="w-4 h-4" /> {'// ZMIANA_HASLA'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nowe hasło</label>
                    <div className="relative flex items-center">
                      {/* PRZYWRÓCONY PLACEHOLDER */}
                      <input type={showNewPassword ? "text" : "password"} name="newPassword" placeholder="Minimum 6 znaków" value={formData.newPassword} onChange={handleChange} className="w-full p-4 pr-12 bg-black/30 border border-green-900/40 font-mono outline-none focus:border-green-600 text-white transition-colors" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 text-zinc-600 hover:text-green-500"><Eye className="w-5 h-5" /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Powtórz nowe hasło</label>
                    <div className="relative flex items-center">
                      {/* PRZYWRÓCONY PLACEHOLDER */}
                      <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Powtórz nowe hasło" value={formData.confirmPassword} onChange={handleChange} className="w-full p-4 pr-12 bg-black/30 border border-green-900/40 font-mono outline-none focus:border-green-600 text-white transition-colors" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 text-zinc-600 hover:text-green-500"><Eye className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border border-red-900/40 bg-red-900/10 space-y-4 max-w-2xl">
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
                  <input type={showCurrentPassword ? "text" : "password"} name="currentPassword" placeholder="Wpisz obecne hasło..." required value={formData.currentPassword} onChange={handleChange} className="w-full p-4 pl-12 pr-12 bg-black/30 border border-red-900/40 font-mono outline-none focus:border-red-600 text-white transition-colors" />
                </div>
              </div>

              {status === "error" && <div className="p-4 border border-red-900/50 bg-red-900/10 text-red-500 text-xs font-mono flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {message}</div>}
              {status === "success" && <div className="p-4 border border-green-900/50 bg-green-900/10 text-green-500 text-xs font-mono flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {message}</div>}
            </div>

            <div className="p-6 bg-black/20 border-t border-green-900/20 flex justify-end">
              <button type="submit" disabled={status === "saving" || !formData.currentPassword} className="px-8 py-3 font-mono text-xs uppercase tracking-wider text-green-400 border border-green-700 bg-green-400/10 hover:bg-green-400/20 transition-all disabled:opacity-40">
                {status === "saving" ? "SAVING..." : "> SAVE_SECURITY"}
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
                <h2 className="text-xs font-mono font-black text-green-600 uppercase tracking-widest flex items-center gap-2 border-b border-green-900/30 pb-2">
                  <MapPin className="w-4 h-4" /> {'// LOKALIZACJA_POGODA'}
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
                    className="w-full p-4 bg-black/30 border border-green-900/40 font-mono outline-none focus:border-green-600 text-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <h2 className="text-xs font-mono font-black text-green-600 uppercase tracking-widest flex items-center gap-2 border-b border-green-900/30 pb-2">
                  <span className="font-mono text-green-700">$</span> {'// WALUTA'}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                  Wybierz domyślną walutę, w której aplikacja będzie wyświetlać wprowadzane i statystyczne dane o Twoich finansach.
                </p>
                <div className="space-y-2 max-w-md pt-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Twoja waluta</label>
                  <select
                    value={currency}
                    onChange={(e) => { setCurrency(e.target.value); setStatus("idle"); setMessage(""); }}
                    className="w-full p-4 bg-black/30 border border-green-900/40 font-mono outline-none focus:border-green-600 text-white transition-colors cursor-pointer"
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
                <h2 className="text-xs font-mono font-black text-green-600 uppercase tracking-widest flex items-center gap-2 border-b border-green-900/30 pb-2">
                  <span className="font-mono text-green-700">D</span> {'// DZIEN_WYPLATY'}
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                  Wybierz dzień miesiąca, w którym najczęściej otrzymujesz wypłatę. Dzięki temu system odpowiednio wcześnie wyśle powiadomienia i uaktualni status budżetu na dany miesiąc.
                </p>
                <div className="space-y-2 max-w-md pt-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Dzień wypłaty</label>
                  <select
                    value={payday}
                    onChange={(e) => { setPayday(Number(e.target.value)); setStatus("idle"); setMessage(""); }}
                    className="w-full p-4 bg-black/30 border border-green-900/40 font-mono outline-none focus:border-green-600 text-white transition-colors cursor-pointer"
                  >
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <option key={day} value={day}>
                        {day} dzień miesiąca
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {status === "error" && <div className="p-4 border border-red-900/50 bg-red-900/10 text-red-500 text-xs font-mono flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {message}</div>}
              {status === "success" && <div className="p-4 border border-green-900/50 bg-green-900/10 text-green-500 text-xs font-mono flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> {message}</div>}
            </div>

            <div className="p-6 bg-black/20 border-t border-green-900/20 flex justify-end">
              <button type="submit" disabled={status === "saving"} className="px-8 py-3 font-mono text-xs uppercase tracking-wider text-green-400 border border-green-700 bg-green-400/10 hover:bg-green-400/20 transition-all disabled:opacity-40">
                {status === "saving" ? "SAVING..." : "> SAVE_UTILITIES"}
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
  <h2 className="text-xs font-mono font-black text-red-500 uppercase tracking-widest flex items-center gap-2 border-b border-red-900/40 pb-2">
    <AlertTriangle className="w-4 h-4" /> {'// DANGER_ZONE: RESET_DATA'}
  </h2>
  <div className="text-xs font-mono text-zinc-600 max-w-2xl leading-relaxed space-y-2">
    <p>
      Z tego miejsca możesz trwale i nieodwracalnie usunąć wszystkie swoje historyczne dane z aplikacji
      (transakcje, oszczędności, statystyki zdrowotne, wpisy w kalendarzu, pojazdy).
    </p>
    <div className="p-3 border border-green-900/30 bg-black/20">
      <p className="font-mono text-green-600 flex items-center gap-2">
        <Shield className="w-4 h-4" /> {'>'} KONTO_BEZPIECZNE: true
      </p>
      <p className="text-xs font-mono text-zinc-600 mt-1">
        Ta operacja <strong className="text-zinc-400">nie usunie</strong> Twojego konta użytkownika ani hasła.
      </p>
    </div>
    <strong className="text-red-500 block mt-4 font-mono">{`>`} WARN: Tej operacji nie można cofnąć!</strong>
  </div>
</div>

      {!showDeleteConfirm ? (
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="px-6 py-3 font-mono text-xs uppercase tracking-wider text-red-500 border border-red-900/50 hover:bg-red-900/10 transition-all flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" /> {`>`} INIT_DELETE_PROCEDURE
        </button>
      ) : (
        <form onSubmit={handleDeleteData} className="p-5 border border-red-900/50 bg-red-900/10 space-y-5 max-w-2xl animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-start gap-3 text-red-700 dark:text-red-400">
            <AlertCircle className="w-6 h-6 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider">Potwierdzenie autoryzacji</h3>
              <p className="text-xs opacity-90 mt-1">
                Aby zapobiec przypadkowemu usunięciu danych, musisz potwierdzić tę akcję swoim obecnym hasłem.
              </p>
            </div>
          </div>
          
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500/70" />
            <input 
              type={showDeletePassword ? "text" : "password"} 
              placeholder="Wprowadź swoje hasło..." 
              required 
              value={deletePassword} 
              onChange={(e) => { setDeletePassword(e.target.value); setStatus("idle"); setMessage(""); }}
              className="w-full p-4 pl-12 pr-12 bg-black/40 border border-red-900/50 font-mono outline-none focus:border-red-600 text-white transition-colors" 
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
              className="px-4 py-2 font-mono text-xs text-zinc-600 hover:text-zinc-400 border border-green-900/30 hover:border-green-900/50 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={status === "saving" || !deletePassword}
              className="px-6 py-2 font-mono text-xs uppercase text-red-400 border border-red-900/50 bg-red-900/10 hover:bg-red-900/20 transition-all disabled:opacity-40 flex items-center gap-2"
            >
              {status === "saving" ? "DELETING..." : "> CONFIRM_DELETE"}
            </button>
          </div>
        </form>
      )}

      {status === "error" && <div className="p-4 border border-red-900/50 bg-red-900/10 text-red-500 text-xs font-mono flex items-center gap-2 max-w-2xl"><AlertCircle className="w-4 h-4" /> {message}</div>}
      {status === "success" && <div className="p-4 border border-green-900/50 bg-green-900/10 text-green-500 text-xs font-mono flex items-center gap-2 max-w-2xl"><CheckCircle2 className="w-4 h-4" /> {message}</div>}
    </div>
  </div>
)}

      </div>
    </div>
  );
}