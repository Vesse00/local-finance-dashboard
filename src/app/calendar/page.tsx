import { getCalendarData } from "@/lib/actions";
import { CalendarUI } from "@/components/calendar/calendar-ui";

export default async function CalendarPage() {
  // Teraz pobiera też kategorie z bazy!
  const { expenses, incomes, categories } = await getCalendarData();

  return (
    <CalendarUI 
      expenses={expenses} 
      incomes={incomes} 
      categories={categories} 
    />
  );
}