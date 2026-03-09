import { getCalendarData } from "@/lib/actions";
import { CalendarUI } from "@/components/calendar/calendar-ui";

// To jest teraz Server Component - wywołuje się automatycznie po każdym zapisie do bazy!
export default async function CalendarPage() {
  const { expenses, incomes } = await getCalendarData();

  return (
    <CalendarUI 
      expenses={expenses} 
      incomes={incomes} 
    />
  );
}