"use client";

import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { useLanguage } from "@/components/LanguageProvider";
import { pl } from "date-fns/locale";
import { Archive, FileText, ShieldCheck, Plus, Trash2, CalendarDays, Wallet, AlertTriangle, X, Paperclip, UploadCloud, Award } from "lucide-react";
import { DiscoverPage } from "@/components/DiscoverPage";

export default function DigitalDrawerPage() {
  const { t } = useLanguage();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Stan Modala i Pliku
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"CONTRACT" | "WARRANTY" | "CERTIFICATE">("CONTRACT");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Formularz
  const [formData, setFormData] = useState({
    title: "",
    type: "CONTRACT",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    cost: "",
    isRecurring: true,
    createExpense: false,
    notes: ""
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/drawer`);
      if (res.ok) setItems(await res.json());
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const data = new FormData();
      data.append("title", formData.title);
      data.append("type", formData.type);
      data.append("startDate", formData.startDate);
      data.append("endDate", formData.endDate);
      // Wysyłamy koszty tylko dla umów i sprzętu
      if (formData.type !== "CERTIFICATE") {
        data.append("cost", formData.cost);
        data.append("isRecurring", formData.isRecurring.toString());
        data.append("createExpense", formData.createExpense.toString());
      }
      data.append("notes", formData.notes);
      
      if (selectedFile) {
        data.append("file", selectedFile);
      }

      const res = await fetch("/api/drawer", {
        method: "POST",
        body: data 
      });

      if (res.ok) { 
        setIsAddModalOpen(false); 
        fetchData(); 
      }
    } catch (err) { 
      console.error(err); 
    }
    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("drawer_page.delete_confirm"))) return;
    try {
      const res = await fetch("/api/drawer", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id })
      });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const openModal = (type: "CONTRACT" | "WARRANTY" | "CERTIFICATE") => {
    setFormData({
      title: "", type, startDate: format(new Date(), "yyyy-MM-dd"), endDate: "",
      cost: "", isRecurring: type === "CONTRACT", createExpense: false, notes: ""
    });
    setSelectedFile(null);
    setIsAddModalOpen(true);
  };

  // Filtracja do widoków
  const contracts = items.filter(i => i.type === "CONTRACT");
  const warranties = items.filter(i => i.type === "WARRANTY");
  const certificates = items.filter(i => i.type === "CERTIFICATE");

  // Funkcja obliczająca czas pozostały do końca
  const calculateProgress = (start: string, end: string | null) => {
    if (!end) return { text: t("drawer_page.progress_no_limit"), percent: 0, daysLeft: 9999, color: "bg-zinc-200" };
    
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const now = new Date().getTime();
    
    const totalDuration = endDate - startDate;
    const elapsed = now - startDate;
    const daysLeft = differenceInDays(new Date(end), new Date());
    
    if (daysLeft < 0) return { text: t("drawer_page.progress_expired"), percent: 100, daysLeft, color: "bg-red-500" };
    
    const percent = Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    let color = "bg-emerald-500";
    if (daysLeft <= 30) color = "bg-red-500"; 
    else if (daysLeft <= 90) color = "bg-amber-500"; 

    return { text: t("drawer_page.progress_left").replace("{days}", daysLeft.toString()), percent, daysLeft, color };
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full">
      <DiscoverPage page="drawer" />
      {/* NAGŁÓWEK */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 dark:bg-black/40 backdrop-blur-xl p-4 rounded-3xl border border-black/5 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{t("drawer_page.title")}</h1>
            <p className="text-sm text-zinc-500">{t("drawer_page.subtitle")}</p>
          </div>
        </div>
      </div>

      {/* ZAKŁADKI I PRZYCISKI DODAWANIA */}
      <div className="flex flex-col xl:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap justify-center bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 p-1.5 rounded-2xl shadow-sm gap-1">
          <button onClick={() => setActiveTab("CONTRACT")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "CONTRACT" ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
            <FileText className="w-4 h-4" /> {t("drawer_page.tab_contracts")}
          </button>
          <button onClick={() => setActiveTab("WARRANTY")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "WARRANTY" ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
            <ShieldCheck className="w-4 h-4" /> {t("drawer_page.tab_warranties")}
          </button>
          <button onClick={() => setActiveTab("CERTIFICATE")} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "CERTIFICATE" ? "bg-white dark:bg-zinc-900 text-purple-600 dark:text-purple-400 shadow-sm" : "text-zinc-500 hover:text-zinc-700"}`}>
            <Award className="w-4 h-4" /> {t("drawer_page.tab_certificates")}
          </button>
        </div>

        <button onClick={() => openModal(activeTab)} className={`px-5 py-3 rounded-2xl font-bold text-sm text-white flex items-center gap-2 shadow-lg transition-colors w-full xl:w-auto justify-center ${activeTab === "CONTRACT" ? "bg-blue-500 hover:bg-blue-600 shadow-blue-500/20" : activeTab === "WARRANTY" ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20" : "bg-purple-500 hover:bg-purple-600 shadow-purple-500/20"}`}>
          <Plus className="w-5 h-5" /> 
          {activeTab === "CONTRACT" ? t("drawer_page.add_contract") : activeTab === "WARRANTY" ? t("drawer_page.add_warranty") : t("drawer_page.add_certificate")}
        </button>
      </div>

      {/* ---------------- WIDOK UMÓW ---------------- */}
      {activeTab === "CONTRACT" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
          {contracts.length === 0 && !loading && <p className="col-span-full text-center py-12 text-zinc-500">{t("drawer_page.empty_contracts")}</p>}
          
          {contracts.map(item => {
            const progress = calculateProgress(item.startDate, item.endDate);
            return (
              <div key={item.id} className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-400 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1 leading-tight">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-4">
                    <CalendarDays className="w-3.5 h-3.5" /> {t("drawer_page.from_date")}{format(new Date(item.startDate), "dd.MM.yyyy")}
                  </div>

                  {item.documentUrl && (
                    <a href={item.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-4 border border-zinc-200 dark:border-zinc-700">
                      <Paperclip className="w-4 h-4" /> {t("drawer_page.view_document")}
                    </a>
                  )}
                  
                  {item.cost && (
                    <div className="mb-6 flex items-center gap-2 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50">
                      <Wallet className="w-4 h-4" />
                      <span className="font-black">{item.cost} zł</span>
                      <span className="text-xs uppercase">{item.isRecurring ? t("drawer_page.cost_recurring") : t("drawer_page.cost_one_time")}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-zinc-500 uppercase tracking-wider">{t("drawer_page.status_contract")}</span>
                    <span className={progress.daysLeft <= 30 && progress.daysLeft >= 0 ? "text-red-500 animate-pulse flex items-center gap-1" : "text-zinc-900 dark:text-white"}>
                      {progress.daysLeft <= 30 && progress.daysLeft >= 0 && <AlertTriangle className="w-3 h-3" />} {progress.text}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${progress.color}`} style={{ width: `${progress.percent}%` }}></div>
                  </div>
                  {item.endDate && <p className="text-[10px] text-right mt-1.5 text-zinc-400 font-medium">{t("drawer_page.end_date")}{format(new Date(item.endDate), "dd.MM.yyyy")}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- WIDOK GWARANCJI ---------------- */}
      {activeTab === "WARRANTY" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
          {warranties.length === 0 && !loading && <p className="col-span-full text-center py-12 text-zinc-500">{t("drawer_page.empty_warranties")}</p>}
          
          {warranties.map(item => {
            const progress = calculateProgress(item.startDate, item.endDate);
            return (
              <div key={item.id} className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-400 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1 leading-tight">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-4">
                    <CalendarDays className="w-3.5 h-3.5" /> {t("drawer_page.bought_date")}{format(new Date(item.startDate), "dd.MM.yyyy")}
                  </div>

                  {item.documentUrl && (
                    <a href={item.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-4 border border-zinc-200 dark:border-zinc-700">
                      <Paperclip className="w-4 h-4" /> {t("drawer_page.view_receipt")}
                    </a>
                  )}
                  
                  {item.cost && (
                    <div className="mb-6 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                      <Wallet className="w-4 h-4" />
                      <span className="font-black">{item.cost} zł</span>
                      <span className="text-xs uppercase">{t("drawer_page.equipment_value")}</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-zinc-500 uppercase tracking-wider">{t("drawer_page.warranty_period")}</span>
                    <span className={progress.daysLeft <= 30 && progress.daysLeft >= 0 ? "text-red-500 flex items-center gap-1" : "text-zinc-900 dark:text-white"}>
                      {progress.text}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${progress.color}`} style={{ width: `${progress.percent}%` }}></div>
                  </div>
                  {item.endDate && <p className="text-[10px] text-right mt-1.5 text-zinc-400 font-medium">{t("drawer_page.protection_until")}{format(new Date(item.endDate), "dd.MM.yyyy")}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---------------- WIDOK CERTYFIKATÓW I INNYCH (NOWOŚĆ) ---------------- */}
      {activeTab === "CERTIFICATE" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
          {certificates.length === 0 && !loading && <p className="col-span-full text-center py-12 text-zinc-500">{t("drawer_page.empty_certificates")}</p>}
          
          {certificates.map(item => {
            const progress = calculateProgress(item.startDate, item.endDate);
            return (
              <div key={item.id} className="bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-3xl p-6 shadow-sm flex flex-col justify-between group">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                      <Award className="w-5 h-5" />
                    </div>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-400 hover:text-red-500 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-1 leading-tight">{item.title}</h3>
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 mb-4">
                    <CalendarDays className="w-3.5 h-3.5" /> {t("drawer_page.issued_date")}{format(new Date(item.startDate), "dd.MM.yyyy")}
                  </div>

                  {item.documentUrl && (
                    <a href={item.documentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors mb-4 border border-zinc-200 dark:border-zinc-700">
                      <Paperclip className="w-4 h-4" /> {t("drawer_page.view_attachment")}
                    </a>
                  )}
                  
                  {item.notes && (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl">
                      {item.notes}
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-zinc-500 uppercase tracking-wider">{t("drawer_page.validity_status")}</span>
                    <span className={progress.daysLeft <= 30 && progress.daysLeft >= 0 ? "text-red-500 flex items-center gap-1" : "text-zinc-900 dark:text-white"}>
                      {progress.text}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${progress.color}`} style={{ width: `${progress.percent}%` }}></div>
                  </div>
                  {item.endDate && <p className="text-[10px] text-right mt-1.5 text-zinc-400 font-medium">{t("drawer_page.valid_until")}{format(new Date(item.endDate), "dd.MM.yyyy")}</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ==============================================
          MODAL: DODAWANIE DO SZUFLADY
      =============================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className={`flex justify-between items-center p-6 border-b border-zinc-100 dark:border-zinc-800 ${formData.type === "CONTRACT" ? "bg-blue-500/5" : formData.type === "WARRANTY" ? "bg-emerald-500/5" : "bg-purple-500/5"}`}>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {formData.type === "CONTRACT" ? <><FileText className="w-5 h-5 text-blue-500" /> {t("drawer_page.modal_title_contract")}</> : formData.type === "WARRANTY" ? <><ShieldCheck className="w-5 h-5 text-emerald-500" /> {t("drawer_page.modal_title_warranty")}</> : <><Award className="w-5 h-5 text-purple-500" /> {t("drawer_page.modal_title_certificate")}</>}
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 space-y-5 overflow-y-auto">
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">
                  {formData.type === "CONTRACT" ? t("drawer_page.name_label_contract") : formData.type === "WARRANTY" ? t("drawer_page.name_label_warranty") : t("drawer_page.name_label_certificate")}
                </label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-indigo-500 transition-all font-bold" />
              </div>

              {/* SEKACJA UPLOADU PLIKÓW (Z poprawką na długie nazwy) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">{t("drawer_page.attachment_label")}</label>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-zinc-300 dark:border-zinc-700 border-dashed rounded-2xl cursor-pointer bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors overflow-hidden px-4">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full">
                    <UploadCloud className="w-6 h-6 text-zinc-400 mb-2 flex-shrink-0" />
                    <p className="text-sm text-zinc-500 font-medium truncate max-w-full text-center">
                      {selectedFile ? selectedFile.name : t("drawer_page.click_to_upload")}
                    </p>
                  </div>
                  <input type="file" className="hidden" onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">{formData.type === "CERTIFICATE" ? t("drawer_page.date_start_cert") : formData.type === "CONTRACT" ? t("drawer_page.date_start_contract") : t("drawer_page.date_start_warranty")}</label>
                  <input type="date" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">{formData.type === "CERTIFICATE" ? t("drawer_page.date_end_cert") : formData.type === "CONTRACT" ? t("drawer_page.date_end_contract") : t("drawer_page.date_end_warranty")}</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none font-medium" />
                </div>
              </div>

              {/* SEKCJA FINANSOWA (Wyświetlana tylko jeśli to NIE JEST Certyfikat) */}
              {formData.type !== "CERTIFICATE" && (
                <>
                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">{t("drawer_page.cost_label")}</label>
                    <input type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-blue-500 transition-all font-mono text-xl font-bold" placeholder="np. 1500" />
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 mt-4 space-y-3">
                    <label className="flex items-center justify-between cursor-pointer">
                      <span className="font-bold text-amber-700 dark:text-amber-500 text-sm flex items-center gap-2"><Wallet className="w-4 h-4"/> Powiąż z finansami</span>
                      <input type="checkbox" checked={formData.createExpense} onChange={(e) => setFormData({...formData, createExpense: e.target.checked})} className="w-5 h-5 rounded border-zinc-300 text-amber-500 focus:ring-amber-500" />
                    </label>
                    
                    {formData.createExpense && (
                      <div className="pl-6 pt-2 border-l-2 border-amber-200 dark:border-amber-800 animate-in fade-in">
                        <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">{t("drawer_page.create_expense")}</p>
                        <div className="flex gap-2">
                          <button onClick={() => setFormData({...formData, isRecurring: false})} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${!formData.isRecurring ? "bg-amber-500 text-white border-amber-500" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"}`}>{t("drawer_page.one_time_billing")}</button>
                          <button onClick={() => setFormData({...formData, isRecurring: true})} className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${formData.isRecurring ? "bg-amber-500 text-white border-amber-500" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700"}`}>{t("drawer_page.recurring_billing")}</button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Notatki dla certyfikatów */}
              {formData.type === "CERTIFICATE" && (
                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Dodatkowe informacje (Numer dokumentu, kategoria)</label>
                  <input type="text" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 outline-none focus:border-purple-500 transition-all font-medium" placeholder="np. Kat. B, Numer: 123456" />
                </div>
              )}

            </div>

            <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3 border-t border-zinc-100 dark:border-zinc-800">
              <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3.5 px-4 rounded-xl font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 transition-colors">{t("drawer_page.cancel_btn")}</button>
              <button onClick={handleSave} disabled={isSaving} className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-white hover:opacity-90 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${formData.type === "CONTRACT" ? "bg-blue-500 shadow-blue-500/20" : formData.type === "WARRANTY" ? "bg-emerald-500 shadow-emerald-500/20" : "bg-purple-500 shadow-purple-500/20"}`}>
                {isSaving ? t("drawer_page.saving") : <><Archive className="w-5 h-5" /> {t("drawer_page.save_btn")}</>}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}