const fs = require('fs');

const replaceInFile = (path, oldStr, newStr) => {
    let content = fs.readFileSync(path, 'utf8');
    content = content.split(oldStr).join(newStr);
    fs.writeFileSync(path, content);
};

// 1. `daily/page.tsx` -> `daily-page-client.tsx`

let dailyContent = fs.readFileSync('d:/Code/PersonalData/local-finance-dashboard/src/app/health/daily/page.tsx', 'utf8');
dailyContent = dailyContent.replace(
  'export default function DailyHealthPage() {', 
  'import { useLanguage } from "@/components/LanguageProvider";\n\nexport function DailyPageClient({ initialDays, initialEntries }: { initialDays?: any[], initialEntries?: any[] }) {\n  const { t } = useLanguage();'
);
// replace hooks initial state
dailyContent = dailyContent.replace(
  'const [healthDays, setHealthDays] = useState<any[]>([]);',
  'const [healthDays, setHealthDays] = useState<any[]>(initialDays || []);'
);
dailyContent = dailyContent.replace(
  'const [healthEntries, setHealthEntries] = useState<any[]>([]);',
  'const [healthEntries, setHealthEntries] = useState<any[]>(initialEntries || []);'
);

// text replacements daily
const dailyTranslates = [
  ['Dziennik Aktywności', '{t("health_daily.title")}'],
  ['Dodawaj treningi z detalami i posiłki, używając plusika w kalendarzu.', '{t("health_daily.subtitle")}'],
  ['>Zwyczajnie<', '>{t("health_daily.mode_zen")}<'],
  ['Kalendarz<', '{t("health_daily.mode_calendar")}<'],
  ['Tryb PRO<', '{t("health_daily.mode_pro")}<'],
  ['Trening', '{t("health_daily.workout")}'],
  ['Kalorie', '{t("health_daily.calories")}'],
  ['Nazwa Treningu', '{t("health_daily.workout_name")}'],
  ['np. Chest Day, Push', '{t("health_daily.workout_placeholder")}'],
  ['Co zjadłeś? (Opcjonalnie)', '{t("health_daily.meal_name")}'],
  ['np. Tosty, Sałatka', '{t("health_daily.meal_placeholder")}'],
  ['Lista ćwiczeń', '{t("health_daily.exercise_list")}'],
  ['Opcjonalnie<', '{t("health_daily.optional")}<'],
  ['Dodaj kolejne ćwiczenie', '{t("health_daily.add_exercise_btn")}'],
  ['Ilość kalorii', '{t("health_daily.calories_amount")}'],
  ['Dodaj wpis do Dziennika', '{t("health_daily.save_journal_btn")}'],
  ['Wpisy z ', '{t("health_daily.entries_from")} '],
  ['Twoje Treningi', '{t("health_daily.your_workouts")}'],
  ['Brak treningów w tym dniu.', '{t("health_daily.no_workouts")}'],
  ['Posiłki / Kalorie', '{t("health_daily.meals_calories")}'],
  ['Razem:', '{t("health_daily.total")}:'],
  ['Brak wpisów kalorycznych.', '{t("health_daily.no_meals")}'],
  ['Nawodnienie', '{t("health_daily.hydration")}'],
  ['/ {targetWater} szklanek', '/ {targetWater} {t("health_daily.glasses")}'],
  ['Cel nawodnienia', '{t("health_daily.water_target")}'],
  ['Ustaw, ile szklanek wody dziennie chcesz wypijać (1 szklanka to ok. 250ml).', '{t("health_daily.water_desc")}'],
  ['Zapisz Cel', '{t("health_daily.save_target")}'],
  ['Wczytywanie...', '{t("health_daily.loading")}'],
  ['Anuluj', '{t("health_daily.cancel")}']
];

for (const [pl, en] of dailyTranslates) {
    dailyContent = dailyContent.split(pl).join(en);
}

fs.writeFileSync('d:/Code/PersonalData/local-finance-dashboard/src/app/health/daily/daily-page-client.tsx', dailyContent);

// 2. new `daily/page.tsx` (server)
const dailyServer = `import { prisma } from "@/lib/db";
import { DailyPageClient } from "./daily-page-client";
import { startOfMonth, endOfMonth } from "date-fns";

export default async function DailyHealthPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <div className="p-10 text-center">Brak dostępu</div>;

  const now = new Date();
  const startDate = startOfMonth(now);
  const endDate = endOfMonth(now);

  const initialDays = await prisma.healthDay.findMany({
    where: { 
      userId: user.id,
      date: { gte: startDate, lte: endDate }
    }
  });

  const initialEntries = await prisma.healthEntry.findMany({
    where: {
      userId: user.id,
      date: { gte: startDate, lte: endDate }
    }
  });

  return <DailyPageClient initialDays={initialDays} initialEntries={initialEntries} />;
}
`;
fs.writeFileSync('d:/Code/PersonalData/local-finance-dashboard/src/app/health/daily/page.tsx', dailyServer);

