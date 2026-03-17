"use client";

import { useState, useEffect } from "react";
import { Shield, Mail, Lock, CheckCircle2, AlertCircle, Save, KeyRound, Pencil, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [loading, setLoading] = useState(true);
  
  // Stany formularza
  const [formData, setFormData] = useState({
    newEmail: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Stany interfejsu (UX)
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then(res => res.json())
      .then(data => {
        if (data.email) {
          setCurrentEmail(data.email);
          setFormData(prev => ({ ...prev, newEmail: data.email }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    if (formData.newPassword && formData.newPassword !== formData.confirmPassword) {
      setStatus("error");
      setMessage("Nowe hasła nie są identyczne!");
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newEmail: formData.newEmail !== currentEmail ? formData.newEmail : undefined,
          newPassword: formData.newPassword || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setMessage("Zmiany zostały pomyślnie zapisane.");
        setCurrentEmail(formData.newEmail || currentEmail);
        setIsEditingEmail(false); // Blokujemy z powrotem pole e-mail
        setFormData(prev => ({ ...prev, currentPassword: "", newPassword: "", confirmPassword: "" }));
        
        setTimeout(() => setStatus("idle"), 5000);
      } else {
        setStatus("error");
        setMessage(data.error || "Wystąpił błąd podczas zapisywania.");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Błąd komunikacji z serwerem.");
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-zinc-500 animate-pulse">Wczytywanie ustawień...</div>;
  }

  return (
    <div className="flex-1 p-6 md:p-8 max-w-4xl mx-auto w-full space-y-8">
      
      {/* NAGŁÓWEK */}
      <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 dark:from-zinc-800 dark:to-zinc-900 border border-zinc-200 dark:border-zinc-800/50 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
          <Shield className="w-64 h-64 text-white" />
        </div>
        
        <div className="flex items-center gap-6 z-10">
          <div className="bg-white/10 p-4 rounded-2xl shadow-sm backdrop-blur-md">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <div>
            <span className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wider mb-2 inline-block text-zinc-300">
              Prywatność
            </span>
            <h1 className="text-3xl font-black text-white">Zabezpieczenia Konta</h1>
            <p className="text-zinc-400 mt-1 text-sm max-w-md">Zarządzaj swoim adresem e-mail oraz hasłem dostępu do dashboardu.</p>
          </div>
        </div>
      </div>

      {/* GŁÓWNY FORMULARZ */}
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit}>
          
          <div className="p-6 md:p-8 space-y-8">
            
            {/* SEKCJA 1: E-MAIL (Z OŁÓWKIEM NA HOVER) */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                <Mail className="w-5 h-5 text-indigo-500" /> Adres E-mail
              </h2>
              
              <div className="space-y-2 group max-w-md">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Twój E-mail</span>
                  {isEditingEmail && <span className="text-indigo-500 text-[10px]">Tryb edycji</span>}
                </label>
                <div className="relative flex items-center">
                  <input 
                    type="email" 
                    name="newEmail" 
                    value={formData.newEmail} 
                    onChange={handleChange}
                    readOnly={!isEditingEmail}
                    className={`w-full p-4 pr-12 rounded-xl outline-none font-bold transition-all ${
                      isEditingEmail 
                        ? "bg-zinc-50 dark:bg-zinc-900 border-2 border-indigo-500 text-zinc-900 dark:text-white shadow-sm" 
                        : "bg-zinc-100 dark:bg-zinc-900/50 border-2 border-transparent text-zinc-500"
                    }`} 
                  />
                  {!isEditingEmail && (
                    <button
                      type="button"
                      onClick={() => setIsEditingEmail(true)}
                      className="absolute right-4 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-indigo-500 focus:opacity-100"
                      title="Zmień adres e-mail"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SEKCJA 2: HASŁO (Z PODGLĄDEM) */}
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-900 pb-2">
                <KeyRound className="w-5 h-5 text-emerald-500" /> Zmiana Hasła
              </h2>
              <p className="text-xs text-zinc-500">Zostaw te pola puste, jeśli nie chcesz zmieniać hasła.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Nowe Hasło */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nowe hasło</label>
                  <div className="relative flex items-center">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      name="newPassword" 
                      placeholder="Minimum 6 znaków"
                      value={formData.newPassword} 
                      onChange={handleChange} 
                      className="w-full p-4 pr-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-bold text-zinc-900 dark:text-white transition-colors" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 text-zinc-400 hover:text-emerald-500 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Powtórz Nowe Hasło */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Powtórz nowe hasło</label>
                  <div className="relative flex items-center">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      name="confirmPassword" 
                      placeholder="Powtórz hasło"
                      value={formData.confirmPassword} 
                      onChange={handleChange} 
                      className="w-full p-4 pr-12 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:border-emerald-500 font-bold text-zinc-900 dark:text-white transition-colors" 
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 text-zinc-400 hover:text-emerald-500 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* SEKCJA 3: AUTORYZACJA OBECNYM HASŁEM (WYMAGANA DO ZAPISU) */}
            <div className="p-6 bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/20 rounded-2xl space-y-4 mt-8">
              <div className="flex items-start gap-3 text-red-600 dark:text-red-400">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider">Potwierdzenie tożsamości</h3>
                  <p className="text-xs opacity-80 mt-1">Aby zastosować jakiekolwiek zmiany powyżej, musisz wpisać swoje OBECNE hasło.</p>
                </div>
              </div>
              
              <div className="relative max-w-md">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                <input 
                  type={showCurrentPassword ? "text" : "password"} 
                  name="currentPassword" 
                  required 
                  placeholder="Wpisz obecne hasło..."
                  value={formData.currentPassword} 
                  onChange={handleChange} 
                  className="w-full p-4 pl-12 pr-12 bg-white dark:bg-zinc-950 border border-red-200 dark:border-red-500/30 rounded-xl outline-none focus:border-red-500 font-bold text-zinc-900 dark:text-white transition-colors" 
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400/70 hover:text-red-500 transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* KOMUNIKATY STATUSU */}
            {status === "error" && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4" /> {message}
              </div>
            )}
            {status === "success" && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-bold rounded-xl flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> {message}
              </div>
            )}

          </div>

          <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 flex justify-end">
            <button 
              type="submit" 
              disabled={status === "saving" || !formData.currentPassword} 
              className="px-8 py-4 rounded-xl font-bold text-white bg-indigo-500 hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "saving" ? (
                "Zapisywanie..."
              ) : (
                <><Save className="w-5 h-5" /> Zapisz zmiany</>
              )}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}