import fs from 'fs';

const filePath = 'd:/Code/PersonalData/local-finance-dashboard/src/app/drawer/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// 0. Inject import and destructure
if (!content.includes('useLanguage')) {
    content = content.replace(
        'import { format, differenceInDays } from "date-fns";',
        'import { format, differenceInDays } from "date-fns";\nimport { useLanguage } from "@/components/LanguageProvider";'
    );
    content = content.replace(
        'export default function DigitalDrawerPage() {',
        'export default function DigitalDrawerPage() {\n  const { t } = useLanguage();'
    );
}

const replacements = [
  ['"Czy na pewno chcesz usunąć ten dokument ze schowka?"', 't("drawer_page.delete_confirm")'],
  ['"Bezterminowo"', 't("drawer_page.progress_no_limit")'],
  ['"Wygasło"', 't("drawer_page.progress_expired")'],
  ['`Pozostało ${daysLeft} dni`', 't("drawer_page.progress_left").replace("{days}", daysLeft)'],
  ['Cyfrowa Szuflada', '{t("drawer_page.title")}'],
  ['Zarządzaj swoimi umowami, sprzętem i ważnymi dokumentami', '{t("drawer_page.subtitle")}'],
  ['Umowy i Abonamenty', '{t("drawer_page.tab_contracts")}'],
  ['Sprzęt i Gwarancje', '{t("drawer_page.tab_warranties")}'],
  ['Certyfikaty i Inne', '{t("drawer_page.tab_certificates")}'],
  ['Dodaj {activeTab === "CONTRACT" ? "nową umowę" : activeTab === "WARRANTY" ? "nowy sprzęt" : "nowy dokument"}', '{activeTab === "CONTRACT" ? t("drawer_page.add_contract") : activeTab === "WARRANTY" ? t("drawer_page.add_warranty") : t("drawer_page.add_certificate")}'],
  ['Nie masz jeszcze dodanych umów. Kliknij przycisk wyżej, aby dodać pierwszą.', '{t("drawer_page.empty_contracts")}'],
  ['Brak zapisanych sprzętów i gwarancji.', '{t("drawer_page.empty_warranties")}'],
  ['Brak zapisanych certyfikatów i dokumentów.', '{t("drawer_page.empty_certificates")}'],
  ['Od: {format', '{t("drawer_page.from_date")}{format'],
  ['Zobacz dokument', '{t("drawer_page.view_document")}'],
  ['/ cykl', '{t("drawer_page.cost_recurring")}'],
  ['jednorazowo', '{t("drawer_page.cost_one_time")}'],
  ['Status umowy', '{t("drawer_page.status_contract")}'],
  ['Koniec: {format', '{t("drawer_page.end_date")}{format'],
  ['Kupiono: {format', '{t("drawer_page.bought_date")}{format'],
  ['Pokaż paragon', '{t("drawer_page.view_receipt")}'],
  ['wartość sprzętu', '{t("drawer_page.equipment_value")}'],
  ['Okres Gwarancji', '{t("drawer_page.warranty_period")}'],
  ['Ochrona do: {format', '{t("drawer_page.protection_until")}{format'],
  ['Wydano: {format', '{t("drawer_page.issued_date")}{format'],
  ['Zobacz załącznik', '{t("drawer_page.view_attachment")}'],
  ['Status Ważności', '{t("drawer_page.validity_status")}'],
  ['Ważne do: {format', '{t("drawer_page.valid_until")}{format'],
  ['<FileText className="w-5 h-5 text-blue-500" /> Nowa Umowa', '<FileText className="w-5 h-5 text-blue-500" /> {t("drawer_page.modal_title_contract")}'],
  ['<ShieldCheck className="w-5 h-5 text-emerald-500" /> Nowy Sprzęt', '<ShieldCheck className="w-5 h-5 text-emerald-500" /> {t("drawer_page.modal_title_warranty")}'],
  ['<Award className="w-5 h-5 text-purple-500" /> Nowy Dokument / Certyfikat', '<Award className="w-5 h-5 text-purple-500" /> {t("drawer_page.modal_title_certificate")}'],
  ['Nazwa ({formData.type === "CONTRACT" ? "np. Internet UPC" : formData.type === "WARRANTY" ? "np. Pralka Bosch" : "np. Prawo Jazdy, Umowa o Pracę, SEP"})', '{formData.type === "CONTRACT" ? t("drawer_page.name_label_contract") : formData.type === "WARRANTY" ? t("drawer_page.name_label_warranty") : t("drawer_page.name_label_certificate")}'],
  ['Załącznik (Skan, PDF, Zdjęcie)', '{t("drawer_page.attachment_label")}'],
  ['"Kliknij, aby wgrać plik"', 't("drawer_page.click_to_upload")'],
  ['{formData.type === "CERTIFICATE" ? "Data uzyskania / wydania" : formData.type === "CONTRACT" ? "Data zawarcia" : "Data zakupu"}', '{formData.type === "CERTIFICATE" ? t("drawer_page.date_start_cert") : formData.type === "CONTRACT" ? t("drawer_page.date_start_contract") : t("drawer_page.date_start_warranty")}'],
  ['{formData.type === "CERTIFICATE" ? "Ważne do (Opcjonalnie)" : formData.type === "CONTRACT" ? "Zakończenie umowy" : "Koniec gwarancji"}', '{formData.type === "CERTIFICATE" ? t("drawer_page.date_end_cert") : formData.type === "CONTRACT" ? t("drawer_page.date_end_contract") : t("drawer_page.date_end_warranty")}'],
  ['Kwota / Koszt', '{t("drawer_page.cost_label")}'],
  ['{formData.type === "CONTRACT" ? "Koszt abonamentu (PLN)" : "Kwota zakupu (PLN)"}', '{formData.type === "CONTRACT" ? t("drawer_page.cost_desc_contract") : t("drawer_page.cost_desc_warranty")}'],
  ['Rozliczanie cykliczne (Abonament)', '{t("drawer_page.recurring_billing")}'],
  ['Jednorazowa opłata', '{t("drawer_page.one_time_billing")}'],
  ['Dodaj automatycznie wydatek w kalendarzu w dniu startu', '{t("drawer_page.create_expense")}'],
  ['Notatki / Dodatkowe informacje', '{t("drawer_page.notes_label")}'],
  ['Anuluj', '{t("drawer_page.cancel_btn")}'],
  ['{isSaving ? "Zapisywanie..." : "Zapisz Dokument"}', '{isSaving ? t("drawer_page.saving") : t("drawer_page.save_btn")}']
];

for (const [search, replace] of replacements) {
    if(content.includes(search)) {
        content = content.replaceAll(search, replace);
    } else {
        console.log("Could not find:", search);
    }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Drawer translation done!");
