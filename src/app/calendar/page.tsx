import { getCalendarData } from "@/lib/actions";
import { CalendarUI } from "@/components/calendar/calendar-ui";
import { DiscoverPage } from "@/components/DiscoverPage";

const safeSerialize = (data: any) => 
  JSON.parse(JSON.stringify(data, (key, value) => 
    typeof value === 'bigint' ? value.toString() : value
  ));

export default async function CalendarPage() {
  // Teraz pobiera też kategorie z bazy!
  const { expenses, incomes, categories, currency } = await getCalendarData();

  return (
    <>
      <DiscoverPage page="calendar" />
      <CalendarUI
        expenses={safeSerialize(expenses)}
        incomes={safeSerialize(incomes)}
        categories={safeSerialize(categories)}
        currency={currency}
      />
    </>
  );
}