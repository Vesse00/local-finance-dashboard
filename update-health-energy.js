const fs = require('fs');

const languages = ['en', 'pl'];

const translations = {
  en: {
    health_energy: {
      "title": "Energy Garden",
      "subtitle": "Your Zen Garden - observe the ebb and flow of vital forces.",
      "stream_of_time": "Stream of Time",
      "empty_history": "You haven't planted the first seed in your garden yet.",
      "overall": "Overall",
      "work": "Work",
      "free_time": "Free Time",
      "delete_tooltip": "Remove entry from garden",
      "state_1": "Exhaustion",
      "state_2": "Low Level",
      "state_3": "Normal",
      "state_4": "Full Tank",
      "state_5": "Overcharged",
      "mind_state": "State of Mind",
      "avg_whole_day": "Daily average (Automatic)",
      "overall_power": "Overall power (Whole day)",
      "split_phases": "Split into Day Phases",
      "merge_phases": "Combine back into whole day",
      "slider_work": "Mind state during WORK",
      "slider_free": "Mind state during FREE TIME",
      "note_placeholder": "What's on your mind? E.g. 'Great morning, but then a tough meeting'...",
      "save_journal": "Save in journal"
    }
  },
  pl: {
    health_energy: {
      "title": "Ogród Energii",
      "subtitle": "Twój Zen Garden - obserwuj przypływy i odpływy sił witalnych.",
      "stream_of_time": "Strumień Czasu",
      "empty_history": "Jeszcze nie zasiałeś pierwszego nasiona w swoim ogrodzie.",
      "overall": "Ogólnie",
      "work": "Praca",
      "free_time": "Wolne",
      "delete_tooltip": "Usuń wpis z ogrodu",
      "state_1": "Wyczerpanie",
      "state_2": "Niski Poziom",
      "state_3": "W Normie",
      "state_4": "Pełny Bak",
      "state_5": "Overcharged",
      "mind_state": "Stan Umysłu",
      "avg_whole_day": "Średnia z całego dnia (Automatyczna)",
      "overall_power": "Zasilanie ogólne (Cały dzień)",
      "split_phases": "Rozdziel na Fazy Dnia",
      "merge_phases": "Połącz z powrotem w cały dzień",
      "slider_work": "Stan umysłu w trakcie PRACY",
      "slider_free": "Stan umysłu w CZASIE WOLNYM",
      "note_placeholder": "Co zaprząta Twoje myśli? Np. 'Świetny poranek, ale potem ciężkie spotkanie'...",
      "save_journal": "Zapisz w dzienniku"
    }
  }
};

for (const lang of languages) {
  const filePath = `d:/Code/PersonalData/local-finance-dashboard/src/lib/i18n/dictionaries/${lang}.json`;
  let fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  fileData.health_energy = translations[lang].health_energy;
  fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2), 'utf8');
}
console.log("Health energy dictionaries updated");