// 3. `body/page.tsx` -> `body-page-client.tsx`

let bodyContent = fs.readFileSync('d:/Code/PersonalData/local-finance-dashboard/src/app/health/body/page.tsx', 'utf8');
bodyContent = bodyContent.replace(
  'export default function BodyMeasurementsPage() {', 
  'import { useLanguage } from "@/components/LanguageProvider";\n\nexport function BodyPageClient({ initialData }: { initialData?: any[] }) {\n  const { t } = useLanguage();'
);
bodyContent = bodyContent.replace(
  'const [healthData, setHealthData] = useState<any[]>([]);',
  'const [healthData, setHealthData] = useState<any[]>(initialData || []);'
);

const bodyTranslates = [
  ['Waga i Wymiary', '{t("health_body.title")}'],
  ['Śledź swój progres i kształtowanie sylwetki', '{t("health_body.subtitle")}'],
  ['Płeć / Wiek / Wzrost', '{t("health_body.settings_btn")}'],
  ['Dodaj pomiar', '{t("health_body.add_measurement_btn")}'],
  ['Aktualna Waga', '{t("health_body.current_weight")}'],
  ['Zmiana całkowita', '{t("health_body.total_change")}'],
  ['Spadek', '{t("health_body.weight_drop")}'],
  ['Wzrost<', '{t("health_body.weight_rise")}<'],
  ['Wskaźnik BMI', '{t("health_body.bmi_indicator")}'],
  ['Niedowaga', '{t("health_body.bmi_underweight")}'],
  ['Prawidłowa', '{t("health_body.bmi_normal")}'],
  ['Nadwaga', '{t("health_body.bmi_overweight")}'],
  ['Otyłość', '{t("health_body.bmi_obese")}'],
  ['Brak danych', '{t("health_body.no_data")}'],
  ['Obwód Talii', '{t("health_body.waist_circumference")}'],
  ['Wykres zmian', '{t("health_body.weight_chart_title")}'],
  ['Historia Pomiarów', '{t("health_body.measurement_history")}'],
  ['Klatka:', '{t("health_body.chest")}:'],
  ['Pas:', '{t("health_body.waist")}:'],
  ['Biodra:', '{t("health_body.hips")}:'],
  ['Biceps:', '{t("health_body.biceps")}:'],
  ['Udo:', '{t("health_body.thigh")}:'],
  ['Waga (kg)', '{t("health_body.weight")} (kg)'],
  ['Wzrost (cm)', '{t("health_body.height")} (cm)'],
  ['Dodaj nowe wymiary', '{t("health_body.add_new_title")}'],
  ['Edytuj wymiary', '{t("health_body.edit_title")}'],
  ['Zapisz wymiary', '{t("health_body.save")}'],
  ['Zapisz Pomiar', '{t("health_body.save")}'],
  ['Parametry Podstawowe', '{t("health_body.settings_title")}'],
  ['Płeć', '{t("health_body.gender")}'],
  ['Mężczyzna', '{t("health_body.gender_male")}'],
  ['Kobieta', '{t("health_body.gender_female")}'],
  ['Wiek</label>', '{t("health_body.age")}</label>'],
  ['Zapisz', '{t("health_body.save_settings")}'],
];

for (const [pl, en] of bodyTranslates) {
    bodyContent = bodyContent.split(pl).join(en);
}

fs.writeFileSync('d:/Code/PersonalData/local-finance-dashboard/src/app/health/body/body-page-client.tsx', bodyContent);

// 4. new `body/page.tsx` (server)
const bodyServer = `import { prisma } from "@/lib/db";
import { BodyPageClient } from "./body-page-client";

export default async function BodyMeasurementsPage() {
  const user = await prisma.user.findFirst();
  if (!user) return <div className="p-10 text-center">Brak dostępu</div>;

  const healthData = await prisma.healthDay.findMany({
    where: { userId: user.id }
  });

  const filteredData = healthData.filter(d => d.weight || d.chest || d.waist || d.hips || d.biceps || d.thigh);

  return <BodyPageClient initialData={filteredData} />;
}
`;
fs.writeFileSync('d:/Code/PersonalData/local-finance-dashboard/src/app/health/body/page.tsx', bodyServer);

console.log("Refactoring complete.");
