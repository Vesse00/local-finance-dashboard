import fs from 'fs';

const filePath = 'd:/Code/PersonalData/local-finance-dashboard/src/app/work-schedule/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

const replacements = [
  ['"Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Ndz"', 't("work_schedule.days_short_mon"), t("work_schedule.days_short_tue"), t("work_schedule.days_short_wed"), t("work_schedule.days_short_thu"), t("work_schedule.days_short_fri"), t("work_schedule.days_short_sat"), t("work_schedule.days_short_sun")'],
  ['"Zarządzaj czasem pracy, urlopami i L4"', 't("work_schedule.subtitle")'],
  ['<h1 className="text-xl font-bold">Grafik Pracy</h1>', '<h1 className="text-xl font-bold">{t("work_schedule.title")}</h1>'],
  ['Kreator Grafiku', '{t("work_schedule.wizard_btn")}'],
  ['Wczytywanie...', '{t("work_schedule.loading")}'],
  ['+ ${dayData.overtimeHours}h Nadgodzin', '+ {dayData.overtimeHours}h {t("work_schedule.overtime_badge").replace("+ {hours}h ", "")}'],
  ['<Umbrella className="w-3 h-3" /> Urlop', '<Umbrella className="w-3 h-3" /> {t("work_schedule.vacation")}'],
  ['<Stethoscope className="w-3 h-3" /> L4', '<Stethoscope className="w-3 h-3" /> {t("work_schedule.sick_leave")}'],
  ['Zarządzanie masowe', '{t("work_schedule.bulk_modal_title")}'],
  ['Dodaj / Nadpisz', '{t("work_schedule.tab_add")}'],
  ['Wyczyść Okres', '{t("work_schedule.tab_clear")}'],
  ['Typ wpisu', '{t("work_schedule.entry_type")}'],
  ['<Briefcase className="w-4 h-4" /> Praca', '<Briefcase className="w-4 h-4" /> {t("work_schedule.work")}'],
  ['<Umbrella className="w-4 h-4" /> Urlop', '<Umbrella className="w-4 h-4" /> {t("work_schedule.vacation")}'],
  ['<Stethoscope className="w-4 h-4" /> L4', '<Stethoscope className="w-4 h-4" /> {t("work_schedule.sick_leave")}'],
  ['Okres działania', '{t("work_schedule.active_period")}'],
  ['Od kiedy?', '{t("work_schedule.from_date")}'],
  ['Do kiedy?', '{t("work_schedule.to_date")}'],
  ['System pracy', '{t("work_schedule.work_system")}'],
  ['Stały (1 Zmiana)', '{t("work_schedule.shift_type_1")}'],
  ['Rotacyjny (2 Zmiany)', '{t("work_schedule.shift_type_2")}'],
  ['Rotacyjny (3 Zmiany)', '{t("work_schedule.shift_type_3")}'],
  ['Godzina rozpoczęcia', '{t("work_schedule.start_time")}'],
  ['Godzina zakończenia', '{t("work_schedule.end_time")}'],
  ['Zmiana Pierwsza', '{t("work_schedule.shift_1")}'],
  ['Zmiana Druga', '{t("work_schedule.shift_2")}'],
  ['Zmiana Trzecia', '{t("work_schedule.shift_3")}'],
  ['Od jakiej zmiany zaczynasz (od daty początkowej)?', '{t("work_schedule.start_from_shift")}'],
  ['<option value="1">Pierwsza</option>', '<option value="1">{t("work_schedule.first_shift_opt")}</option>'],
  ['<option value="2">Druga</option>', '<option value="2">{t("work_schedule.second_shift_opt")}</option>'],
  ['<option value="3">Trzecia</option>', '<option value="3">{t("work_schedule.third_shift_opt")}</option>'],
  ['Dotyczy dni tygodnia', '{t("work_schedule.week_days_applied")}'],
  ['Pierwsza', '{t("work_schedule.first_shift_opt")}'],
  ['Druga', '{t("work_schedule.second_shift_opt")}'],
  ['Trzecia', '{t("work_schedule.third_shift_opt")}'],
  ['{ label: "Pon", val: 1 }', '{ label: t("work_schedule.days_short_mon"), val: 1 }'],
  ['{ label: "Wt", val: 2 }', '{ label: t("work_schedule.days_short_tue"), val: 2 }'],
  ['{ label: "Śr", val: 3 }', '{ label: t("work_schedule.days_short_wed"), val: 3 }'],
  ['{ label: "Czw", val: 4 }', '{ label: t("work_schedule.days_short_thu"), val: 4 }'],
  ['{ label: "Pt", val: 5 }', '{ label: t("work_schedule.days_short_fri"), val: 5 }'],
  ['{ label: "Sob", val: 6 }', '{ label: t("work_schedule.days_short_sat"), val: 6 }'],
  ['{ label: "Ndz", val: 0 }', '{ label: t("work_schedule.days_short_sun"), val: 0 }'],
  ['Anuluj', '{t("work_schedule.cancel_btn")}'],
  ['Zapisz w kalendarzu', '{t("work_schedule.save_in_calendar")}'],
  ['Wyczyść Grafik', '{t("work_schedule.clear_schedule")}'],
  ['Grafik na:', '{t("work_schedule.edit_modal_title")}'],
  ['Rozliczenie dnia', '{t("work_schedule.checkout_day")}'],
  ['Łączny czas w pracy', '{t("work_schedule.total_work_time")}'],
  ['Standardowy początek', '{t("work_schedule.std_start")}'],
  ['Standardowy koniec', '{t("work_schedule.std_end")}'],
  ['Przedłużyłem zmianę (Nadgodziny)', '{t("work_schedule.extended_shift")}'],
  ['Do której godziny faktycznie byłeś w pracy?', '{t("work_schedule.actual_end_time")}'],
  ['Ten dzień zostanie oznaczony jako wolny od pracy ({formData.shiftType === "VACATION" ? "Urlop" : "L4"}).', '{t("work_schedule.free_day_notice").replace("{type}", formData.shiftType === "VACATION" ? t("work_schedule.vacation") : t("work_schedule.sick_leave"))}'],
  ['Zapisz wpis', '{t("work_schedule.save_entry")}'],
  ['alert("Data zakończenia nie może być mniejsza niż początkowa!");', 'alert(t("work_schedule.alert_date_order"));'],
  ['alert("W wybranym przedziale nie ma żadnych pasujących dni pracy.");', 'alert(t("work_schedule.alert_no_matching_days"));'],
  ['alert(`Wygenerowano wpisy dla ${payload.length} dni.`);', 'alert(t("work_schedule.alert_generated").replace("{count}", payload.length));'],
  ['alert("Błąd podczas generowania.");', 'alert(t("work_schedule.alert_gen_error"));'],
  ['confirm("Czy na pewno chcesz usunąć wybrany okres grafiku? Ta akcja jest nieodwracalna!")', 'confirm(t("work_schedule.alert_delete_confirm"))'],
  ['alert("Błąd podczas usuwania.");', 'alert(t("work_schedule.alert_del_error"));']
];

for (const [search, replace] of replacements) {
    if(content.includes(search)) {
        content = content.replaceAll(search, replace);
    } else {
        console.log("Could not find:", search);
    }
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Translation done!");
